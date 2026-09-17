"""
QML (Quantum Machine Learning) API routes.

Provides endpoints for live VQC training loops and model prediction evaluation.
"""

import numpy as np
from fastapi import APIRouter, HTTPException
from quantum_core.qml_engine import (
    PredictRequest,
    PredictResponse,
    QMLEngine,
    TrainingConfig,
    TrainingResult,
    train_vqc,
)

router = APIRouter(prefix="/api/qml", tags=["qml"])
_qml_engine = QMLEngine()


@router.post("/train", response_model=TrainingResult)
async def train_qml_model(config: TrainingConfig) -> TrainingResult:
    """
    Execute a VQC training loop on synthetic datasets (circles, moons, linear).
    Returns loss history, final accuracy, decision boundary heatmap grid, and classical comparison baseline.
    """
    try:
        return train_vqc(config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QML training failed: {e!s}")


@router.post("/predict", response_model=PredictResponse)
async def predict_qml_model(request: PredictRequest) -> PredictResponse:
    """
    Run prediction using trained parameters and input features.
    """
    try:
        X = np.array(request.features)
        if X.ndim != 2 or X.shape[1] != 2:
            raise HTTPException(
                status_code=400, detail="Features must be a list of 2D coordinates [[x0, x1], ...]"
            )

        params = np.array(request.params)
        probs = _qml_engine.predict_batch(
            X, params, ansatz=request.ansatz, num_qubits=request.num_qubits
        )
        preds = (probs >= 0.5).astype(int)

        return PredictResponse(
            probabilities=[round(float(p), 4) for p in probs],
            predictions=[int(p) for p in preds],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e!s}")
