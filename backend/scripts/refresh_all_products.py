#!/usr/bin/env python3
"""
Refresh all products in database - fetch YouTube data and generate verdicts.
Usage: python -m backend.scripts.refresh_all_products
"""
import asyncio
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from backend.db.models import ProductModel
from backend.pipeline.orchestrator import PipelineOrchestrator
from backend.config import settings


async def refresh_all_products():
    """Trigger pipeline for all products."""
    engine = create_async_engine(settings.database_url, echo=False)

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    try:
        async with async_session() as session:
            # Get all products
            result = await session.execute(select(ProductModel))
            products = result.scalars().all()

            print(f"Found {len(products)} products. Starting refresh...")
            print("=" * 60)

            for i, product in enumerate(products, 1):
                print(f"[{i}/{len(products)}] Processing: {product.name}")
                try:
                    orchestrator = PipelineOrchestrator(session)
                    await orchestrator.run_pipeline(product.name, product.locale)
                    print(f"  ✅ Complete")
                except Exception as e:
                    print(f"  ❌ Error: {e}")

            print("=" * 60)
            print("Refresh complete!")

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(refresh_all_products())
