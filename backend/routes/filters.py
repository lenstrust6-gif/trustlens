"""Routes for product filtering and search."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.services.filter_service import FilterService
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/products", tags=["filters"])


@router.get("/filter")
async def filter_products(
    locale: str = Query("in", description="Product locale"),
    category: Optional[str] = Query(None, description="Filter by category"),
    trust_score_min: Optional[float] = Query(None, description="Minimum trust score (0-10)"),
    trust_score_max: Optional[float] = Query(None, description="Maximum trust score (0-10)"),
    brands: Optional[str] = Query(None, description="Comma-separated brand names"),
    sort: str = Query("trust_score_desc", description="Sort by: trust_score_desc, trust_score_asc, name_asc, name_desc, newest"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=None,
):
    """Filter products by multiple criteria with pagination."""
    if db is None:
        db = get_db_session()

    try:
        # Parse brands list
        brands_list = None
        if brands:
            brands_list = [b.strip() for b in brands.split(",")]

        async with db.session() as session:
            results = await FilterService.filter_products(
                session=session,
                locale=locale,
                category=category,
                trust_score_min=trust_score_min,
                trust_score_max=trust_score_max,
                brands=brands_list,
                sort_by=sort,
                limit=limit,
                offset=offset,
            )

            return {
                "status": "ok",
                "locale": locale,
                "filters": {
                    "category": category,
                    "trustScoreMin": trust_score_min,
                    "trustScoreMax": trust_score_max,
                    "brands": brands_list,
                    "sortBy": sort,
                },
                **results,
            }

    except Exception as e:
        logger.error(f"Error filtering products: {str(e)}")
        raise HTTPException(status_code=500, detail="Error filtering products")


@router.get("/search")
async def search_products(
    q: str = Query(..., description="Search query"),
    locale: str = Query("in", description="Product locale"),
    category: Optional[str] = Query(None, description="Filter by category"),
    trust_score_min: Optional[float] = Query(None, description="Minimum trust score"),
    sort: str = Query("trust_score_desc", description="Sort by"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=None,
):
    """Full-text search with optional filters."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            results = await FilterService.search_products(
                session=session,
                locale=locale,
                query=q,
                category=category,
                trust_score_min=trust_score_min,
                sort_by=sort,
                limit=limit,
                offset=offset,
            )

            return {
                "status": "ok",
                "locale": locale,
                **results,
            }

    except Exception as e:
        logger.error(f"Error searching products: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching products")


@router.get("/brands")
async def get_available_brands(
    locale: str = Query("in", description="Product locale"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db=None,
):
    """Get list of available brands for filtering."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            brands = await FilterService.get_available_brands(
                session=session,
                locale=locale,
                category=category,
            )

            return {
                "status": "ok",
                "locale": locale,
                "category": category,
                "brands": brands,
            }

    except Exception as e:
        logger.error(f"Error fetching brands: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching brands")


@router.get("/trust-score-range")
async def get_trust_score_range(
    locale: str = Query("in", description="Product locale"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db=None,
):
    """Get trust score range for filtering."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            score_range = await FilterService.get_trust_score_range(
                session=session,
                locale=locale,
                category=category,
            )

            return {
                "status": "ok",
                "locale": locale,
                "category": category,
                "trustScoreRange": score_range,
            }

    except Exception as e:
        logger.error(f"Error fetching score range: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching score range")
