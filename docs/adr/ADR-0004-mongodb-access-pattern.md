# ADR-0004: MongoDB Access Pattern — Beanie ODM

**Status:** Accepted  
**Date:** 2026-07-17  
**Decision Makers:** Aman Raza  

## Context

The Qwearn backend (FastAPI) needs to interact with MongoDB for:
- User profiles and auth-linked data
- Lesson progress tracking
- Saved circuit designs
- Challenge submissions
- Content cache

Two approaches were evaluated:

| Criteria | Motor (raw async driver) | Beanie (async ODM) |
|---|---|---|
| Boilerplate | High (manual serialization) | Low (Pydantic models = documents) |
| Type safety | Manual | Automatic (Pydantic v2) |
| Query interface | Raw dicts | Typed query builders + raw access |
| Migration tooling | DIY | Built-in |
| Learning curve | Low (just MongoDB queries) | Medium (ODM concepts) |
| Escape hatch | N/A | Full Motor access via `.get_motor_collection()` |

## Decision

**Beanie ODM** (built on Motor + Pydantic v2).

## Rationale

- **Pydantic model reuse:** FastAPI already uses Pydantic v2 for request/response validation. Beanie lets us use the *same models* as both API schemas and MongoDB documents. A `CircuitSave` model can be:
  - A Beanie `Document` (MongoDB document class)
  - A Pydantic `BaseModel` (API response schema)
  - Both at once, with no mapping layer.

- **Reduced boilerplate:** For 5 collections with straightforward CRUD patterns, Beanie eliminates hundreds of lines of manual serialization, index creation, and query building.

- **Async-native:** Beanie is async from the ground up, matching FastAPI's async endpoint pattern. No sync/async adapter needed.

- **No lock-in:** Beanie exposes the underlying Motor collection via `.get_motor_collection()`, so if we need raw aggregation pipelines (e.g., for analytics), we can drop down to Motor without changing the ODM setup.

## Consequences

- Contributors need to understand Beanie's `Document` subclass pattern (minimal learning curve).
- Beanie initialization happens in the FastAPI lifespan handler (all document models must be registered at startup).
- Complex aggregation queries may need to bypass Beanie and use raw Motor — this is fine and expected.

## Example

```python
from beanie import Document
from pydantic import Field

class CircuitSave(Document):
    user_id: str
    name: str
    circuit_spec: dict  # CircuitSpec serialized
    result_snapshot: dict | None = None
    
    class Settings:
        name = "circuit_saves"  # MongoDB collection name
```
