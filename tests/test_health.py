"""Test suite for health check endpoint."""
from fastapi.testclient import TestClient

from app.main import app


def test_health_check() -> None:
    """Test that health check endpoint returns expected response."""
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
