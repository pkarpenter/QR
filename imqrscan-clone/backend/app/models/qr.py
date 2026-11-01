from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class QrCodeCreate(BaseModel):
    name: str


class QrCodeResponse(BaseModel):
    id: str
    name: str
    slug: str
    redirect_url: str
    is_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True
