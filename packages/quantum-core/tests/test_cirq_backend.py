"""
Tests for CirqBackend implementation and BackendRegistry plugin discovery.
"""

import math
import pytest

from quantum_core.backend import CircuitSpec, GateName, GateSpec
from quantum_core.cirq_backend import CirqBackend
from quantum_core.qiskit_backend import QiskitBackend
from quantum_core.registry import BackendRegistry, get_backend, list_backends, register_backend


class TestCirqBackend:
    """Tests for the CirqBackend implementation."""

    def test_backend_name(self) -> None:
        """CirqBackend name property should return 'cirq-simulator'."""
        backend = CirqBackend()
        assert backend.name == "cirq-simulator"

    def test_bell_state_execution(self) -> None:
        """
        Executing Bell state (|00⟩ + |11⟩)/√2 with Cirq backend.
        Verify statevector amplitude magnitude is ~1/√2 for |00⟩ and |11⟩,
        and probabilities match expected.
        """
        backend = CirqBackend()
        spec = CircuitSpec(
            num_qubits=2,
            gates=[
                GateSpec(gate=GateName.H, qubits=[0]),
                GateSpec(gate=GateName.CX, qubits=[0, 1]),
            ],
        )

        result = backend.execute(spec, shots=500)

        assert result.backend_name == "cirq-simulator"
        assert len(result.statevector) == 4

        # Amplitudes for |00⟩ (index 0) and |11⟩ (index 3) should be ~1/√2 (0.7071)
        amp_00_real = result.statevector[0][0]
        amp_11_real = result.statevector[3][0]

        assert amp_00_real == pytest.approx(1 / math.sqrt(2), abs=1e-5)
        assert amp_11_real == pytest.approx(1 / math.sqrt(2), abs=1e-5)

        # Probabilities
        assert result.probabilities.get("00", 0.0) == pytest.approx(0.5, abs=1e-4)
        assert result.probabilities.get("11", 0.0) == pytest.approx(0.5, abs=1e-4)

        # Generated code should contain cirq
        assert "import cirq" in result.generated_code
        assert "cirq.H" in result.generated_code
        assert "cirq.CNOT" in result.generated_code

    def test_qiskit_vs_cirq_equivalence(self) -> None:
        """
        Statevectors and probabilities produced by QiskitBackend and CirqBackend
        must be identical for the same circuit (LSB bit ordering parity).
        """
        qiskit_backend = QiskitBackend()
        cirq_backend = CirqBackend()

        spec = CircuitSpec(
            num_qubits=3,
            gates=[
                GateSpec(gate=GateName.H, qubits=[0]),
                GateSpec(gate=GateName.X, qubits=[1]),
                GateSpec(gate=GateName.CX, qubits=[0, 2]),
                GateSpec(gate=GateName.CCX, qubits=[0, 1, 2]),
            ],
        )

        qiskit_res = qiskit_backend.execute(spec, shots=0)
        cirq_res = cirq_backend.execute(spec, shots=0)

        # Compare probabilities
        for state in set(qiskit_res.probabilities.keys()).union(cirq_res.probabilities.keys()):
            p_qiskit = qiskit_res.probabilities.get(state, 0.0)
            p_cirq = cirq_res.probabilities.get(state, 0.0)
            assert p_qiskit == pytest.approx(p_cirq, abs=1e-5)

        # Compare statevectors element by element
        for sv_q, sv_c in zip(qiskit_res.statevector, cirq_res.statevector):
            assert sv_q[0] == pytest.approx(sv_c[0], abs=1e-5)  # real
            assert sv_q[1] == pytest.approx(sv_c[1], abs=1e-5)  # imag

    def test_execute_steps(self) -> None:
        """Step-by-step execution in CirqBackend."""
        backend = CirqBackend()
        spec = CircuitSpec(
            num_qubits=1,
            gates=[
                GateSpec(gate=GateName.H, qubits=[0]),
                GateSpec(gate=GateName.Z, qubits=[0]),
            ],
        )

        steps = backend.execute_steps(spec)
        assert len(steps) == 3  # step 0 (initial), step 1 (H), step 2 (Z)

        # Step 0: |0⟩
        assert steps[0].statevector[0][0] == pytest.approx(1.0)
        assert steps[0].statevector[1][0] == pytest.approx(0.0)

        # Step 1: H|0⟩ = (|0⟩ + |1⟩)/√2
        assert steps[1].statevector[0][0] == pytest.approx(1 / math.sqrt(2))
        assert steps[1].statevector[1][0] == pytest.approx(1 / math.sqrt(2))

        # Step 2: Z((|0⟩ + |1⟩)/√2) = (|0⟩ - |1⟩)/√2
        assert steps[2].statevector[0][0] == pytest.approx(1 / math.sqrt(2))
        assert steps[2].statevector[1][0] == pytest.approx(-1 / math.sqrt(2))

    def test_bloch_coordinates(self) -> None:
        """Bloch coordinates calculation for single qubit state in Cirq."""
        backend = CirqBackend()
        # |+⟩ state (H on qubit 0) => Bloch x = 1, y = 0, z = 0
        sv = [[1 / math.sqrt(2), 0.0], [1 / math.sqrt(2), 0.0]]
        coords = backend.get_bloch_coordinates(sv, num_qubits=1)

        assert len(coords) == 1
        assert coords[0].x == pytest.approx(1.0, abs=1e-4)
        assert coords[0].y == pytest.approx(0.0, abs=1e-4)
        assert coords[0].z == pytest.approx(0.0, abs=1e-4)


class TestBackendRegistry:
    """Tests for the plugin BackendRegistry discovery system."""

    def test_list_backends(self) -> None:
        """list_backends() should return registered backends including qiskit and cirq."""
        backends = list_backends()
        names = [b["name"] for b in backends]

        assert "qiskit" in names
        assert "cirq" in names

        cirq_meta = next(b for b in backends if b["name"] == "cirq")
        assert cirq_meta["display_name"] == "cirq-simulator"
        assert cirq_meta["is_default"] is False

        qiskit_meta = next(b for b in backends if b["name"] == "qiskit")
        assert qiskit_meta["is_default"] is True

    def test_get_backend_by_name(self) -> None:
        """get_backend() returns correct instance by key or default."""
        b_default = get_backend()
        assert isinstance(b_default, QiskitBackend)

        b_qiskit = get_backend("qiskit")
        assert isinstance(b_qiskit, QiskitBackend)

        b_cirq = get_backend("cirq")
        assert isinstance(b_cirq, CirqBackend)

    def test_unknown_backend_raises_error(self) -> None:
        """Requesting an unregistered backend raises ValueError with helpful message."""
        with pytest.raises(ValueError, match="Unknown backend 'invalid-backend'"):
            get_backend("invalid-backend")

    def test_custom_backend_registration(self) -> None:
        """Custom user backend can be registered dynamically into registry."""
        custom_registry = BackendRegistry()

        class DummyBackend(CirqBackend):
            @property
            def name(self) -> str:
                return "dummy-custom"

        custom_registry.register("dummy", DummyBackend)
        inst = custom_registry.get("dummy")
        assert inst.name == "dummy-custom"
