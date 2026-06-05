from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify
from backend.db.connection import get_db_session
from backend.cache import get_verdict
from backend.pipeline.orchestrator import run_pipeline
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    product_name: str
    locale: str = "in"


@router.post("/api/v1/search")
async def search(request: SearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search for product and run full verdict pipeline."""
    logger.info(f"Search request: {request.product_name} ({request.locale})")

    slug = slugify(request.product_name)

    # Step 1: Check cache
    cached_verdict = await get_verdict(request.locale, slug)
    if cached_verdict:
        logger.info(f"Cache hit for {request.locale}/{slug}")
        return cached_verdict

    # Step 2: Run full pipeline
    verdict_card = await run_pipeline(request.product_name, request.locale, session)

    if verdict_card is None:
        # Log search miss
        await repos.misses.upsert(session, request.product_name, request.locale)
        await session.commit()
        logger.warning(f"Pipeline failed for '{request.product_name}'")
        raise HTTPException(
            status_code=404,
            detail=f"No reviews found for '{request.product_name}'. Search miss logged.",
        )

    await session.commit()
    return verdict_card
