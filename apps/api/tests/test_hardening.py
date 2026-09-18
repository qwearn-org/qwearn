"""
Security & Boundary Hardening Tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_oversized_gate_count_rejected():
    """Verify circuits with >100 gates are rejected with 400 Bad Request."""
    gates = [{"gate": "H", "qubits": [0]}] * 105
    payload = {
        "circuit": {
            "num_qubits": 2,
            "gates": gates,
        },
        "shots": 1024,
    }
    response = client.post("/api/circuits/execute", json=payload)
    assert response.status_code == 400
    assert "Gate limit exceeded" in response.json()["detail"]


def test_invalid_shots_rejected():
    """Verify invalid shots values are rejected."""
    payload = {
        "circuit": {
            "num_qubits": 2,
            "gates": [{"gate": "H", "qubits": [0]}],
        },
        "shots": -5,
    }
    response = client.post("/api/circuits/execute", json=payload)
    assert response.status_code == 400
    assert "Shots must be between" in response.json()["detail"]
