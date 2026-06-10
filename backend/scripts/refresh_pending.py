"""
Refresh pending verdicts (handles Gemini API rate limit)
Run via cron: */15 * * * * cd /path/to/trustlens && python -m backend.scripts.refresh_pending

Processes 1 pending product every 15 minutes (respects Gemini 5 req/min limit)
"""
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from backend.config import settings
from backend.db.models import ProductModel, VerdictModel
from backend.pipeline.orchestrator import run_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def refresh_pending():
    """Find and refresh 1 pending product."""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            # Find first pending verdict
            stmt = select(VerdictModel).where(
                VerdictModel.summary.like('TrustLens verdict pending%')
            ).limit(1)

            result = await session.execute(stmt)
            verdict = result.scalar()

            if not verdict:
                logger.info("✅ No pending verdicts - all products have AI summaries!")
                return

            # Get product
            product_stmt = select(ProductModel).where(
                ProductModel.id == verdict.product_id
            )
            product_result = await session.execute(product_stmt)
            product = product_result.scalar()

            if not product:
                logger.warning(f"Product not found for verdict {verdict.id}")
                return

            logger.info(f"🔄 Refreshing pending verdict for: {product.name}")

            # Run pipeline for this product
            await run_pipeline(
                product_name=product.name,
                locale=product.locale,
                session=session
            )

            logger.info(f"✅ Refreshed: {product.name}")

    except Exception as e:
        logger.error(f"❌ Error refreshing pending verdict: {e}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(refresh_pending())
