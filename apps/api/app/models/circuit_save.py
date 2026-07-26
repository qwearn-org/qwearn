"""
CircuitSave — MongoDB document model for saved circuits.

PURPOSE:
    Users can save circuits they build in the playground to revisit later.
    In Phase 1, saves are anonymous — identified by a client-generated
    session ID stored in localStorage. When auth is added in Phase 8,
    anonymous saves will be migrated to the user's account.

DESIGN DECISIONS:
    1. The circuit spec is stored as an embedded document (not a reference)
       so that loading a saved circuit is a single query with no joins.
    2. The session_id is a client-generated UUID, not a server session —
       the server is stateless. This means saves are tied to the browser,
       not to a user identity. See the implementation plan for migration
       strategy when auth is added.
    3. Timestamps use UTC via Beanie's built-in created_at/updated_at.

COLLECTION: circuit_saves
"""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import BaseModel, Field


class EmbeddedGateSpec(BaseModel):
    """Gate spec stored inside a saved circuit document."""
    gate: str
    qubits: list[int]
    params: dict[str, float] = Field(default_factory=dict)


class EmbeddedCircuitSpec(BaseModel):
    """Circuit spec stored inside a saved circuit document."""
    num_qubits: int = Field(..., ge=1, le=20)
    gates: list[EmbeddedGateSpec]


class CircuitSave(Document):
    """
    A user-saved circuit from the playground.

    Attributes:
        title: User-provided name for the circuit (e.g., "My Bell State").
        description: Optional description of what the circuit does.
        circuit_spec: The full circuit specification (gates + qubit count).
        session_id: Client-generated UUID for anonymous identification.
        created_at: When the circuit was first saved.
        updated_at: When the circuit was last modified.
    """
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    circuit_spec: EmbeddedCircuitSpec
    session_id: str = Field(..., min_length=1, max_length=64)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "circuit_saves"
        indexes = ["session_id", "created_at"]


# ---------------------------------------------------------------------------
# Request / Response models (used by the router, not stored in MongoDB)
# ---------------------------------------------------------------------------


class CircuitSaveCreate(BaseModel):
    """Request body for creating a new saved circuit."""
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    circuit_spec: EmbeddedCircuitSpec


class CircuitSaveUpdate(BaseModel):
    """Request body for updating a saved circuit."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    circuit_spec: Optional[EmbeddedCircuitSpec] = None


class CircuitSaveResponse(BaseModel):
    """Response model for a saved circuit."""
    id: str
    title: str
    description: str
    circuit_spec: EmbeddedCircuitSpec
    session_id: str
    created_at: datetime
    updated_at: datetime
