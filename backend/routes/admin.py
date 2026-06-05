from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/admin/stats")
async def get_stats(session: AsyncSession = Depends(get_db_session)):
    """Admin dashboard KPIs."""
    # TODO: Week 6 - implement admin stats
    return {"status": "ok", "message": "Admin stats stub"}


@router.get("/admin/pipeline/status")
async def get_pipeline_status(session: AsyncSession = Depends(get_db_session)):
    """Pipeline step timing."""
    # TODO: Week 6 - implement pipeline monitoring
    return {"status": "ok", "message": "Pipeline status stub"}


@router.get("/admin/products")
async def get_products(session: AsyncSession = Depends(get_db_session)):
    """Full product index."""
    # TODO: Week 6 - implement product list
    return {"status": "ok", "products": []}


@router.get("/admin/misses")
async def get_search_misses(session: AsyncSession = Depends(get_db_session)):
    """Search miss queue."""
    # TODO: Week 6 - implement search miss retrieval
    return {"status": "ok", "misses": []}


@router.get("/admin/quotas")
async def get_quotas(session: AsyncSession = Depends(get_db_session)):
    """API quota status."""
    # TODO: Week 6 - implement quota monitoring
    return {"status": "ok", "quotas": {}}


@router.get("/admin/costs")
async def get_costs(session: AsyncSession = Depends(get_db_session)):
    """Month-to-date cost breakdown."""
    # TODO: Week 6 - implement cost tracking
    return {"status": "ok", "costs": {}}


@router.get("/admin/cache")
async def get_cache_stats(session: AsyncSession = Depends(get_db_session)):
    """Redis cache statistics."""
    # TODO: Week 6 - implement cache stats
    return {"status": "ok", "cache": {}}
