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

# Load .env
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

async def fetch_verdicts():
    """Fetch real YouTube data and generate verdicts."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not set")

    print("🎬 Fetching real YouTube comments and generating verdicts...")
    print("=" * 80)

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Get all products
        stmt = select(ProductModel)
        result = await session.execute(stmt)
        products = result.scalars().all()

        print(f"Processing {len(products)} products...")
        print("=" * 80)

        for i, product in enumerate(products, 1):
            try:
                print(f"\n[{i}/{len(products)}] {product.name}")

                # Run pipeline for this product
                verdict = await run_pipeline(
                    session=session,
                    product_name=product.name,
                    product_slug=product.slug,
                    product_id=str(product.id),
                    locale=product.locale,
                )
                
                if verdict:
                    # Get or create verdict in database
                    verdict_stmt = select(VerdictModel).where(
                        VerdictModel.product_id == product.id
                    )
                    verdict_result = await session.execute(verdict_stmt)
                    existing_verdict = verdict_result.scalar()
                    
                    if existing_verdict:
                        # Update existing
                        existing_verdict.trust_score = verdict.get("trustScore")
                        existing_verdict.summary = verdict.get("summary")
                        existing_verdict.pros = verdict.get("pros", [])
                        existing_verdict.cons = verdict.get("cons", [])
                        existing_verdict.best_for = verdict.get("bestFor", [])
                        existing_verdict.avoid_if = verdict.get("avoidIf", [])
                        existing_verdict.feature_scores = verdict.get("featureScores", {})
                        existing_verdict.spec_tags = verdict.get("specTags", {})
                        existing_verdict.confidence_tier = verdict.get("confidenceTier")
                        existing_verdict.source_count_yt = verdict.get("sourcePanel", {}).get("youtubeCount", 0)
                        existing_verdict.source_count_amz = verdict.get("sourcePanel", {}).get("amazonCount", 0)
                        existing_verdict.auth_score_avg = verdict.get("sourcePanel", {}).get("authScoreAvg", 0)
                        await session.merge(existing_verdict)
                    
                    await session.commit()
                    print(f"  ✅ Generated verdict (score: {verdict.get('trustScore')})")
                else:
                    print(f"  ⚠️  No verdict generated")
                    
            except Exception as e:
                await session.rollback()
                print(f"  ❌ Error: {str(e)[:100]}")
        
        print("\n" + "=" * 80)
        print("🎉 Real verdicts generated successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fetch_verdicts())
