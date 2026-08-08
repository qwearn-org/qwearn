"""
Circuit execution API routes.

These endpoints are the bridge between the frontend circuit builder
and the quantum-core execution engine. They accept CircuitSpec JSON,
delegate to the QuantumBackend, and return results.

Security note: These endpoints accept STRUCTURED circuit specs (JSON with
gate names and qubit indices), NOT arbitrary code. The CircuitSpec is
validated by Pydantic before reaching the backend. There is no code
execution path from user input. See docs/adr/ for the security design.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from quantum_core.backend import CircuitSpec, CircuitResult, BlochCoordinates, StepResult
from quantum_core.qiskit_backend import QiskitBackend

router = APIRouter(prefix="/api/circuits", tags=["circuits"])

# Singleton backend instance — initialized once, reused for all requests.
# In Phase 9, this will become a registry of backends selectable by the user.
_backend = QiskitBackend()


class ExecuteRequest(BaseModel):
    """Request body for circuit execution."""
    circuit: CircuitSpec
    shots: int = 1024


class BlochRequest(BaseModel):
    """Request body for Bloch coordinate computation."""
    statevector: list[list[float]]
    num_qubits: int


@router.post("/execute", response_model=CircuitResult)
async def execute_circuit(request: ExecuteRequest) -> CircuitResult:
    """
    Execute a quantum circuit and return results.

    Accepts a CircuitSpec (list of gates + qubit indices), runs it on
    the Qiskit Aer simulator, and returns statevector, probabilities,
    measurement counts, and generated Qiskit source code.
    """
    try:
        result = _backend.execute(request.circuit, shots=request.shots)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")


@router.post("/step", response_model=list[StepResult])
async def execute_circuit_steps(circuit: CircuitSpec) -> list[StepResult]:
    """
    Execute a quantum circuit gate-by-gate and return intermediate step results.

    Used by the Quantum Algorithms module to animate circuit execution step-by-step.
    """
    try:
        results = _backend.execute_steps(circuit)
        return results
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")


@router.post("/bloch", response_model=list[BlochCoordinates])
async def get_bloch_coordinates(request: BlochRequest) -> list[BlochCoordinates]:
    """
    Compute Bloch sphere coordinates for each qubit from a statevector.

    Typically called after /execute with the returned statevector.
    Returns one BlochCoordinates object per qubit.
    """
    try:
        coords = _backend.get_bloch_coordinates(
            request.statevector, request.num_qubits
        )
        return coords
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/gates")
async def list_supported_gates() -> list[dict]:
    """Return metadata about all supported quantum gates."""
    return _backend.supported_gates()


@router.post("/validate")
async def validate_circuit(circuit: CircuitSpec) -> dict:
    """
    Validate a circuit spec without executing it.
    Returns {"valid": true} or {"valid": false, "errors": [...]}.
    """
    errors = _backend.validate_circuit(circuit)
    return {"valid": len(errors) == 0, "errors": errors}
