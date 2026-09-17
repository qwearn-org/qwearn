"""
Challenge evaluation API routes.

Accepts a challenge ID + submitted circuit, loads the challenge spec,
runs the appropriate evaluator, and returns the result.

Security note: Only structured CircuitSpec JSON is accepted. No user code
is ever executed.
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from quantum_core.backend import CircuitSpec
from quantum_core.evaluator import (
    ChallengeSpec,
    EvaluationResult,
    EvaluatorType,
    evaluate_equivalence,
    evaluate_probability,
    evaluate_statevector,
)
from quantum_core.qiskit_backend import QiskitBackend

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

_backend = QiskitBackend()

# Path to challenge content directory
CHALLENGES_DIR = Path(__file__).resolve().parents[3] / "content" / "challenges"


class EvaluateRequest(BaseModel):
    """Request body for challenge evaluation."""

    challenge_id: str
    submitted_circuit: CircuitSpec


def _load_challenge_spec(challenge_id: str) -> ChallengeSpec:
    """Load a challenge spec from the content directory."""
    # Find the challenge directory by ID
    for d in sorted(CHALLENGES_DIR.iterdir()):
        if not d.is_dir():
            continue
        spec_path = d / "spec.json"
        if spec_path.exists():
            data = json.loads(spec_path.read_text())
            if data.get("id") == challenge_id:
                return ChallengeSpec(**data)

    raise HTTPException(status_code=404, detail=f"Challenge '{challenge_id}' not found")


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_challenge(request: EvaluateRequest) -> EvaluationResult:
    """
    Evaluate a submitted circuit against a challenge specification.

    Loads the challenge spec by ID, executes the submitted circuit,
    and runs the appropriate evaluator.
    """
    spec = _load_challenge_spec(request.challenge_id)

    # Validate qubit count
    if request.submitted_circuit.num_qubits != spec.num_qubits:
        return EvaluationResult(
            passed=False,
            score=0.0,
            feedback=f"❌ This challenge requires exactly {spec.num_qubits} qubit(s). "
            f"Your circuit has {request.submitted_circuit.num_qubits}.",
            details={"error": "qubit_count_mismatch"},
        )

    try:
        submitted_result = _backend.execute(request.submitted_circuit, shots=0)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=422, detail=f"Circuit execution error: {e}")

    gate_count = len(request.submitted_circuit.gates)

    if spec.evaluator_type == EvaluatorType.STATEVECTOR:
        return evaluate_statevector(submitted_result, spec, gate_count)

    elif spec.evaluator_type == EvaluatorType.PROBABILITY:
        return evaluate_probability(submitted_result, spec, gate_count)

    elif spec.evaluator_type == EvaluatorType.EQUIVALENCE:
        if spec.target_circuit is None:
            raise HTTPException(
                status_code=500,
                detail="Challenge spec error: equivalence evaluator requires target_circuit",
            )
        try:
            target_result = _backend.execute(spec.target_circuit, shots=0)
        except (ValueError, RuntimeError) as e:
            raise HTTPException(status_code=500, detail=f"Target circuit error: {e}")

        return evaluate_equivalence(submitted_result, target_result, spec, gate_count)

    else:
        raise HTTPException(
            status_code=500, detail=f"Unknown evaluator type: {spec.evaluator_type}"
        )
