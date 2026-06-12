from fastapi import APIRouter, Depends, HTTPException
from typing import Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.db.connection import get_db_session
from backend.db.models import ProductModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/categories/{locale}")
async def get_categories(
    locale: Literal["in", "us", "uk"],
    session: AsyncSession = Depends(get_db_session),
):
    """Get available categories for a locale with product counts."""
    logger.info(f"Categories request: {locale}")

    try:
        # Get unique categories and their product counts
        stmt = (
            select(
                ProductModel.category,
                func.count(ProductModel.id).label("product_count")
            )
            .where(ProductModel.locale == locale)
            .group_by(ProductModel.category)
            .order_by(func.count(ProductModel.id).desc())
        )

        result = await session.execute(stmt)
        rows = result.all()

        categories = [
            {
                "name": row.category,
                "slug": row.category,
                "product_count": row.product_count,
            }
            for row in rows
        ]

        return {
            "status": "ok",
            "locale": locale,
            "categories": categories,
            "total_categories": len(categories),
        }
    except Exception as e:
        logger.error(f"Categories failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to fetch categories",
            "categories": [],
        }


@router.get("/api/v1/categories/{locale}/quick-picks")
async def get_category_quick_picks(
    locale: Literal["in", "us", "uk"],
    limit: int = 3,
    session: AsyncSession = Depends(get_db_session),
):
    """Get quick picks (top products by trust score) for all categories."""
    logger.info(f"Quick picks request: {locale}")

    try:
        # Get all categories first
        categories_stmt = (
            select(ProductModel.category)
            .where(ProductModel.locale == locale)
            .distinct()
        )
        categories_result = await session.execute(categories_stmt)
        categories = [row[0] for row in categories_result.all()]

        quick_picks = {}

        # For each category, get top N products
        for category in categories:
            stmt = (
                select(
                    ProductModel.id,
                    ProductModel.name,
                    ProductModel.slug,
                    ProductModel.brand,
                    ProductModel.category,
                )
                .where(
                    ProductModel.locale == locale,
                    ProductModel.category == category,
                )
                .limit(limit)
            )
            result = await session.execute(stmt)
            products = [
                {
                    "id": row.id,
                    "name": row.name,
                    "slug": row.slug,
                    "brand": row.brand,
                    "category": row.category,
                }
                for row in result.all()
            ]
            quick_picks[category] = products

        return {
            "status": "ok",
            "locale": locale,
            "quick_picks": quick_picks,
        }
    except Exception as e:
        logger.error(f"Quick picks failed: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to fetch quick picks",
            "quick_picks": {},
        }
