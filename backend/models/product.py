from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class Product(BaseModel):
    id: UUID | None = None
    name: str
    slug: str
    asin: str | None = None
    locale: str  # 'in', 'us', 'uk'
    category: str | None = None
    brand: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
