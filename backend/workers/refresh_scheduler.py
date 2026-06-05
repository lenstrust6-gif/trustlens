from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import repositories as repos
from backend.pipeline.orchestrator import run_pipeline
import logging

logger = logging.getLogger(__name__)


def get_refresh_interval_hours(product_age_days: int) -> int:
    """Tiered refresh interval based on product age."""
    if product_age_days < 30:
        return 48  # < 1 month: every 2 days
    if product_age_days < 180:
        return 168  # 1–6 months: weekly
    return 720  # > 6 months: monthly


async def refresh_stale_products(session: AsyncSession) -> dict:
    """
    Scan all products and refresh stale verdicts.
    Returns stats: {'refreshed': count, 'checked': count, 'errors': count}
    """
    stats = {"refreshed": 0, "checked": 0, "errors": 0}

    try:
        products = await repos.products.get_all(session)
        stats["checked"] = len(products)
        now = datetime.utcnow()

        for product in products:
            if not product.created_at:
                continue

            product_age = (now - product.created_at).days
            interval_hours = get_refresh_interval_hours(product_age)
            refresh_threshold = now - timedelta(hours=interval_hours)

            # Check if verdict needs refresh
            verdict = await repos.verdicts.get_by_product_id(session, product.id)
            if verdict and verdict.created_at and verdict.created_at > refresh_threshold:
                continue  # Verdict is fresh, skip

            # Refresh is needed
            logger.info(f"Refreshing stale verdict: {product.name} (age: {product_age} days)")
            try:
                await run_pipeline(product.name, product.locale, session)
                stats["refreshed"] += 1
            except Exception as e:
                logger.error(f"Refresh failed for {product.name}: {e}")
                stats["errors"] += 1

    except Exception as e:
        logger.error(f"Refresh scheduler failed: {e}")
        return {"error": str(e)}

    logger.info(f"Refresh complete: {stats['refreshed']} refreshed, {stats['errors']} errors")
    return stats
