"""
Tests for the circuit execution API endpoints.

These tests verify the full stack: HTTP request → FastAPI → QiskitBackend → response.
They use known quantum states to validate correctness end-to-end.
"""

import math
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=True)


class TestExecuteEndpoint:
    """Tests for POST /api/circuits/execute"""

    def test_bell_state_execution(self) -> None:
        """Execute a Bell state circuit and verify probabilities."""
        response = client.post("/api/circuits/execute", json={
            "circuit": {
                "num_qubits": 2,
                "gates": [
                    {"gate": "H", "qubits": [0]},
                    {"gate": "CX", "qubits": [0, 1]},
                ],
            },
            "shots": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["backend_name"] == "qiskit-aer"
        assert data["probabilities"]["00"] == 0.5
        assert data["probabilities"]["11"] == 0.5

    def test_invalid_circuit_returns_422(self) -> None:
        """A circuit with out-of-range qubit should return 422."""
        response = client.post("/api/circuits/execute", json={
            "circuit": {
                "num_qubits": 1,
                "gates": [{"gate": "CX", "qubits": [0, 1]}],
            },
            "shots": 0,
        })
        assert response.status_code == 422

    def test_empty_circuit(self) -> None:
        """Empty circuit should return |0⟩ state."""
        response = client.post("/api/circuits/execute", json={
            "circuit": {"num_qubits": 1, "gates": []},
            "shots": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["statevector"][0] == [1.0, 0.0]

    def test_generated_code_present(self) -> None:
        """Response should include generated Qiskit code."""
        response = client.post("/api/circuits/execute", json={
            "circuit": {
                "num_qubits": 1,
                "gates": [{"gate": "H", "qubits": [0]}],
            },
            "shots": 0,
        })
        data = response.json()
        assert "QuantumCircuit" in data["generated_code"]
        assert "qc.h(0)" in data["generated_code"]


class TestBlochEndpoint:
    """Tests for POST /api/circuits/bloch"""

    def test_zero_state_bloch(self) -> None:
        """|0⟩ should be at north pole."""
        response = client.post("/api/circuits/bloch", json={
            "statevector": [[1.0, 0.0], [0.0, 0.0]],
            "num_qubits": 1,
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert abs(data[0]["z"] - 1.0) < 1e-8


class TestGatesEndpoint:
    """Tests for GET /api/circuits/gates"""

    def test_lists_gates(self) -> None:
        response = client.get("/api/circuits/gates")
        assert response.status_code == 200
        gates = response.json()
        names = [g["name"] for g in gates]
        assert "H" in names
        assert "CX" in names
        assert "CCX" in names


class TestValidateEndpoint:
    """Tests for POST /api/circuits/validate"""

    def test_valid_circuit(self) -> None:
        response = client.post("/api/circuits/validate", json={
            "num_qubits": 2,
            "gates": [{"gate": "H", "qubits": [0]}],
        })
        assert response.status_code == 200
        assert response.json()["valid"] is True

    def test_invalid_circuit(self) -> None:
        response = client.post("/api/circuits/validate", json={
            "num_qubits": 1,
            "gates": [{"gate": "CX", "qubits": [0, 1]}],
        })
        data = response.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0
