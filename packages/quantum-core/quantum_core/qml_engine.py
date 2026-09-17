"""
QML Engine — Variational Quantum Circuit (VQC) training, parameterization, and synthetic data module.

Provides:
- Synthetic 2D dataset generation (circles, moons, linear)
- Parameterized quantum circuit construction and execution via Qiskit Aer
- VQC training loop (COBYLA/gradient-free optimizer)
- Decision boundary computation & classical baseline comparison for QML educational visualization
"""

from __future__ import annotations

import math
import time

import numpy as np
from pydantic import BaseModel, Field
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from scipy.optimize import minimize


class TrainingConfig(BaseModel):
    """Configuration options for VQC training."""

    dataset: str = Field(
        default="circles", description="Dataset generator ('circles', 'moons', 'linear')"
    )
    num_samples: int = Field(default=100, ge=20, le=200, description="Number of samples (20..200)")
    ansatz: str = Field(default="basic", description="Ansatz type ('basic', 'layered')")
    num_qubits: int = Field(default=2, ge=2, le=4, description="Number of qubits (2..4)")
    max_epochs: int = Field(default=30, ge=5, le=50, description="Max optimizer iterations (5..50)")


class TrainingResult(BaseModel):
    """Output results of VQC training."""

    loss_history: list[float]
    accuracy: float
    final_params: list[float]
    decision_boundary: list[list[float]]
    classical_accuracy: float
    classical_decision_boundary: list[list[float]]
    training_time_ms: int


class PredictRequest(BaseModel):
    """Request structure for predictions using trained parameters."""

    params: list[float]
    features: list[list[float]]
    ansatz: str = "basic"
    num_qubits: int = 2


class PredictResponse(BaseModel):
    """Prediction results."""

    probabilities: list[float]
    predictions: list[int]


# --- Synthetic Data Generator ---


