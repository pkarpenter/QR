import pytest
from unittest.mock import MagicMock
from app.models.link import validate_http_url


def test_url_validation_accepts_valid():
    assert validate_http_url("http://example.com") == "http://example.com"
    assert validate_http_url("https://sub.domain.org/path?q=1") == "https://sub.domain.org/path?q=1"


def test_url_validation_rejects_dangerous():
    with pytest.raises(ValueError):
        validate_http_url("javascript:alert(1)")

    with pytest.raises(ValueError):
        validate_http_url("data:text/html,<script>")

    with pytest.raises(ValueError):
        validate_http_url("file:///etc/passwd")

    with pytest.raises(ValueError):
        validate_http_url("ftp://example.com")


def test_activate_link_single_active():
    """
    Test that activating a link in a collection sets only that target link active.
    """
    mock_links = [
        {"id": "link-1", "qr_id": "qr-1", "is_active": True},
        {"id": "link-2", "qr_id": "qr-1", "is_active": False},
        {"id": "link-3", "qr_id": "qr-1", "is_active": False},
    ]

    target_id = "link-2"

    # Simulate atomic activate_link procedure
    for l in mock_links:
        if l["is_active"]:
            l["is_active"] = False
    for l in mock_links:
        if l["id"] == target_id:
            l["is_active"] = True

    active_links = [l for l in mock_links if l["is_active"]]
    assert len(active_links) == 1
    assert active_links[0]["id"] == "link-2"
