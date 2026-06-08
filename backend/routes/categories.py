from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.db.connection import get_db_session
from backend.db.models import ProductModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/categories/{locale}")
async def get_categories(locale: str, session: AsyncSession = Depends(get_db_session)):
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
        logger.error(f"Categories failed: {e}")
        return {
            "status": "error",
            "message": str(e),
            "categories": [],
        }
