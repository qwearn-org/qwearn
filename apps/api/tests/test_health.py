"""
Test the health check endpoint.

This is the simplest possible test — it verifies the API boots
and the /health endpoint returns the expected shape. It does NOT
require a running MongoDB instance (the health endpoint doesn't
touch the database).
"""

from fastapi.testclient import TestClient


def test_health_check() -> None:
    """GET /health should return status=healthy and the current version."""
    # Import inside the test so Beanie's lifespan doesn't try to connect to Mongo.
    # We bypass the lifespan by constructing the client directly from the app object.
    from app.main import app

    # Use TestClient without triggering the lifespan (no Mongo needed for health)
    with TestClient(app, raise_server_exceptions=True) as client:
        response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "qwearn-api"
    assert "version" in data
