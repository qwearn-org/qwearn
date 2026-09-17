"""
Unit tests for qml_engine module — synthetic data, parameterized circuits, and VQC training loop.
"""

import numpy as np

from quantum_core.qml_engine import (
    QMLEngine,
    TrainingConfig,
    generate_dataset,
    train_vqc,
)


def test_generate_dataset_shapes_and_labels():
    """Verify synthetic dataset shapes, ranges, and binary label values."""
    for dataset_name in ["circles", "moons", "linear"]:
        X, y = generate_dataset(name=dataset_name, n_samples=60, seed=123)
        assert X.shape == (60, 2)
        assert y.shape == (60,)
        assert set(np.unique(y)).issubset({0, 1})
        assert np.all(X >= -1.0) and np.all(X <= 1.0)


def test_qml_engine_circuit_and_predict():
    """Test parameterized circuit construction and single/batch prediction probability."""
    engine = QMLEngine()
    x = np.array([0.5, -0.3])
    params = np.array([0.1, 0.2, 0.3, 0.4])

    qc = engine.build_circuit(x, params, ansatz="basic", num_qubits=2)
    assert qc.num_qubits == 2

    prob = engine.evaluate_probability(x, params, ansatz="basic", num_qubits=2)
    assert 0.0 <= prob <= 1.0

    X = np.array([[0.1, 0.2], [-0.5, 0.8]])
    probs = engine.predict_batch(X, params, ansatz="basic", num_qubits=2)
    assert len(probs) == 2
    assert all(0.0 <= p <= 1.0 for p in probs)


def test_vqc_training_loop():
    """Test VQC training execution and TrainingResult output format."""
    config = TrainingConfig(
        dataset="circles",
        num_samples=40,
        ansatz="basic",
        num_qubits=2,
        max_epochs=10,
    )
    result = train_vqc(config)

    assert len(result.loss_history) > 1
    assert result.accuracy >= 0.0 and result.accuracy <= 1.0
    assert len(result.final_params) == 4
    assert len(result.decision_boundary) == 20
    assert len(result.decision_boundary[0]) == 20
    assert result.classical_accuracy >= 0.0
    assert len(result.classical_decision_boundary) == 20
    assert result.training_time_ms > 0
