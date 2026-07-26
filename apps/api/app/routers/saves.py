"""
Circuit save/load API routes.

These endpoints handle CRUD operations for saved circuits.
In Phase 1, circuits are saved anonymously — the client sends a
session_id header (a UUID stored in localStorage) to identify
the user. This will be replaced by proper auth in Phase 8.

Security note: The session_id is NOT a security mechanism — it's
a convenience identifier. Anyone with the session_id can access
the saves. This is acceptable for Phase 1 since saved circuits
contain no sensitive data. Auth will add proper access control.
"""

from datetime import datetime, timezone

from beanie import PydanticObjectId
from fastapi import APIRouter, Header, HTTPException

from app.models.circuit_save import (
    CircuitSave,
    CircuitSaveCreate,
    CircuitSaveResponse,
    CircuitSaveUpdate,
)

router = APIRouter(prefix="/api/circuits/saves", tags=["saves"])


def _to_response(doc: CircuitSave) -> CircuitSaveResponse:
    """Convert a CircuitSave document to a response model."""
    return CircuitSaveResponse(
        id=str(doc.id),
        title=doc.title,
        description=doc.description,
        circuit_spec=doc.circuit_spec,
        session_id=doc.session_id,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.post("", response_model=CircuitSaveResponse, status_code=201)
async def create_circuit_save(
    body: CircuitSaveCreate,
    x_session_id: str = Header(..., alias="X-Session-ID"),
) -> CircuitSaveResponse:
    """
    Save a new circuit.

    The X-Session-ID header is required — this is a client-generated
    UUID stored in localStorage. It identifies the anonymous user.
    """
    doc = CircuitSave(
        title=body.title,
        description=body.description,
        circuit_spec=body.circuit_spec,
        session_id=x_session_id,
    )
    await doc.insert()
    return _to_response(doc)


@router.get("", response_model=list[CircuitSaveResponse])
async def list_circuit_saves(
    x_session_id: str = Header(..., alias="X-Session-ID"),
) -> list[CircuitSaveResponse]:
    """
    List all saved circuits for the current session.

    Returns circuits ordered by most recently updated first.
    """
    docs = (
        await CircuitSave.find(CircuitSave.session_id == x_session_id)
        .sort("-updated_at")
        .to_list()
    )
    return [_to_response(doc) for doc in docs]


@router.get("/{save_id}", response_model=CircuitSaveResponse)
async def get_circuit_save(
    save_id: str,
    x_session_id: str = Header(..., alias="X-Session-ID"),
) -> CircuitSaveResponse:
    """Load a specific saved circuit."""
    try:
        doc = await CircuitSave.get(PydanticObjectId(save_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Circuit not found")

    if doc is None or doc.session_id != x_session_id:
        raise HTTPException(status_code=404, detail="Circuit not found")

    return _to_response(doc)


@router.put("/{save_id}", response_model=CircuitSaveResponse)
async def update_circuit_save(
    save_id: str,
    body: CircuitSaveUpdate,
    x_session_id: str = Header(..., alias="X-Session-ID"),
) -> CircuitSaveResponse:
    """Update a saved circuit (title, description, and/or circuit spec)."""
    try:
        doc = await CircuitSave.get(PydanticObjectId(save_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Circuit not found")

    if doc is None or doc.session_id != x_session_id:
        raise HTTPException(status_code=404, detail="Circuit not found")

    if body.title is not None:
        doc.title = body.title
    if body.description is not None:
        doc.description = body.description
    if body.circuit_spec is not None:
        doc.circuit_spec = body.circuit_spec

    doc.updated_at = datetime.now(timezone.utc)
    await doc.save()
    return _to_response(doc)


@router.delete("/{save_id}", status_code=204)
async def delete_circuit_save(
    save_id: str,
    x_session_id: str = Header(..., alias="X-Session-ID"),
) -> None:
    """Delete a saved circuit."""
    try:
        doc = await CircuitSave.get(PydanticObjectId(save_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Circuit not found")

    if doc is None or doc.session_id != x_session_id:
        raise HTTPException(status_code=404, detail="Circuit not found")

    await doc.delete()
