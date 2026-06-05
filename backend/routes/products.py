from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.cache import get_verdict as cache_get_verdict
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/verdict/{locale}/{slug}")
async def get_verdict(locale: str, slug: str, session: AsyncSession = Depends(get_db_session)):
    """Get full verdict card for a product from cache or database."""
    logger.info(f"Verdict request: {locale}/{slug}")

    # Step 1: Check Redis cache
    cached = await cache_get_verdict(locale, slug)
    if cached:
        logger.info(f"Verdict cache hit: {locale}/{slug}")
        return cached

    # Step 2: Check database
    product = await repos.products.get_by_slug(session, slug, locale)
    if not product:
        logger.warning(f"Product not found: {locale}/{slug}")
        raise HTTPException(status_code=404, detail="Product not found")

    verdict = await repos.verdicts.get_by_product_id(session, product.id)
    if not verdict:
        logger.warning(f"Verdict not found for product {product.id}")
        raise HTTPException(status_code=404, detail="Verdict not found")

    # Convert to dict response
    verdict_dict = {
        "product": {
            "name": product.name,
            "slug": product.slug,
            "category": product.category,
            "locale": locale,
        },
        "trustScore": float(verdict.trust_score) if verdict.trust_score else 0.0,
        "confidenceTier": verdict.confidence_tier,
        "summary": verdict.summary,
        "pros": verdict.pros,
        "cons": verdict.cons,
        "bestFor": verdict.best_for,
        "avoidIf": verdict.avoid_if,
        "specTags": verdict.spec_tags,
        "featureScores": verdict.feature_scores,
        "reviewHighlights": [],  # TODO: fetch from review_highlights table
        "sourcePanel": {
            "youtubeCount": verdict.source_count_yt,
            "amazonCount": verdict.source_count_amz,
            "authScoreAvg": float(verdict.auth_score_avg) if verdict.auth_score_avg else 0.0,
            "excludedCount": verdict.reviews_excluded,
            "lastRefreshed": verdict.created_at.isoformat() if verdict.created_at else None,
        },
        "alternatives": [],
        "locale": locale,
    }

    logger.info(f"Verdict served from DB: {locale}/{slug}")
    return verdict_dict
