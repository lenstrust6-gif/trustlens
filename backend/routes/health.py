from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.db.connection import get_db_session
from backend.cache import get_hit_rate
from backend.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/health")
async def health_check(session: AsyncSession = Depends(get_db_session)):
    """Health check endpoint with cache and DB status."""
    status = {"status": "ok"}

    # Check database
    try:
        await session.execute(text("SELECT 1"))
        status["db"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        status["db"] = "error"

    # Check Redis
    try:
        hit_rate = await get_hit_rate()
        status["redis"] = "connected"
        status["cache_hit_rate"] = hit_rate
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        status["redis"] = "error"
        status["cache_hit_rate"] = 0.0

    # Provider info
    status["amazon_provider"] = settings.amazon_provider

    return status
