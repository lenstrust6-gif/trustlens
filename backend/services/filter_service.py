"""Filter service for product search and filtering."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import ProductModel, VerdictModel
import logging

logger = logging.getLogger(__name__)


class FilterService:
    """Service for filtering and sorting products."""

    @staticmethod
    async def filter_products(
        session: AsyncSession,
        locale: str = "in",
        category: str | None = None,
        trust_score_min: float | None = None,
        trust_score_max: float | None = None,
        brands: list[str] | None = None,
        sort_by: str = "trust_score_desc",
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """Filter products from database with optional filters."""
        try:
            # Build query
            stmt = select(ProductModel).where(ProductModel.locale == locale)

            if category:
                stmt = stmt.where(ProductModel.category == category)

            # Execute query
            result = await session.execute(stmt)
            products = result.scalars().all()

            # Build result list with verdict data
            filtered_products = []
            for product in products:
                # Get verdict for this product
                verdict_stmt = select(VerdictModel).where(
                    VerdictModel.product_id == product.id
                )
                verdict_result = await session.execute(verdict_stmt)
                verdict = verdict_result.scalars().first()

                if not verdict:
                    continue  # Skip products without verdicts

                trust_score = float(verdict.trust_score) if verdict.trust_score else 0.0

                # Apply trust score filter
                if trust_score_min and trust_score < trust_score_min:
                    continue
                if trust_score_max and trust_score > trust_score_max:
                    continue

                # Apply brand filter
                if brands and product.brand not in brands:
                    continue

                filtered_products.append({
                    "id": str(product.id),
                    "name": product.name,
                    "slug": product.slug,
                    "category": product.category,
                    "brand": product.brand or "",
                    "trustScore": trust_score,
                    "confidenceTier": verdict.confidence_tier,
                })

            # Sort
            if sort_by == "trust_score_desc":
                filtered_products.sort(key=lambda x: x["trustScore"], reverse=True)
            elif sort_by == "trust_score_asc":
                filtered_products.sort(key=lambda x: x["trustScore"])
            elif sort_by == "name_asc":
                filtered_products.sort(key=lambda x: x["name"])
            elif sort_by == "name_desc":
                filtered_products.sort(key=lambda x: x["name"], reverse=True)

            # Paginate
            total = len(filtered_products)
            paginated = filtered_products[offset : offset + limit]

            return {
                "products": paginated,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        except Exception as e:
            logger.error(f"Error filtering products: {e}")
            raise

    @staticmethod
    async def search_products(
        session: AsyncSession,
        locale: str = "in",
        query: str = "",
        category: str | None = None,
        trust_score_min: float | None = None,
        sort_by: str = "trust_score_desc",
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """Search products by name/brand with optional filters."""
        try:
            # Build query
            stmt = select(ProductModel).where(ProductModel.locale == locale)

            if query:
                query_lower = query.lower()
                # Search in product name and brand
                from sqlalchemy import or_
                stmt = stmt.where(
                    or_(
                        ProductModel.name.ilike(f"%{query}%"),
                        ProductModel.brand.ilike(f"%{query}%"),
                    )
                )

            if category:
                stmt = stmt.where(ProductModel.category == category)

            # Execute query
            result = await session.execute(stmt)
            products = result.scalars().all()

            # Build result list with verdict data
            filtered_products = []
            for product in products:
                # Get verdict for this product
                verdict_stmt = select(VerdictModel).where(
                    VerdictModel.product_id == product.id
                )
                verdict_result = await session.execute(verdict_stmt)
                verdict = verdict_result.scalars().first()

                if not verdict:
                    continue

                trust_score = float(verdict.trust_score) if verdict.trust_score else 0.0

                if trust_score_min and trust_score < trust_score_min:
                    continue

                filtered_products.append({
                    "id": str(product.id),
                    "name": product.name,
                    "slug": product.slug,
                    "category": product.category,
                    "brand": product.brand or "",
                    "trustScore": trust_score,
                    "confidenceTier": verdict.confidence_tier,
                })

            # Sort
            if sort_by == "trust_score_desc":
                filtered_products.sort(key=lambda x: x["trustScore"], reverse=True)
            elif sort_by == "trust_score_asc":
                filtered_products.sort(key=lambda x: x["trustScore"])
            elif sort_by == "name_asc":
                filtered_products.sort(key=lambda x: x["name"])

            # Paginate
            total = len(filtered_products)
            paginated = filtered_products[offset : offset + limit]

            return {
                "results": paginated,
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            raise

    @staticmethod
    async def get_available_brands(
        session: AsyncSession,
        locale: str = "in",
        category: str | None = None,
    ) -> list[str]:
        """Get list of available brands for a category."""
        try:
            stmt = select(ProductModel.brand).where(ProductModel.locale == locale).distinct()

            if category:
                stmt = stmt.where(ProductModel.category == category)

            result = await session.execute(stmt)
            brands = [b for b in result.scalars().all() if b]
            return sorted(brands)
        except Exception as e:
            logger.error(f"Error fetching brands: {e}")
            return []

    @staticmethod
    async def get_trust_score_range(
        session: AsyncSession,
        locale: str = "in",
        category: str | None = None,
    ) -> dict:
        """Get min/max trust scores for filtering."""
        try:
            from sqlalchemy import func

            # Get all verdicts for products in this locale/category
            stmt = select(VerdictModel).join(ProductModel).where(ProductModel.locale == locale)

            if category:
                stmt = stmt.where(ProductModel.category == category)

            result = await session.execute(stmt)
            verdicts = result.scalars().all()

            if not verdicts:
                return {"min": 0.0, "max": 10.0}

            scores = [float(v.trust_score) for v in verdicts if v.trust_score]
            if not scores:
                return {"min": 0.0, "max": 10.0}

            return {
                "min": round(min(scores), 1),
                "max": round(max(scores), 1),
            }
        except Exception as e:
            logger.error(f"Error fetching score range: {e}")
            return {"min": 0.0, "max": 10.0}
