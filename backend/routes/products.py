from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.cache import get_verdict as cache_get_verdict
from backend.db import repositories as repos
from backend.db.models import ProductModel, VerdictModel
from backend.pipeline.orchestrator import run_pipeline
from pydantic import BaseModel
import logging
import re
import asyncio


def slugify(text: str) -> str:
    """Simple slug generator."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

logger = logging.getLogger(__name__)
router = APIRouter()


class CreateProductRequest(BaseModel):
    name: str
    brand: str | None = None
    category: str | None = None
    locale: str = "in"


@router.get("/api/v1/verdict/{locale}/{slug}")
async def get_verdict(locale: str, slug: str, session: AsyncSession = Depends(get_db_session)):
    """Get full verdict card for a product from cache or database."""
    logger.info(f"Verdict request: {locale}/{slug}")

    # Step 1: Check Redis cache
    cached = await cache_get_verdict(locale, slug)
    if cached:
        logger.info(f"Verdict cache hit: {locale}/{slug}")
        return cached

    # Step 2: Check database
    product = await repos.products.get_by_slug(session, slug, locale)
    if not product:
        logger.warning(f"Product not found: {locale}/{slug}")
        raise HTTPException(status_code=404, detail="Product not found")

    verdict = await repos.verdicts.get_by_product_id(session, product.id)
    if not verdict:
        logger.warning(f"Verdict not found for product {product.id}")
        raise HTTPException(status_code=404, detail="Verdict not found")

    # Convert to dict response
    verdict_dict = {
        "product": {
            "name": product.name,
            "slug": product.slug,
            "category": product.category,
            "locale": locale,
        },
        "trustScore": float(verdict.trust_score) if verdict.trust_score else 0.0,
        "confidenceTier": verdict.confidence_tier,
        "summary": verdict.summary,
        "pros": verdict.pros,
        "cons": verdict.cons,
        "bestFor": verdict.best_for,
        "avoidIf": verdict.avoid_if,
        "specTags": verdict.spec_tags,
        "featureScores": verdict.feature_scores,
        "reviewHighlights": [],  # TODO: fetch from review_highlights table
        "sourcePanel": {
            "youtubeCount": verdict.source_count_yt,
            "amazonCount": verdict.source_count_amz,
            "authScoreAvg": float(verdict.auth_score_avg) if verdict.auth_score_avg else 0.0,
            "excludedCount": verdict.reviews_excluded,
            "lastRefreshed": verdict.created_at.isoformat() if verdict.created_at else None,
        },
        "alternatives": [],
        "locale": locale,
    }

    logger.info(f"Verdict served from DB: {locale}/{slug}")
    return verdict_dict


@router.post("/api/v1/products")
async def create_product(
    req: CreateProductRequest,
    session: AsyncSession = Depends(get_db_session),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Create a new product and queue it for YouTube data fetching."""
    try:
        slug = slugify(req.name)

        # Check if product exists
        existing = await repos.products.get_by_slug(session, slug, req.locale)
        if existing:
            raise HTTPException(status_code=400, detail=f"Product '{req.name}' already exists")

        # Create product
        product = ProductModel(
            name=req.name,
            slug=slug,
            brand=req.brand,
            category=req.category,
            locale=req.locale
        )
        session.add(product)
        await session.flush()

        # Create empty verdict (will be filled by pipeline)
        verdict = VerdictModel(
            product_id=product.id,
            confidence_tier="pending",
            summary="Fetching YouTube data..."
        )
        session.add(verdict)
        await session.commit()

        # Trigger pipeline in background
        logger.info(f"Triggering pipeline for: {req.name} ({req.locale})")
        background_tasks.add_task(
            run_pipeline,
            product_name=req.name,
            locale=req.locale,
            session=session
        )

        logger.info(f"Created product: {req.name} ({slug})")
        return {
            "status": "created",
            "product": {
                "id": str(product.id),
                "name": product.name,
                "slug": product.slug,
                "category": product.category,
                "brand": product.brand,
                "locale": product.locale,
            },
            "message": "Product created. YouTube data will be fetched shortly."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


@router.get("/api/v1/products/{locale}/{slug}/related")
async def get_related_products(locale: str, slug: str, session: AsyncSession = Depends(get_db_session)):
    """Get similar and alternative products in the same category."""
    try:
        # Get the main product
        product = await repos.products.get_by_slug(session, slug, locale)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        verdict = await repos.verdicts.get_by_product_id(session, product.id)
        if not verdict:
            raise HTTPException(status_code=404, detail="Verdict not found")

        # Get all products in same category
        from sqlalchemy import select
        stmt = select(ProductModel).where(
            ProductModel.category == product.category,
            ProductModel.locale == locale,
            ProductModel.id != product.id
        )
        result = await session.execute(stmt)
        category_products = result.scalars().all()

        # Enrich with verdicts
        similar = []
        better_alternatives = []

        for p in category_products:
            v = await repos.verdicts.get_by_product_id(session, p.id)
            if not v or not v.trust_score:
                continue

            item = {
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "trust_score": float(v.trust_score),
                "summary": v.summary or "No verdict available",
                "confidence_tier": v.confidence_tier,
                "source_count_yt": v.source_count_yt,
            }

            # Similar: within ±1.5 trust score
            if abs(float(v.trust_score) - float(verdict.trust_score)) <= 1.5:
                similar.append(item)
            # Better alternatives: higher trust score
            elif float(v.trust_score) > float(verdict.trust_score):
                better_alternatives.append(item)

        # Sort by trust score descending
        similar.sort(key=lambda x: x["trust_score"], reverse=True)
        better_alternatives.sort(key=lambda x: x["trust_score"], reverse=True)

        return {
            "status": "ok",
            "current_product": {
                "name": product.name,
                "trust_score": float(verdict.trust_score),
                "category": product.category,
            },
            "similar_products": similar[:3],  # Top 3
            "better_alternatives": better_alternatives[:3],  # Top 3
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching related products: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching related products: {str(e)}")
