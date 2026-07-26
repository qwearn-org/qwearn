"""
Tests for the circuit save/load API endpoints.

These tests verify CRUD operations on circuit saves using the
anonymous session-based identification (X-Session-ID header).

NOTE: These tests require a running MongoDB instance. In CI,
this is provided by the GitHub Actions service container.
For local development, start MongoDB with:
    docker run -d -p 27017:27017 --name qwearn-mongo mongo:7
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=True)

# A consistent session ID for test isolation
TEST_SESSION = "test-session-00000000-0000-0000-0000-000000000001"
OTHER_SESSION = "test-session-00000000-0000-0000-0000-000000000002"

BELL_CIRCUIT = {
    "title": "Bell State",
    "description": "Creates a Bell state |Φ+⟩",
    "circuit_spec": {
        "num_qubits": 2,
        "gates": [
            {"gate": "H", "qubits": [0]},
            {"gate": "CX", "qubits": [0, 1]},
        ],
    },
}

GHZ_CIRCUIT = {
    "title": "GHZ State",
    "circuit_spec": {
        "num_qubits": 3,
        "gates": [
            {"gate": "H", "qubits": [0]},
            {"gate": "CX", "qubits": [0, 1]},
            {"gate": "CX", "qubits": [0, 2]},
        ],
    },
}


class TestCircuitSavesCRUD:
    """Tests for the circuit saves CRUD endpoints."""

    @pytest.fixture(autouse=True)
    def _check_mongodb(self):
        """Skip tests if MongoDB is not available."""
        try:
            response = client.get(
                "/api/circuits/saves",
                headers={"X-Session-ID": "probe"},
            )
            # If we get a 200, MongoDB is available
            if response.status_code != 200:
                pytest.skip("MongoDB not available")
        except Exception:
            pytest.skip("MongoDB not available")

    def test_create_save(self) -> None:
        """POST /api/circuits/saves should create a new save."""
        response = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Bell State"
        assert data["description"] == "Creates a Bell state |Φ+⟩"
        assert data["circuit_spec"]["num_qubits"] == 2
        assert len(data["circuit_spec"]["gates"]) == 2
        assert data["session_id"] == TEST_SESSION
        assert "id" in data
        assert "created_at" in data

    def test_create_save_without_session_id(self) -> None:
        """POST without X-Session-ID should return 422."""
        response = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
        )
        assert response.status_code == 422

    def test_list_saves(self) -> None:
        """GET /api/circuits/saves should list saves for the session."""
        # Create two saves
        client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        client.post(
            "/api/circuits/saves",
            json=GHZ_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )

        response = client.get(
            "/api/circuits/saves",
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the 2 we just created (may have more from other tests)
        assert len(data) >= 2

    def test_list_saves_session_isolation(self) -> None:
        """Saves from one session should not appear in another session's list."""
        # Create a save with one session
        client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )

        # List with a different session
        response = client.get(
            "/api/circuits/saves",
            headers={"X-Session-ID": OTHER_SESSION},
        )
        data = response.json()
        # Should not contain saves from TEST_SESSION
        for save in data:
            assert save["session_id"] != TEST_SESSION

    def test_get_save(self) -> None:
        """GET /api/circuits/saves/{id} should return a specific save."""
        # Create
        create_resp = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        save_id = create_resp.json()["id"]

        # Get
        response = client.get(
            f"/api/circuits/saves/{save_id}",
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 200
        assert response.json()["id"] == save_id
        assert response.json()["title"] == "Bell State"

    def test_get_save_wrong_session(self) -> None:
        """GET with wrong session should return 404."""
        create_resp = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        save_id = create_resp.json()["id"]

        response = client.get(
            f"/api/circuits/saves/{save_id}",
            headers={"X-Session-ID": OTHER_SESSION},
        )
        assert response.status_code == 404

    def test_update_save(self) -> None:
        """PUT /api/circuits/saves/{id} should update title/spec."""
        create_resp = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        save_id = create_resp.json()["id"]

        response = client.put(
            f"/api/circuits/saves/{save_id}",
            json={"title": "Updated Bell State"},
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Bell State"
        # Description should remain unchanged
        assert response.json()["description"] == "Creates a Bell state |Φ+⟩"

    def test_delete_save(self) -> None:
        """DELETE /api/circuits/saves/{id} should remove the save."""
        create_resp = client.post(
            "/api/circuits/saves",
            json=BELL_CIRCUIT,
            headers={"X-Session-ID": TEST_SESSION},
        )
        save_id = create_resp.json()["id"]

        # Delete
        response = client.delete(
            f"/api/circuits/saves/{save_id}",
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 204

        # Verify it's gone
        get_resp = client.get(
            f"/api/circuits/saves/{save_id}",
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert get_resp.status_code == 404

    def test_get_nonexistent_save(self) -> None:
        """GET with a fake ID should return 404."""
        response = client.get(
            "/api/circuits/saves/000000000000000000000000",
            headers={"X-Session-ID": TEST_SESSION},
        )
        assert response.status_code == 404
