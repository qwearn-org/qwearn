"""
Health check router.

Provides a simple /health endpoint for:
- Docker health checks
- Load balancer probes
- CI smoke tests to verify the API is running

Returns the API version and a status string. In future phases,
this could be extended to report MongoDB connectivity, Qiskit
availability, etc.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Return API health status and version."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "service": "qwearn-api",
    }