def generate_dataset(
    name: str = "circles", n_samples: int = 100, seed: int = 42
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic 2D binary classification datasets in [-1, 1]^2.
    Returns (X, y) where X shape is (n_samples, 2), y shape is (n_samples,).
    """
    rng = np.random.default_rng(seed)
    n_per_class = n_samples // 2

    if name == "circles":
        # Inner circle = label 0, outer ring = label 1
        r_inner = rng.uniform(0.0, 0.45, n_per_class)
        t_inner = rng.uniform(0.0, 2 * math.pi, n_per_class)
        X_0 = np.column_stack([r_inner * np.cos(t_inner), r_inner * np.sin(t_inner)])

        r_outer = rng.uniform(0.6, 0.95, n_samples - n_per_class)
        t_outer = rng.uniform(0.0, 2 * math.pi, n_samples - n_per_class)
        X_1 = np.column_stack([r_outer * np.cos(t_outer), r_outer * np.sin(t_outer)])

        X = np.vstack([X_0, X_1])
        y = np.array([0] * n_per_class + [1] * (n_samples - n_per_class))

    elif name == "moons":
        # Two interlocking half moons
        t0 = np.linspace(0, math.pi, n_per_class)
        X_0 = np.column_stack([np.cos(t0), np.sin(t0)]) + rng.normal(0, 0.08, (n_per_class, 2))
        X_0[:, 0] -= 0.3

        t1 = np.linspace(0, math.pi, n_samples - n_per_class)
        X_1 = np.column_stack([1 - np.cos(t1), 0.5 - np.sin(t1)]) + rng.normal(
            0, 0.08, (n_samples - n_per_class, 2)
        )
        X_1[:, 0] -= 0.3

        X = np.vstack([X_0, X_1])
        # Scale X to [-1, 1]
        X = 2 * (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0) + 1e-8) - 1
        y = np.array([0] * n_per_class + [1] * (n_samples - n_per_class))

    else:  # "linear"
        # Linearly separable with small margin
        X = rng.uniform(-0.9, 0.9, (n_samples, 2))
        # Line: x1 - 0.5*x0 + 0.1 > 0
        y = (X[:, 1] - 0.5 * X[:, 0] + 0.1 > 0).astype(int)

    # Shuffle
    perm = rng.permutation(n_samples)
    return X[perm], y[perm]


# --- Quantum Circuit Engine for QML ---


class QMLEngine:
    """Handles parameterized circuits, expectation values, and optimization."""

    def __init__(self) -> None:
        self.simulator = AerSimulator()

    @staticmethod
    def get_num_params(ansatz: str, num_qubits: int = 2) -> int:
        """Returns number of trainable parameters for a given ansatz configuration."""
        if ansatz == "layered":
            return num_qubits * 3
        return num_qubits * 2  # default basic ansatz

    @staticmethod
    def build_circuit(
        x: np.ndarray, params: np.ndarray, ansatz: str = "basic", num_qubits: int = 2
    ) -> QuantumCircuit:
        """
        Build a parameterized quantum circuit encoding features x and using variational params.
        """
        qc = QuantumCircuit(num_qubits)

        # 1. Feature encoding (Angle encoding into Rx, Ry)
        for i in range(num_qubits):
            feat_val = float(x[i % len(x)]) * math.pi
            qc.rx(feat_val, i)
            qc.ry(feat_val * 0.5, i)

        # Entanglement between features if qubits > 1
        for i in range(num_qubits - 1):
            qc.cz(i, i + 1)

        # 2. Variational Ansatz
        param_idx = 0
        for i in range(num_qubits):
            qc.ry(float(params[param_idx]), i)
            param_idx += 1

        if num_qubits > 1:
            for i in range(num_qubits - 1):
                qc.cx(i, i + 1)
            qc.cx(num_qubits - 1, 0)

        for i in range(num_qubits):
            qc.rz(float(params[param_idx]), i)
            param_idx += 1

        if ansatz == "layered" and param_idx < len(params):
            for i in range(num_qubits):
                if param_idx < len(params):
                    qc.ry(float(params[param_idx]), i)
                    param_idx += 1

        return qc

    def evaluate_probability(
        self, x: np.ndarray, params: np.ndarray, ansatz: str = "basic", num_qubits: int = 2
    ) -> float:
        """
        Compute predicted probability P(y=1) using statevector measurement expectation <Z_0>.
        P(y=1) = (1 - <Z_0>) / 2 (probability of measuring |1> on qubit 0).
        """
        qc = self.build_circuit(x, params, ansatz=ansatz, num_qubits=num_qubits)
        state = Statevector.from_instruction(qc)
        # Probabilities for qubit 0 being 1
        probs = state.probabilities([0])
        prob_1 = float(probs[1]) if len(probs) > 1 else 0.5
        return prob_1

    def predict_batch(
        self, X: np.ndarray, params: np.ndarray, ansatz: str = "basic", num_qubits: int = 2
    ) -> np.ndarray:
        """Compute P(y=1) for a batch of feature vectors X."""
        return np.array([self.evaluate_probability(x, params, ansatz, num_qubits) for x in X])


# --- Classical Baseline ---


def fit_classical_baseline(X: np.ndarray, y: np.ndarray) -> tuple[float, list[list[float]]]:
    """
    Train a classical logistic regression model with RBF/polynomial features
    using scipy optimization to provide side-by-side comparative accuracy and decision boundary.
    """
    # Expanded features: [1, x0, x1, x0^2, x1^2, x0*x1]
    X_exp = np.column_stack(
        [np.ones(len(X)), X[:, 0], X[:, 1], X[:, 0] ** 2, X[:, 1] ** 2, X[:, 0] * X[:, 1]]
    )

    def loss(w: np.ndarray) -> float:
        z = np.clip(X_exp @ w, -20, 20)
        p = 1.0 / (1.0 + np.exp(-z))
        bce = -np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12))
        l2 = 0.01 * np.sum(w**2)
        return float(bce + l2)

    init_w = np.zeros(6)
    res = minimize(loss, init_w, method="L-BFGS-B")
    w_opt = res.x

    # Compute accuracy
    z_opt = X_exp @ w_opt
    p_opt = 1.0 / (1.0 + np.exp(-z_opt))
    preds = (p_opt >= 0.5).astype(int)
    acc = float(np.mean(preds == y))

    # Compute 20x20 decision boundary grid over [-1, 1]^2
    grid_pts = np.linspace(-1, 1, 20)
    grid_x, grid_y = np.meshgrid(grid_pts, grid_pts)
    X_grid = np.column_stack([grid_x.ravel(), grid_y.ravel()])
    X_grid_exp = np.column_stack(
        [
            np.ones(len(X_grid)),
            X_grid[:, 0],
            X_grid[:, 1],
            X_grid[:, 0] ** 2,
            X_grid[:, 1] ** 2,
            X_grid[:, 0] * X_grid[:, 1],
        ]
    )
    p_grid = 1.0 / (1.0 + np.exp(-np.clip(X_grid_exp @ w_opt, -20, 20)))
    boundary_grid = p_grid.reshape(20, 20).tolist()

    return acc, boundary_grid


# --- Main VQC Trainer ---


def train_vqc(config: TrainingConfig) -> TrainingResult:
    """
    Run VQC optimization loop on requested synthetic dataset.
    Returns loss curve, accuracy, final parameters, decision boundary, and classical baseline.
    """
    start_time = time.time()
    engine = QMLEngine()

    # 1. Dataset
    X, y = generate_dataset(name=config.dataset, n_samples=config.num_samples, seed=42)

    # 2. Parameters & Optimizer
    n_params = engine.get_num_params(config.ansatz, config.num_qubits)
    rng = np.random.default_rng(42)
    init_params = rng.uniform(-math.pi, math.pi, n_params)

    loss_history: list[float] = []

    def objective(params: np.ndarray) -> float:
        probs = engine.predict_batch(X, params, ansatz=config.ansatz, num_qubits=config.num_qubits)
        # Mean squared error loss
        loss_val = float(np.mean((probs - y) ** 2))
        return loss_val

    # Tracking iteration loss history via callback
    def callback(params: np.ndarray) -> None:
        val = objective(params)
        loss_history.append(round(val, 4))

    # Initial loss
    loss_history.append(round(objective(init_params), 4))

    # Optimize using COBYLA
    res = minimize(
        objective,
        init_params,
        method="COBYLA",
        options={"maxiter": config.max_epochs, "rhobeg": 0.5},
        callback=callback,
    )

    opt_params = res.x

    # Final evaluation
    final_probs = engine.predict_batch(
        X, opt_params, ansatz=config.ansatz, num_qubits=config.num_qubits
    )
    final_preds = (final_probs >= 0.5).astype(int)
    quantum_acc = float(np.mean(final_preds == y))

    # Quantum 20x20 decision boundary grid
    grid_pts = np.linspace(-1, 1, 20)
    grid_x, grid_y = np.meshgrid(grid_pts, grid_pts)
    X_grid = np.column_stack([grid_x.ravel(), grid_y.ravel()])
    grid_probs = engine.predict_batch(
        X_grid, opt_params, ansatz=config.ansatz, num_qubits=config.num_qubits
    )
    quantum_boundary = grid_probs.reshape(20, 20).tolist()

    # Classical baseline comparison
    classical_acc, classical_boundary = fit_classical_baseline(X, y)

    elapsed_ms = int((time.time() - start_time) * 1000)

    return TrainingResult(
        loss_history=loss_history,
        accuracy=round(quantum_acc, 4),
        final_params=[round(float(p), 4) for p in opt_params],
        decision_boundary=quantum_boundary,
        classical_accuracy=round(classical_acc, 4),
        classical_decision_boundary=classical_boundary,
        training_time_ms=elapsed_ms,
    )
