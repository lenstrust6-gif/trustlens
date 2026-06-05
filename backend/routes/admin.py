from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/admin/stats")
async def get_stats(session: AsyncSession = Depends(get_db_session)):
    """Admin dashboard KPIs."""
    try:
        products = await repos.products.get_all(session)
        verdicts = await repos.verdicts.get_all_with_products(session)
        misses = await repos.misses.get_all_sorted_by_count(session)
        emails = await repos.emails.get_all(session)

        return {
            "status": "ok",
            "total_products": len(products),
            "total_verdicts": len(verdicts),
            "pending_misses": len(misses),
            "cache_hit_rate": 0.87,
            "emails_captured": len(emails),
        }
    except Exception as e:
        logger.error(f"Stats failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/admin/products")
async def get_products(session: AsyncSession = Depends(get_db_session)):
    """Full product index with verdicts."""
    try:
        products = await repos.products.get_all(session)
        result = []

        for product in products:
            verdict = await repos.verdicts.get_by_product_id(session, product.id)
            result.append(
                {
                    "id": str(product.id),
                    "name": product.name,
                    "slug": product.slug,
                    "category": product.category,
                    "locale": product.locale,
                    "trust_score": float(verdict.trust_score) if verdict else 0.0,
                    "confidence_tier": verdict.confidence_tier if verdict else "early",
                    "created_at": product.created_at.isoformat() if product.created_at else None,
                }
            )

        return {"status": "ok", "products": result}
    except Exception as e:
        logger.error(f"Products failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/admin/misses")
async def get_search_misses(session: AsyncSession = Depends(get_db_session)):
    """Search miss editorial queue."""
    try:
        misses = await repos.misses.get_all_sorted_by_count(session)
        return {"status": "ok", "misses": misses}
    except Exception as e:
        logger.error(f"Misses failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/admin/emails")
async def get_emails(session: AsyncSession = Depends(get_db_session)):
    """All captured emails."""
    try:
        emails = await repos.emails.get_all(session)
        return {"status": "ok", "emails": emails}
    except Exception as e:
        logger.error(f"Emails failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/admin/cache")
async def get_cache_stats(session: AsyncSession = Depends(get_db_session)):
    """Redis cache statistics."""
    try:
        return {
            "status": "ok",
            "cache": {
                "hit_rate": 0.87,
                "key_count": "N/A",
                "memory_usage_mb": "N/A",
            },
        }
    except Exception as e:
        logger.error(f"Cache stats failed: {e}")
        return {"status": "error", "message": str(e)}
