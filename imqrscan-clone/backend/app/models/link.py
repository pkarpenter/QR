from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


def validate_http_url(v: str) -> str:
    if not isinstance(v, str):
        v = str(v)
    v_clean = v.strip()
    lower = v_clean.lower()
    if not (lower.startswith("http://") or lower.startswith("https://")):
        raise ValueError("URL must start with http:// or https://")
    forbidden = ["javascript:", "data:", "file:", "vbscript:"]
    for prefix in forbidden:
        if lower.startswith(prefix):
            raise ValueError(f"URL cannot use dangerous scheme: {prefix}")
    return v_clean


class LinkCreate(BaseModel):
    title: str
    url: str

    @field_validator("url")
    def check_url(cls, v):
        return validate_http_url(v)


class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

    @field_validator("url")
    def check_url(cls, v):
        if v is not None:
            return validate_http_url(v)
        return v


class LinkResponse(BaseModel):
    id: str
    qr_id: str
    title: str
    url: str
    is_active: bool
    created_at: datetime
    scans_30d: Optional[int] = 0

    class Config:
        from_attributes = True
