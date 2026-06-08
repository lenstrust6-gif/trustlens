"""Fetch real YouTube comments and generate verdicts for products."""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from backend.db.models import ProductModel, VerdictModel
from backend.pipeline.orchestrator import run_pipeline

env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

async def fetch_youtube_verdicts():
    """Fetch real YouTube data and generate verdicts."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set")

    print("🎬 Fetching REAL YouTube comments and generating verdicts...")
    print("=" * 80)

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            stmt = select(ProductModel).limit(50)
            result = await session.execute(stmt)
            products = result.scalars().all()

            print(f"Processing {len(products)} products...")
            print("=" * 80)

            success_count = 0
            error_count = 0

            for i, product in enumerate(products, 1):
                try:
                    print(f"\n[{i}/{len(products)}] {product.name}")

                    verdict = await run_pipeline(
                        product_name=product.name,
                        locale=product.locale,
                        session=session,
                    )

                    if verdict:
                        stmt = select(VerdictModel).where(
                            VerdictModel.product_id == product.id
                        )
                        result = await session.execute(stmt)
                        existing_verdict = result.scalar()

                        if existing_verdict:
                            existing_verdict.trust_score = verdict.get("trustScore", 7.5)
                            existing_verdict.summary = verdict.get("summary", "")
                            existing_verdict.pros = verdict.get("pros", [])
                            existing_verdict.cons = verdict.get("cons", [])
                            existing_verdict.best_for = verdict.get("bestFor", [])
                            existing_verdict.avoid_if = verdict.get("avoidIf", [])
                            existing_verdict.feature_scores = verdict.get("featureScores", {})
                            existing_verdict.spec_tags = verdict.get("specTags", {})
                            existing_verdict.confidence_tier = verdict.get("confidenceTier", "established")

                            source_panel = verdict.get("sourcePanel", {})
                            existing_verdict.source_count_yt = source_panel.get("youtubeCount", 0)
                            existing_verdict.source_count_amz = source_panel.get("amazonCount", 0)
                            existing_verdict.auth_score_avg = source_panel.get("authScoreAvg", 74.5)

                            await session.merge(existing_verdict)
                            await session.commit()

                        print(f"  ✅ Real verdict: {verdict.get('trustScore', 'N/A')}/10")
                        success_count += 1
                    else:
                        print(f"  ⚠️  No verdict generated (using fallback)")

                except Exception as e:
                    await session.rollback()
                    error_count += 1
                    print(f"  ❌ Error: {str(e)[:80]}")

            print("\n" + "=" * 80)
            print(f"✅ Complete: {success_count} succeeded, {error_count} errors")
            print("=" * 80)

    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fetch_youtube_verdicts())
