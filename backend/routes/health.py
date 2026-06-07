from fastapi import APIRouter
from backend.cache import get_hit_rate
from backend.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/health")
async def health_check():
    """Health check endpoint with cache and DB status."""
    status = {"status": "ok"}

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

    # Database: Using async SQLAlchemy + asyncpg has authentication issues
    # Backend will use mock data from cache until asyncpg is fully configured
    status["db"] = "mock_mode"
    status["note"] = "Using cached mock data - real data pipeline on standby"

    return status
