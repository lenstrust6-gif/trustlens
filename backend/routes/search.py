from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.services.search_service import SearchService

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    product_name: str
    locale: str = "in"
    trust_score_min: float = 0.0
    trust_score_max: float = 10.0
    auth_score_min: int = 0
    source: str = "all"
    confidence_tiers: list[str] = []
    category: str | None = None
    sort_by: str = "score"
    limit: int = 20
    offset: int = 0


@router.post("/api/v1/search")
async def search(request: SearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search for products with filters and return list of verdicts."""
    logger.info(f"Search: {request.product_name}")

    try:
        result = await SearchService.search_products(
            session,
            query=request.product_name,
            trust_score_min=request.trust_score_min,
            trust_score_max=request.trust_score_max,
            auth_score_min=request.auth_score_min,
            source=request.source,
            confidence_tiers=request.confidence_tiers if request.confidence_tiers else None,
            category=request.category,
            limit=request.limit,
            offset=request.offset,
        )
        
        return {
            "total": result["total"],
            "results": result["results"],
            "filters_applied": {
                "trust_score_min": request.trust_score_min,
                "trust_score_max": request.trust_score_max,
                "auth_score_min": request.auth_score_min,
                "source": request.source,
                "confidence_tiers": request.confidence_tiers,
                "category": request.category,
            },
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {
            "total": 0,
            "results": [],
            "error": str(e),
        }


@router.get("/api/v1/search/filter-stats")
async def get_filter_stats(
    locale: str = Query("in"),
    category: str | None = Query(None),
    session: AsyncSession = Depends(get_db_session),
):
    """Get available filter ranges and options from database."""
    try:
        stats = await SearchService.get_filter_stats(session, category=category)
        return stats
    except Exception as e:
        logger.error(f"Filter stats error: {e}")
        return {
            "trust_score_range": [0, 10],
            "auth_score_range": [0, 100],
            "sources": [],
            "confidence_tiers": [],
            "categories": [],
            "total_products": 0,
            "error": str(e),
        }
