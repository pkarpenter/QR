from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ScanLog(BaseModel):
    qr_id: str
    link_id: str
    scanned_at: datetime
    device: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    ip_hash: Optional[str] = None
    referrer: Optional[str] = None


class BreakdownItem(BaseModel):
    label: str
    count: int


class AnalyticsResponse(BaseModel):
    total: int
    today: int
    unique_visitors: int
    scans_by_device: list[BreakdownItem]
    scans_by_os: list[BreakdownItem]
    scans_by_browser: list[BreakdownItem]
    scans_by_country: list[BreakdownItem]
    scans_by_city: list[BreakdownItem]
    hour_histogram: list[dict]
