from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel, Field, validator
from typing import Literal
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.services.search_service import SearchService

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=255)
    locale: Literal["in", "us", "uk"] = "in"
    trust_score_min: float = Field(default=0.0, ge=0.0, le=10.0)
    trust_score_max: float = Field(default=10.0, ge=0.0, le=10.0)
    auth_score_min: int = Field(default=0, ge=0, le=100)
    source: Literal["all", "youtube", "amazon"] = "all"
    confidence_tiers: list[str] = []
    category: str | None = Field(default=None, max_length=100)
    sort_by: Literal["score", "recent", "popular"] = "score"
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    @validator("trust_score_max")
    def validate_score_range(cls, v, values):
        if "trust_score_min" in values and v < values["trust_score_min"]:
            raise ValueError("trust_score_max must be >= trust_score_min")
        return v

    @validator("confidence_tiers")
    def validate_tiers(cls, v):
        valid_tiers = {"early", "growing", "established", "mature"}
        for tier in v:
            if tier not in valid_tiers:
                raise ValueError(f"Invalid tier: {tier}")
        return v


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
