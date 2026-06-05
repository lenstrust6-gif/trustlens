"""Service for generating category quick picks (Best Overall, Budget, Premium)."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, desc, func
from backend.db.models import ProductModel, VerdictModel
from decimal import Decimal


class QuickPicksService:
    """Generate quick picks for categories."""

    @staticmethod
    async def get_category_quick_picks(
        session: AsyncSession,
        locale: str,
        category: str,
    ) -> dict:
        """Get quick picks for a category (Best Overall, Budget, Premium)."""
        # Get all products in category with verdicts
        stmt = (
            select(ProductModel, VerdictModel)
            .join(VerdictModel, ProductModel.id == VerdictModel.product_id)
            .where(
                and_(
                    ProductModel.locale == locale,
                    ProductModel.category == category,
                )
            )
            .order_by(desc(VerdictModel.trust_score))
        )
        result = await session.execute(stmt)
        products_with_verdicts = result.all()

        if not products_with_verdicts:
            return {
                "best_overall": None,
                "budget": None,
                "premium": None,
            }

        # Best Overall: highest trust score
        best_overall = products_with_verdicts[0] if products_with_verdicts else None

        # Budget: lowest price with decent trust score (>7.0)
        budget_candidate = None
        for product, verdict in products_with_verdicts:
            if verdict.trust_score and verdict.trust_score >= Decimal("7.0"):
                budget_candidate = (product, verdict)
                break

        # Premium: highest overall quality (could have additional criteria)
        # For now, we'll use the second highest trust score if available
        premium_candidate = products_with_verdicts[1] if len(products_with_verdicts) > 1 else None

        return {
            "best_overall": QuickPicksService._format_pick(best_overall),
            "budget": QuickPicksService._format_pick(budget_candidate),
            "premium": QuickPicksService._format_pick(premium_candidate),
        }

    @staticmethod
    def _format_pick(product_verdict_tuple):
        """Format a quick pick for response."""
        if not product_verdict_tuple:
            return None

        product, verdict = product_verdict_tuple
        return {
            "name": product.name,
            "slug": product.slug,
            "category": product.category,
            "brand": product.brand,
            "trustScore": float(verdict.trust_score) if verdict.trust_score else None,
            "confidenceTier": verdict.confidence_tier,
            "summary": verdict.summary,
        }

    @staticmethod
    async def get_all_categories_quick_picks(
        session: AsyncSession,
        locale: str,
    ) -> dict:
        """Get quick picks for all categories in a locale."""
        # Get all distinct categories
        stmt = select(ProductModel.category).where(ProductModel.locale == locale).distinct()
        result = await session.execute(stmt)
        categories = [row[0] for row in result.all() if row[0]]

        quick_picks_by_category = {}
        for category in categories:
            quick_picks_by_category[category] = await QuickPicksService.get_category_quick_picks(
                session, locale, category
            )

        return quick_picks_by_category
