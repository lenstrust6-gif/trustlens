"""Service for filtering and sorting products."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, desc, asc, func
from backend.db.models import ProductModel, VerdictModel
from decimal import Decimal
from typing import Optional


class FilterService:
    """Service for advanced product filtering and sorting."""

    @staticmethod
    async def filter_products(
        session: AsyncSession,
        locale: str,
        category: Optional[str] = None,
        trust_score_min: Optional[float] = None,
        trust_score_max: Optional[float] = None,
        brands: Optional[list[str]] = None,
        sort_by: str = "trust_score_desc",  # trust_score_asc, trust_score_desc, name_asc, name_desc, newest
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        """Filter and sort products with pagination."""
        # Build base query
        stmt = (
            select(ProductModel, VerdictModel)
            .outerjoin(VerdictModel, ProductModel.id == VerdictModel.product_id)
            .where(ProductModel.locale == locale)
        )

        # Apply filters
        filters = []

        if category:
            filters.append(ProductModel.category == category)

        if trust_score_min is not None:
            filters.append(VerdictModel.trust_score >= Decimal(str(trust_score_min)))

        if trust_score_max is not None:
            filters.append(VerdictModel.trust_score <= Decimal(str(trust_score_max)))

        if brands:
            filters.append(ProductModel.brand.in_(brands))

        if filters:
            stmt = stmt.where(and_(*filters))

        # Apply sorting
        if sort_by == "trust_score_asc":
            stmt = stmt.order_by(asc(VerdictModel.trust_score.nullsfirst()))
        elif sort_by == "name_asc":
            stmt = stmt.order_by(asc(ProductModel.name))
        elif sort_by == "name_desc":
            stmt = stmt.order_by(desc(ProductModel.name))
        elif sort_by == "newest":
            stmt = stmt.order_by(desc(ProductModel.created_at))
        else:  # trust_score_desc (default)
            stmt = stmt.order_by(desc(VerdictModel.trust_score.nullslast()))

        # Get total count before pagination
        count_stmt = select(func.count(ProductModel.id)).select_from(stmt.subquery())
        count_result = await session.execute(count_stmt)
        total_count = count_result.scalar() or 0

        # Apply pagination
        stmt = stmt.limit(limit).offset(offset)

        # Execute query
        result = await session.execute(stmt)
        products_with_verdicts = result.all()

        # Format results
        products = []
        for product, verdict in products_with_verdicts:
            products.append(
                FilterService._format_product(product, verdict)
            )

        return {
            "products": products,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": (offset + limit) < total_count,
        }

    @staticmethod
    async def search_products(
        session: AsyncSession,
        locale: str,
        query: str,
        category: Optional[str] = None,
        trust_score_min: Optional[float] = None,
        sort_by: str = "trust_score_desc",
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """Full-text search with filters."""
        # Build query - search in name and brand
        search_filter = or_(
            ProductModel.name.ilike(f"%{query}%"),
            ProductModel.brand.ilike(f"%{query}%"),
            ProductModel.category.ilike(f"%{query}%"),
        )

        stmt = (
            select(ProductModel, VerdictModel)
            .outerjoin(VerdictModel, ProductModel.id == VerdictModel.product_id)
            .where(
                and_(
                    ProductModel.locale == locale,
                    search_filter,
                )
            )
        )

        # Apply optional filters
        if category:
            stmt = stmt.where(ProductModel.category == category)

        if trust_score_min is not None:
            stmt = stmt.where(VerdictModel.trust_score >= Decimal(str(trust_score_min)))

        # Apply sorting
        if sort_by == "trust_score_asc":
            stmt = stmt.order_by(asc(VerdictModel.trust_score.nullsfirst()))
        elif sort_by == "name_asc":
            stmt = stmt.order_by(asc(ProductModel.name))
        else:
            stmt = stmt.order_by(desc(VerdictModel.trust_score.nullslast()))

        # Get count
        count_stmt = select(func.count(ProductModel.id)).select_from(stmt.subquery())
        count_result = await session.execute(count_stmt)
        total_count = count_result.scalar() or 0

        # Paginate
        stmt = stmt.limit(limit).offset(offset)
        result = await session.execute(stmt)
        products_with_verdicts = result.all()

        products = [
            FilterService._format_product(product, verdict)
            for product, verdict in products_with_verdicts
        ]

        return {
            "products": products,
            "query": query,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "hasMore": (offset + limit) < total_count,
        }

    @staticmethod
    def _format_product(product: ProductModel, verdict: Optional[VerdictModel]):
        """Format product with verdict for response."""
        return {
            "id": str(product.id),
            "name": product.name,
            "slug": product.slug,
            "category": product.category,
            "brand": product.brand,
            "locale": product.locale,
            "trustScore": float(verdict.trust_score) if verdict and verdict.trust_score else None,
            "confidenceTier": verdict.confidence_tier if verdict else None,
            "sourceCountYT": verdict.source_count_yt if verdict else 0,
            "sourceCountAMZ": verdict.source_count_amz if verdict else 0,
        }

    @staticmethod
    async def get_available_brands(
        session: AsyncSession,
        locale: str,
        category: Optional[str] = None,
    ) -> list[str]:
        """Get list of available brands for filtering."""
        stmt = select(ProductModel.brand.distinct()).where(ProductModel.locale == locale)

        if category:
            stmt = stmt.where(ProductModel.category == category)

        stmt = stmt.order_by(ProductModel.brand)

        result = await session.execute(stmt)
        brands = [row[0] for row in result.all() if row[0]]
        return brands

    @staticmethod
    async def get_trust_score_range(
        session: AsyncSession,
        locale: str,
        category: Optional[str] = None,
    ) -> dict:
        """Get min/max trust scores for a locale/category."""
        stmt = select(
            func.min(VerdictModel.trust_score).label("min"),
            func.max(VerdictModel.trust_score).label("max"),
        ).select_from(VerdictModel).join(ProductModel)

        filters = [ProductModel.locale == locale]
        if category:
            filters.append(ProductModel.category == category)

        stmt = stmt.where(and_(*filters))

        result = await session.execute(stmt)
        min_score, max_score = result.one()

        return {
            "min": float(min_score) if min_score else 0.0,
            "max": float(max_score) if max_score else 10.0,
        }
