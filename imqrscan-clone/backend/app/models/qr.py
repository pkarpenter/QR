from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class QrCodeCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class QrCodeResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    slug: str
    redirect_url: str
    is_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

