from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/categories/{locale}")
async def get_categories(locale: str, session: AsyncSession = Depends(get_db_session)):
    """Get category page data (Tier 1 + Tier 2 ranked)."""
    logger.info(f"Categories request: {locale}")

    # TODO: Week 2 - implement category page logic
    return {
        "status": "ok",
        "categories": [],
        "message": f"Category data stub for locale '{locale}'",
    }
