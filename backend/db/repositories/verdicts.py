from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import VerdictModel
from backend.models.verdict import Verdict
from decimal import Decimal
import uuid
from datetime import datetime


async def get_by_product_id(session: AsyncSession, product_id) -> Verdict | None:
    """Get latest verdict for a product."""
    stmt = select(VerdictModel).where(VerdictModel.product_id == product_id)
    result = await session.execute(stmt)
    verdict = result.scalars().first()
    if verdict:
        return Verdict.model_validate(verdict)
    return None


async def create(
    session: AsyncSession,
    product_id,
    trust_score: Decimal,
    summary: str,
    pros: list[dict],
    cons: list[dict],
    best_for: list[str],
    avoid_if: list[str],
    feature_scores: dict[str, float],
    spec_tags: dict[str, str],
    confidence_tier: str,
    source_count_yt: int = 0,
    source_count_amz: int = 0,
    auth_score_avg: Decimal = Decimal("0"),
    reviews_excluded: int = 0,
) -> Verdict:
    """Create a new verdict."""
    verdict = VerdictModel(
        id=uuid.uuid4(),
        product_id=product_id,
        trust_score=trust_score,
        summary=summary,
        pros=pros,
        cons=cons,
        best_for=best_for,
        avoid_if=avoid_if,
        feature_scores=feature_scores,
        spec_tags=spec_tags,
        confidence_tier=confidence_tier,
        source_count_yt=source_count_yt,
        source_count_amz=source_count_amz,
        auth_score_avg=auth_score_avg,
        reviews_excluded=reviews_excluded,
        created_at=datetime.utcnow(),
    )
    session.add(verdict)
    await session.flush()
    return Verdict.model_validate(verdict)
