import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock


@pytest.fixture
def client():
    with patch("app.database.create_client", return_value=MagicMock()):
        from app.main import app
        return TestClient(app)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_redirect_not_found(client):
    """Slug with no active link returns 404 HTML page."""
    with patch("app.api.redirect.get_active_link", new_callable=AsyncMock, return_value=None):
        resp = client.get("/go/nonexistent", follow_redirects=False)
        assert resp.status_code == 404


def test_redirect_found(client):
    """Valid slug redirects to the active link URL."""
    fake_link = {"id": "link-1", "url": "https://example.com", "qr_id": "qr-1"}
    with patch("app.api.redirect.get_active_link", new_callable=AsyncMock, return_value=fake_link):
        with patch("app.api.redirect.log_scan", return_value=None):
            resp = client.get("/go/abc123", follow_redirects=False)
            assert resp.status_code == 302
            assert resp.headers["location"] == "https://example.com"
            assert "no-store" in resp.headers.get("cache-control", "").lower()



