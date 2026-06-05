from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class Review(BaseModel):
    id: UUID | None = None
    verdict_id: UUID
    source: str  # 'youtube' or 'amazon'
    text: str
    rating: float
    auth_score: int  # 0-100
    helpful_count: int = 0
    reviewer_meta: dict | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
