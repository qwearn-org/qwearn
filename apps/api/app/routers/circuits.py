"""
Circuit execution API routes.

These endpoints are the bridge between the frontend circuit builder
and the quantum-core execution engine. They accept CircuitSpec JSON,
delegate to the QuantumBackend registry, and return results.

Security note: These endpoints accept STRUCTURED circuit specs (JSON with
gate names and qubit indices), NOT arbitrary code. The CircuitSpec is
validated by Pydantic before reaching the backend. There is no code
execution path from user input. See docs/adr/ for the security design.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from quantum_core import get_backend, list_backends
from quantum_core.backend import BlochCoordinates, CircuitResult, CircuitSpec, StepResult

router = APIRouter(prefix="/api/circuits", tags=["circuits"])


class ExecuteRequest(BaseModel):
    """Request body for circuit execution."""

    circuit: CircuitSpec
    shots: int = 1024
    backend: str = "qiskit"


class BlochRequest(BaseModel):
    """Request body for Bloch coordinate computation."""

    statevector: list[list[float]]
    num_qubits: int


@router.get("/backends")
async def get_available_backends() -> list[dict]:
    """Return metadata for all registered SDK backends."""
    return list_backends()


@router.post("/execute", response_model=CircuitResult)
async def execute_circuit(request: ExecuteRequest) -> CircuitResult:
    """
    Execute a quantum circuit and return results.

    Accepts a CircuitSpec (list of gates + qubit indices), runs it on
    the requested backend (Qiskit, Cirq, etc.), and returns statevector,
    probabilities, measurement counts, and generated source code.
    """
    if request.circuit.num_qubits > 20:
        raise HTTPException(
            status_code=400, detail="Qubit limit exceeded. Maximum allowed qubits is 20."
        )
    if len(request.circuit.gates) > 100:
        raise HTTPException(
            status_code=400, detail="Gate limit exceeded. Maximum allowed gates per circuit is 100."
        )
    if not (0 <= request.shots <= 10000):
        raise HTTPException(status_code=400, detail="Shots must be between 0 and 10,000.")

    try:
        backend_instance = get_backend(request.backend)
        result = backend_instance.execute(request.circuit, shots=request.shots)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {e}")


@router.post("/step", response_model=list[StepResult])
async def execute_circuit_steps(
    circuit: CircuitSpec,
    backend: str = Query("qiskit", description="Backend key name (e.g. qiskit, cirq)"),
) -> list[StepResult]:
    """
    Execute a quantum circuit gate-by-gate and return intermediate step results.

    Used by the Quantum Algorithms module to animate circuit execution step-by-step.
    """
    try:
        backend_instance = get_backend(backend)
        results = backend_instance.execute_steps(circuit)
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
        backend_instance = get_backend("qiskit")
        coords = backend_instance.get_bloch_coordinates(request.statevector, request.num_qubits)
        return coords
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/gates")
async def list_supported_gates(
    backend: str = Query("qiskit", description="Backend key name"),
) -> list[dict]:
    """Return metadata about all supported quantum gates for a backend."""
    try:
        backend_instance = get_backend(backend)
        return backend_instance.supported_gates()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/validate")
async def validate_circuit(
    circuit: CircuitSpec,
    backend: str = Query("qiskit", description="Backend key name"),
) -> dict:
    """
    Validate a circuit spec without executing it.
    Returns {"valid": true} or {"valid": false, "errors": [...]}.
    """
    try:
        backend_instance = get_backend(backend)
        errors = backend_instance.validate_circuit(circuit)
        return {"valid": len(errors) == 0, "errors": errors}
    except ValueError as e:
        return {"valid": False, "errors": [str(e)]}
