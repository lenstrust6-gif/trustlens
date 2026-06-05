from datetime import datetime
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel


class Verdict(BaseModel):
    id: UUID | None = None
    product_id: UUID
    trust_score: Decimal  # 0.0-10.0
    summary: str  # 80-120 word AI summary
    pros: list[dict]  # [{text, mentions}]
    cons: list[dict]
    best_for: list[str]
    avoid_if: list[str]
    feature_scores: dict[str, float]  # {battery: 8.7, anc: 9.6}
    spec_tags: dict[str, str]  # {battery: 'confirms', weight: 'warns'}
    confidence_tier: str  # 'early', 'growing', 'established', 'mature'
    source_count_yt: int = 0
    source_count_amz: int = 0
    auth_score_avg: Decimal
    reviews_excluded: int = 0
    created_at: datetime | None = None
    expires_at: datetime | None = None
    refresh_trigger: str | None = None

    class Config:
        from_attributes = True
