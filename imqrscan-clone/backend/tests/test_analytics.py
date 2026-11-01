import pytest
from app.services.analytics_service import compute_qr_analytics


def test_compute_qr_analytics_kpi_math():
    sample_scans = [
        {"scanned_at": "2026-10-31T10:15:00Z", "ip_hash": "hash-1", "device": "Mobile", "city": "Mumbai", "link_id": "l-1"},
        {"scanned_at": "2026-10-31T10:30:00Z", "ip_hash": "hash-2", "device": "Desktop", "city": "Delhi", "link_id": "l-1"},
        {"scanned_at": "2026-10-31T11:00:00Z", "ip_hash": "hash-1", "device": "Mobile", "city": "Mumbai", "link_id": "l-2"},
        {"scanned_at": "2026-10-30T14:00:00Z", "ip_hash": "hash-3", "device": "Tablet", "city": "Bengaluru", "link_id": "l-1"},
    ]
    sample_links = [
        {"id": "l-1", "title": "Homepage"},
        {"id": "l-2", "title": "Promo Offer"},
    ]

    res = compute_qr_analytics(sample_scans, sample_links, days=30)

    # Total scans
    assert res["kpis"]["total_scans"] == 4

    # Unique visitors (hash-1, hash-2, hash-3) = 3
    assert res["kpis"]["unique_visitors"] == 3
    assert res["kpis"]["unique_percentage"] == 75.0

    # Device breakdown
    devices = {d["device"]: d["count"] for d in res["devices"]}
    assert devices["Mobile"] == 2
    assert devices["Desktop"] == 1
    assert devices["Tablet"] == 1

    # Cities
    cities = {c["city"]: c["count"] for c in res["cities"]}
    assert cities["Mumbai"] == 2
    assert cities["Delhi"] == 1
    assert cities["Bengaluru"] == 1

    # Top device
    assert res["top_device"] == "Mobile"
    assert res["top_city"] == "Mumbai"
