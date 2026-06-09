"""Search service for querying real products from database."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.db.models import ProductModel, VerdictModel
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """Search and filter products from database."""
    
    @staticmethod
    async def search_products(
        session: AsyncSession,
        query: str | None = None,
        trust_score_min: float = 0.0,
        trust_score_max: float = 10.0,
        auth_score_min: int = 0,
        source: str = "all",
        confidence_tiers: list[str] | None = None,
        category: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """Search products with filters applied."""
        try:
            # Build base query
            stmt = select(ProductModel)

            # Add verdict join for filtering
            stmt = stmt.outerjoin(VerdictModel)

            # Apply text search filter
            if query:
                search_term = f"%{query.lower()}%"
                stmt = stmt.where(
                    ProductModel.name.ilike(search_term) |
                    ProductModel.brand.ilike(search_term)
                )

            # Apply category filter
            if category:
                stmt = stmt.where(ProductModel.category == category)

            # Apply trust score filter
            if trust_score_min > 0 or trust_score_max < 10:
                stmt = stmt.where(
                    VerdictModel.trust_score >= Decimal(str(trust_score_min)),
                    VerdictModel.trust_score <= Decimal(str(trust_score_max)),
                )

            # Apply auth score filter
            if auth_score_min > 0:
                stmt = stmt.where(
                    VerdictModel.auth_score_avg >= auth_score_min
                )

            # Apply confidence tier filter
            if confidence_tiers:
                stmt = stmt.where(
                    VerdictModel.confidence_tier.in_(confidence_tiers)
                )

            # Get total count
            count_stmt = select(func.count()).select_from(stmt.alias())
            count_result = await session.execute(count_stmt)
            total = count_result.scalar() or 0

            # Apply pagination
            stmt = stmt.distinct().offset(offset).limit(limit)

            # Execute query
            result = await session.execute(stmt)
            products = result.scalars().unique().all() or []

            # Fetch verdicts for each product
            results = []
            for product in products:
                verdict_stmt = select(VerdictModel).where(
                    VerdictModel.product_id == product.id
                ).order_by(VerdictModel.created_at.desc()).limit(1)
                verdict_result = await session.execute(verdict_stmt)
                verdict = verdict_result.scalar()

                if verdict:
                    results.append({
                        "product": {
                            "id": str(product.id),
                            "name": product.name,
                            "slug": product.slug,
                            "category": product.category,
                            "brand": product.brand,
                            "locale": product.locale,
                        },
                        "trust_score": float(verdict.trust_score) if verdict.trust_score else 0,
                        "confidence_tier": verdict.confidence_tier,
                        "summary": verdict.summary,
                        "pros": verdict.pros or [],
                        "cons": verdict.cons or [],
                        "best_for": verdict.best_for or [],
                        "avoid_if": verdict.avoid_if or [],
                        "feature_scores": verdict.feature_scores or {},
                        "spec_tags": verdict.spec_tags or {},
                        "source_count_yt": verdict.source_count_yt or 0,
                        "source_count_amz": verdict.source_count_amz or 0,
                        "auth_score_avg": float(verdict.auth_score_avg) if verdict.auth_score_avg else 0,
                    })

            return {
                "total": total,
                "results": results,
                "limit": limit,
                "offset": offset,
            }
        except Exception as e:
            logger.error(f"Search products failed: {e}")
            return {
                "total": 0,
                "results": [],
                "limit": limit,
                "offset": offset,
                "error": str(e),
            }
    
    @staticmethod
    async def get_filter_stats(
        session: AsyncSession,
        category: str | None = None,
    ) -> dict:
        """Get available filter ranges from database."""
        try:
            # Base query
            stmt = select(VerdictModel).join(ProductModel)

            if category:
                stmt = stmt.where(ProductModel.category == category)

            result = await session.execute(stmt)
            verdicts = result.scalars().all() or []

            if not verdicts:
                return {
                    "trust_score_range": [0, 10],
                    "auth_score_range": [0, 100],
                    "sources": [],
                    "confidence_tiers": [],
                    "categories": [],
                    "total_products": 0,
                }

            # Calculate ranges
            trust_scores = [v.trust_score for v in verdicts if v.trust_score]
            auth_scores = [v.auth_score_avg for v in verdicts if v.auth_score_avg]

            trust_min = float(min(trust_scores)) if trust_scores else 0
            trust_max = float(max(trust_scores)) if trust_scores else 10
            auth_min = float(min(auth_scores)) if auth_scores else 0
            auth_max = float(max(auth_scores)) if auth_scores else 100

            # Count by tier
            tier_counts = {}
            for v in verdicts:
                tier = v.confidence_tier or "unknown"
                tier_counts[tier] = tier_counts.get(tier, 0) + 1

            # Get categories
            cat_stmt = select(ProductModel.category).distinct()
            if category:
                cat_stmt = cat_stmt.where(ProductModel.category == category)
            cat_result = await session.execute(cat_stmt)
            categories = cat_result.scalars().all() or []

            return {
                "trust_score_range": [round(trust_min, 1), round(trust_max, 1)],
                "auth_score_range": [int(auth_min), int(auth_max)],
                "sources": [
                    {"label": "YouTube", "value": "youtube", "count": len(verdicts)},
                    {"label": "Amazon", "value": "amazon", "count": len(verdicts)},
                ],
                "confidence_tiers": [
                    {"label": tier.title(), "value": tier, "count": count}
                    for tier, count in sorted(tier_counts.items())
                ],
                "categories": [
                    {"label": cat.replace("-", " ").title(), "value": cat, "count": 1}
                    for cat in categories
                ],
                "total_products": len(verdicts),
            }
        except Exception as e:
            logger.error(f"Get filter stats failed: {e}")
            return {
                "trust_score_range": [0, 10],
                "auth_score_range": [0, 100],
                "sources": [],
                "confidence_tiers": [],
                "categories": [],
                "total_products": 0,
                "error": str(e),
            }
