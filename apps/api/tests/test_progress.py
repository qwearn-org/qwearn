"""
Unit tests for the progress API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_progress_default():
    """Verify default empty progress returned for new session."""
    response = client.get("/api/progress/test-session-123")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test-session-123"
    assert data["completed_lessons"] == []
    assert data["completed_challenges"] == []
    assert data["completed_qml_topics"] == []
    assert data["circuits_executed"] == 0
