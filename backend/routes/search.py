from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from slugify import slugify
from backend.db.connection import get_db_session
from backend.cache import get_verdict
from backend.pipeline.orchestrator import fetch_raw_data
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    product_name: str
    locale: str = "in"


class SearchResponse(BaseModel):
    status: str
    youtube_comments: list[dict]
    amazon_reviews: list[dict]
    total_reviews: int


@router.post("/api/v1/search")
async def search(request: SearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search for product and fetch raw review data."""
    logger.info(f"Search request: {request.product_name} ({request.locale})")

    slug = slugify(request.product_name)

    # Step 1: Check cache
    cached_verdict = await get_verdict(request.locale, slug)
    if cached_verdict:
        logger.info(f"Cache hit for {request.locale}/{slug}")
        return SearchResponse(
            status="cached",
            youtube_comments=cached_verdict.get("youtube_comments", []),
            amazon_reviews=cached_verdict.get("amazon_reviews", []),
            total_reviews=len(cached_verdict.get("youtube_comments", []))
            + len(cached_verdict.get("amazon_reviews", [])),
        )

    # Step 2: Fetch raw data
    raw_data = await fetch_raw_data(request.product_name, request.locale)

    if not raw_data["fetch_ok"]:
        # Log search miss
        await repos.misses.upsert(session, request.product_name, request.locale)
        await session.commit()
        logger.warning(f"No data found for '{request.product_name}'")
        raise HTTPException(
            status_code=404,
            detail=f"No reviews found for '{request.product_name}'. Search miss logged.",
        )

    # Step 3: Return raw data
    await session.commit()
    return SearchResponse(
        status="ok",
        youtube_comments=raw_data["youtube_comments"],
        amazon_reviews=raw_data["amazon_reviews"],
        total_reviews=len(raw_data["youtube_comments"])
        + len(raw_data["amazon_reviews"]),
    )
