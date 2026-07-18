"""
Tests for the QuantumBackend interface and data models.

These tests verify the framework-agnostic data models (CircuitSpec,
CircuitResult, GateSpec) work correctly. Backend-specific tests
(e.g., verifying Qiskit produces correct Bell state statevectors)
will be added in Phase 1 when the QiskitBackend implementation is built.
"""

import pytest
from quantum_core.backend import (
    BlochCoordinates,
    CircuitResult,
    CircuitSpec,
    GateName,
    GateSpec,
)


class TestGateSpec:
    """Tests for the GateSpec model."""

    def test_single_qubit_gate(self) -> None:
        """An X gate on qubit 0 should serialize correctly."""
        gate = GateSpec(gate=GateName.X, qubits=[0])
        assert gate.gate == GateName.X
        assert gate.qubits == [0]
        assert gate.params == {}

    def test_parameterized_gate(self) -> None:
        """A Phase gate requires an angle parameter."""
        gate = GateSpec(gate=GateName.PHASE, qubits=[0], params={"theta": 1.5708})
        assert gate.params["theta"] == pytest.approx(1.5708)

    def test_multi_qubit_gate(self) -> None:
        """CNOT (CX) requires exactly 2 qubits: [control, target]."""
        gate = GateSpec(gate=GateName.CX, qubits=[0, 1])
        assert len(gate.qubits) == 2

    def test_toffoli_gate(self) -> None:
        """Toffoli (CCX) requires exactly 3 qubits."""
        gate = GateSpec(gate=GateName.CCX, qubits=[0, 1, 2])
        assert len(gate.qubits) == 3


class TestCircuitSpec:
    """Tests for the CircuitSpec model."""

    def test_simple_circuit(self) -> None:
        """A basic 2-qubit circuit with H and CNOT (Bell state preparation)."""
        spec = CircuitSpec(
            num_qubits=2,
            gates=[
                GateSpec(gate=GateName.H, qubits=[0]),
                GateSpec(gate=GateName.CX, qubits=[0, 1]),
            ],
        )
        assert spec.num_qubits == 2
        assert len(spec.gates) == 2

    def test_empty_circuit(self) -> None:
        """An empty circuit (no gates) is valid — it's the identity operation."""
        spec = CircuitSpec(num_qubits=1, gates=[])
        assert len(spec.gates) == 0

    def test_qubit_count_minimum(self) -> None:
        """Must have at least 1 qubit."""
        with pytest.raises(Exception):
            CircuitSpec(num_qubits=0, gates=[])

    def test_qubit_count_maximum(self) -> None:
        """Maximum 20 qubits (to keep simulation tractable)."""
        with pytest.raises(Exception):
            CircuitSpec(num_qubits=21, gates=[])


class TestCircuitResult:
    """Tests for the CircuitResult model."""

    def test_result_serialization(self) -> None:
        """CircuitResult should serialize to JSON correctly."""
        result = CircuitResult(
            statevector=[[1.0, 0.0], [0.0, 0.0]],
            probabilities={"0": 1.0, "1": 0.0},
            counts={"0": 1024},
            generated_code='qc = QuantumCircuit(1)\n# identity circuit',
            backend_name="test-backend",
        )
        data = result.model_dump()
        assert data["backend_name"] == "test-backend"
        assert len(data["statevector"]) == 2


class TestBlochCoordinates:
    """Tests for the BlochCoordinates model."""

    def test_north_pole(self) -> None:
        """|0⟩ state should map to the north pole of the Bloch sphere: (0, 0, 1)."""
        coords = BlochCoordinates(
            qubit_index=0,
            x=0.0, y=0.0, z=1.0,
            theta=0.0, phi=0.0,
        )
        assert coords.z == 1.0

    def test_south_pole(self) -> None:
        """|1⟩ state should map to the south pole: (0, 0, -1)."""
        coords = BlochCoordinates(
            qubit_index=0,
            x=0.0, y=0.0, z=-1.0,
            theta=3.14159, phi=0.0,
        )
        assert coords.z == -1.0
