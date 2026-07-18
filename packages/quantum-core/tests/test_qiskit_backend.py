"""
Deterministic tests for QiskitBackend.

Every test verifies against known quantum states from textbook results
(Nielsen & Chuang). No randomness — statevector simulation is exact.
"""

import math
import pytest
from quantum_core.backend import CircuitSpec, GateName, GateSpec
from quantum_core.qiskit_backend import QiskitBackend


@pytest.fixture
def backend() -> QiskitBackend:
    return QiskitBackend()


class TestSingleGateStatevectors:
    """Verify single-gate circuits produce correct statevectors."""

    def test_x_gate(self, backend: QiskitBackend) -> None:
        """X|0⟩ = |1⟩ → statevector [0, 1]"""
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.X, qubits=[0])])
        result = backend.execute(spec, shots=0)
        assert result.statevector[0] == pytest.approx([0.0, 0.0], abs=1e-8)
        assert result.statevector[1] == pytest.approx([1.0, 0.0], abs=1e-8)

    def test_h_gate(self, backend: QiskitBackend) -> None:
        """H|0⟩ = (|0⟩+|1⟩)/√2 → statevector [1/√2, 1/√2]"""
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.H, qubits=[0])])
        result = backend.execute(spec, shots=0)
        inv_sqrt2 = 1.0 / math.sqrt(2)
        assert result.statevector[0] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)
        assert result.statevector[1] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)

    def test_z_gate_on_plus(self, backend: QiskitBackend) -> None:
        """Z·H|0⟩ = (|0⟩-|1⟩)/√2"""
        spec = CircuitSpec(num_qubits=1, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.Z, qubits=[0]),
        ])
        result = backend.execute(spec, shots=0)
        inv_sqrt2 = 1.0 / math.sqrt(2)
        assert result.statevector[0] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)
        assert result.statevector[1] == pytest.approx([-inv_sqrt2, 0.0], abs=1e-8)

    def test_identity_circuit(self, backend: QiskitBackend) -> None:
        """|0⟩ with no gates → statevector [1, 0]"""
        spec = CircuitSpec(num_qubits=1, gates=[])
        result = backend.execute(spec, shots=0)
        assert result.statevector[0] == pytest.approx([1.0, 0.0], abs=1e-8)
        assert result.statevector[1] == pytest.approx([0.0, 0.0], abs=1e-8)

    def test_phase_gate(self, backend: QiskitBackend) -> None:
        """P(π/2) on |1⟩ = i|1⟩. First apply X to get |1⟩, then P(π/2)."""
        spec = CircuitSpec(num_qubits=1, gates=[
            GateSpec(gate=GateName.X, qubits=[0]),
            GateSpec(gate=GateName.PHASE, qubits=[0], params={"theta": math.pi / 2}),
        ])
        result = backend.execute(spec, shots=0)
        assert result.statevector[0] == pytest.approx([0.0, 0.0], abs=1e-8)
        assert result.statevector[1] == pytest.approx([0.0, 1.0], abs=1e-8)


class TestEntangledStates:
    """Verify multi-qubit entangled states."""

    def test_bell_state(self, backend: QiskitBackend) -> None:
        """
        Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2.
        Circuit: H(0) → CNOT(0,1)
        Reference: Nielsen & Chuang §1.3.6
        """
        spec = CircuitSpec(num_qubits=2, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
        ])
        result = backend.execute(spec, shots=0)
        inv_sqrt2 = 1.0 / math.sqrt(2)
        # |00⟩ amplitude
        assert result.statevector[0] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)
        # |01⟩ and |10⟩ amplitudes should be 0
        assert result.statevector[1] == pytest.approx([0.0, 0.0], abs=1e-8)
        assert result.statevector[2] == pytest.approx([0.0, 0.0], abs=1e-8)
        # |11⟩ amplitude
        assert result.statevector[3] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)

    def test_bell_state_probabilities(self, backend: QiskitBackend) -> None:
        """Bell state should have 50% probability for |00⟩ and |11⟩."""
        spec = CircuitSpec(num_qubits=2, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
        ])
        result = backend.execute(spec, shots=0)
        assert result.probabilities["00"] == pytest.approx(0.5, abs=1e-8)
        assert result.probabilities["11"] == pytest.approx(0.5, abs=1e-8)
        assert "01" not in result.probabilities
        assert "10" not in result.probabilities

    def test_ghz_state(self, backend: QiskitBackend) -> None:
        """
        GHZ state = (|000⟩ + |111⟩)/√2.
        Circuit: H(0) → CNOT(0,1) → CNOT(0,2)
        """
        spec = CircuitSpec(num_qubits=3, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
            GateSpec(gate=GateName.CX, qubits=[0, 2]),
        ])
        result = backend.execute(spec, shots=0)
        inv_sqrt2 = 1.0 / math.sqrt(2)
        assert result.probabilities["000"] == pytest.approx(0.5, abs=1e-8)
        assert result.probabilities["111"] == pytest.approx(0.5, abs=1e-8)
        assert result.statevector[0] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)
        assert result.statevector[7] == pytest.approx([inv_sqrt2, 0.0], abs=1e-8)


