from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.connection import get_db_session
from backend.db import repositories as repos
from backend.db.models import ProductModel
from backend.cache import redis_client, get_hit_rate
from backend.pipeline.orchestrator import PipelineOrchestrator
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
        cache_hit_rate = await get_hit_rate()

        return {
            "status": "ok",
            "total_products": len(products),
            "total_verdicts": len(verdicts),
            "pending_misses": len(misses),
            "cache_hit_rate": cache_hit_rate,
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
        hit_rate = await get_hit_rate()

        # Get additional cache info if Redis is available
        key_count = 0
        memory_usage_mb = 0
        if redis_client:
            try:
                info = await redis_client.info()
                key_count = sum(db_info.get('keys', 0) for db_info in [info] if isinstance(db_info, dict))
                memory_bytes = info.get('used_memory', 0)
                memory_usage_mb = round(memory_bytes / (1024 * 1024), 2)
            except Exception:
                pass

        return {
            "status": "ok",
            "cache": {
                "hit_rate": hit_rate,
                "key_count": key_count,
                "memory_usage_mb": memory_usage_mb,
            },
        }
    except Exception as e:
        logger.error(f"Cache stats failed: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/admin/refresh-all")
async def refresh_all_products(session: AsyncSession = Depends(get_db_session)):
    """Trigger pipeline for all products to generate verdicts."""
    try:
        result = await session.execute(select(ProductModel))
        products = result.scalars().all()

        logger.info(f"Starting refresh for {len(products)} products")

        refreshed = 0
        failed = 0

        for product in products:
            try:
                orchestrator = PipelineOrchestrator(session)
                await orchestrator.run_pipeline(product.name, product.locale)
                refreshed += 1
                logger.info(f"✅ Refreshed: {product.name}")
            except Exception as e:
                failed += 1
                logger.error(f"❌ Failed: {product.name} - {e}")

        return {
            "status": "ok",
            "message": f"Refresh complete: {refreshed} success, {failed} failed",
            "total": len(products),
            "refreshed": refreshed,
            "failed": failed,
        }
    except Exception as e:
        logger.error(f"Refresh all failed: {e}")
        return {"status": "error", "message": str(e)}
