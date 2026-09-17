"""
Tests for the QML API router endpoints (/api/qml/train, /api/qml/predict).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=True)


def test_qml_train_endpoint():
    """Verify POST /api/qml/train executes and returns TrainingResult format."""
    response = client.post(
        "/api/qml/train",
        json={
            "dataset": "circles",
            "num_samples": 40,
            "ansatz": "basic",
            "num_qubits": 2,
            "max_epochs": 10,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "loss_history" in data
    assert len(data["loss_history"]) >= 1
    assert "accuracy" in data
    assert "decision_boundary" in data
    assert len(data["decision_boundary"]) == 20
    assert "classical_accuracy" in data


def test_qml_predict_endpoint():
    """Verify POST /api/qml/predict returns probability and class prediction."""
    response = client.post(
        "/api/qml/predict",
        json={
            "params": [0.1, 0.2, 0.3, 0.4],
            "features": [[0.5, -0.2], [0.0, 0.9]],
            "ansatz": "basic",
            "num_qubits": 2,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "probabilities" in data
    assert len(data["probabilities"]) == 2
    assert "predictions" in data
    assert len(data["predictions"]) == 2