class TestBlochCoordinates:
    """Verify Bloch sphere coordinate computation."""

    def test_zero_state_north_pole(self, backend: QiskitBackend) -> None:
        """|0⟩ → north pole (0, 0, 1)"""
        sv = [[1.0, 0.0], [0.0, 0.0]]
        coords = backend.get_bloch_coordinates(sv, 1)
        assert len(coords) == 1
        assert coords[0].x == pytest.approx(0.0, abs=1e-8)
        assert coords[0].y == pytest.approx(0.0, abs=1e-8)
        assert coords[0].z == pytest.approx(1.0, abs=1e-8)

    def test_one_state_south_pole(self, backend: QiskitBackend) -> None:
        """|1⟩ → south pole (0, 0, -1)"""
        sv = [[0.0, 0.0], [1.0, 0.0]]
        coords = backend.get_bloch_coordinates(sv, 1)
        assert coords[0].z == pytest.approx(-1.0, abs=1e-8)

    def test_plus_state_equator(self, backend: QiskitBackend) -> None:
        """|+⟩ = (|0⟩+|1⟩)/√2 → (1, 0, 0) on equator"""
        inv_sqrt2 = 1.0 / math.sqrt(2)
        sv = [[inv_sqrt2, 0.0], [inv_sqrt2, 0.0]]
        coords = backend.get_bloch_coordinates(sv, 1)
        assert coords[0].x == pytest.approx(1.0, abs=1e-8)
        assert coords[0].y == pytest.approx(0.0, abs=1e-8)
        assert coords[0].z == pytest.approx(0.0, abs=1e-8)

    def test_bell_state_mixed(self, backend: QiskitBackend) -> None:
        """Bell state: each qubit's reduced state is maximally mixed → Bloch vector (0,0,0)."""
        inv_sqrt2 = 1.0 / math.sqrt(2)
        sv = [[inv_sqrt2, 0.0], [0.0, 0.0], [0.0, 0.0], [inv_sqrt2, 0.0]]
        coords = backend.get_bloch_coordinates(sv, 2)
        for c in coords:
            assert c.x == pytest.approx(0.0, abs=1e-8)
            assert c.y == pytest.approx(0.0, abs=1e-8)
            assert c.z == pytest.approx(0.0, abs=1e-8)


class TestValidation:
    """Verify circuit validation catches errors."""

    def test_qubit_out_of_range(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.X, qubits=[1])])
        errors = backend.validate_circuit(spec)
        assert len(errors) == 1
        assert "out of range" in errors[0]

    def test_wrong_qubit_count(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=2, gates=[GateSpec(gate=GateName.CX, qubits=[0])])
        errors = backend.validate_circuit(spec)
        assert any("expected 2" in e for e in errors)

    def test_duplicate_qubits(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=2, gates=[GateSpec(gate=GateName.CX, qubits=[0, 0])])
        errors = backend.validate_circuit(spec)
        assert any("duplicate" in e for e in errors)

    def test_missing_phase_param(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.PHASE, qubits=[0])])
        errors = backend.validate_circuit(spec)
        assert any("theta" in e for e in errors)

    def test_valid_circuit_no_errors(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=2, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
        ])
        errors = backend.validate_circuit(spec)
        assert errors == []


class TestCodeGeneration:
    """Verify generated code is syntactically valid."""

    def test_generated_code_contains_imports(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.H, qubits=[0])])
        result = backend.execute(spec, shots=0)
        assert "from qiskit import QuantumCircuit" in result.generated_code
        assert "qc.h(0)" in result.generated_code

    def test_generated_code_is_valid_python(self, backend: QiskitBackend) -> None:
        """The generated code should at least parse as valid Python."""
        spec = CircuitSpec(num_qubits=2, gates=[
            GateSpec(gate=GateName.H, qubits=[0]),
            GateSpec(gate=GateName.CX, qubits=[0, 1]),
        ])
        result = backend.execute(spec, shots=0)
        compile(result.generated_code, "<generated>", "exec")  # Should not raise


class TestMeasurementCounts:
    """Verify shot-based measurement produces expected distributions."""

    def test_deterministic_x_gate(self, backend: QiskitBackend) -> None:
        """X|0⟩ = |1⟩: all shots should measure '1'."""
        spec = CircuitSpec(num_qubits=1, gates=[GateSpec(gate=GateName.X, qubits=[0])])
        result = backend.execute(spec, shots=100)
        assert result.counts.get("1", 0) == 100

    def test_backend_name(self, backend: QiskitBackend) -> None:
        spec = CircuitSpec(num_qubits=1, gates=[])
        result = backend.execute(spec, shots=0)
        assert result.backend_name == "qiskit-aer"
