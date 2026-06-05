"""Tests for category quick picks service."""
import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.quick_picks_service import QuickPicksService
from backend.db import repositories as repos


class TestQuickPicksService:
    """Test quick picks service."""

    @pytest.mark.asyncio
    async def test_get_category_quick_picks_empty_category(self, db_session: AsyncSession):
        """Test getting quick picks for empty category."""
        quick_picks = await QuickPicksService.get_category_quick_picks(
            session=db_session,
            locale="in",
            category="nonexistent",
        )

        assert quick_picks["best_overall"] is None
        assert quick_picks["budget"] is None
        assert quick_picks["premium"] is None

    @pytest.mark.asyncio
    async def test_get_category_quick_picks_single_product(self, db_session: AsyncSession):
        """Test getting quick picks with single product."""
        # Create product and verdict
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="tws-earbuds",
            brand="TestBrand",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=Decimal("8.5"),
            summary="Great product",
            confidence_tier="established",
        )
        await db_session.commit()

        quick_picks = await QuickPicksService.get_category_quick_picks(
            session=db_session,
            locale="in",
            category="tws-earbuds",
        )

        assert quick_picks["best_overall"] is not None
        assert quick_picks["best_overall"]["name"] == "Test Product"
        assert quick_picks["best_overall"]["trustScore"] == 8.5

    @pytest.mark.asyncio
    async def test_get_category_quick_picks_multiple_products(self, db_session: AsyncSession):
        """Test getting quick picks with multiple products."""
        # Create 3 products with different scores
        product_data = [
            ("Product A", "product-a", Decimal("9.2")),
            ("Product B", "product-b", Decimal("8.0")),
            ("Product C", "product-c", Decimal("7.5")),
        ]

        products = []
        for name, slug, score in product_data:
            product = await repos.products.create(
                session=db_session,
                name=name,
                slug=slug,
                locale="in",
                category="smartwatches",
                brand=f"Brand{name[-1]}",
            )
            await db_session.commit()

            verdict = await repos.verdicts.create(
                session=db_session,
                product_id=product.id,
                trust_score=score,
                summary=f"Summary for {name}",
                confidence_tier="established",
            )
            await db_session.commit()
            products.append(product)

        quick_picks = await QuickPicksService.get_category_quick_picks(
            session=db_session,
            locale="in",
            category="smartwatches",
        )

        # Best overall should be highest score
        assert quick_picks["best_overall"]["name"] == "Product A"
        assert quick_picks["best_overall"]["trustScore"] == 9.2

        # Budget should be lowest with score >= 7.0
        assert quick_picks["budget"]["trustScore"] >= 7.0

        # Premium should be second highest or next candidate
        assert quick_picks["premium"] is not None

    @pytest.mark.asyncio
    async def test_get_category_quick_picks_filters_by_locale(self, db_session: AsyncSession):
        """Test that quick picks are filtered by locale."""
        # Create product in 'in' locale
        product_in = await repos.products.create(
            session=db_session,
            name="India Product",
            slug="india-product",
            locale="in",
            category="power-banks",
            brand="Brand1",
        )
        await db_session.commit()

        verdict_in = await repos.verdicts.create(
            session=db_session,
            product_id=product_in.id,
            trust_score=Decimal("8.5"),
            summary="India product",
            confidence_tier="established",
        )
        await db_session.commit()

        # Create product in 'us' locale
        product_us = await repos.products.create(
            session=db_session,
            name="US Product",
            slug="us-product",
            locale="us",
            category="power-banks",
            brand="Brand2",
        )
        await db_session.commit()

        verdict_us = await repos.verdicts.create(
            session=db_session,
            product_id=product_us.id,
            trust_score=Decimal("9.0"),
            summary="US product",
            confidence_tier="established",
        )
        await db_session.commit()

        # Get quick picks for 'in' locale
        quick_picks_in = await QuickPicksService.get_category_quick_picks(
            session=db_session,
            locale="in",
            category="power-banks",
        )

        # Should only return India product
        assert quick_picks_in["best_overall"]["name"] == "India Product"

        # Get quick picks for 'us' locale
        quick_picks_us = await QuickPicksService.get_category_quick_picks(
            session=db_session,
            locale="us",
            category="power-banks",
        )

        # Should only return US product
        assert quick_picks_us["best_overall"]["name"] == "US Product"

    @pytest.mark.asyncio
    async def test_get_all_categories_quick_picks(self, db_session: AsyncSession):
        """Test getting quick picks for all categories."""
        # Create products in different categories
        categories = ["tws-earbuds", "smartwatches", "power-banks"]

        for category in categories:
            product = await repos.products.create(
                session=db_session,
                name=f"Product in {category}",
                slug=f"product-{category}",
                locale="in",
                category=category,
                brand="TestBrand",
            )
            await db_session.commit()

            verdict = await repos.verdicts.create(
                session=db_session,
                product_id=product.id,
                trust_score=Decimal("8.5"),
                summary=f"Summary for {category}",
                confidence_tier="established",
            )
            await db_session.commit()

        # Get all quick picks
        all_quick_picks = await QuickPicksService.get_all_categories_quick_picks(
            session=db_session,
            locale="in",
        )

        # Should have entries for all categories
        assert len(all_quick_picks) == 3
        assert "tws-earbuds" in all_quick_picks
        assert "smartwatches" in all_quick_picks
        assert "power-banks" in all_quick_picks

        # Each category should have best_overall
        for category in categories:
            assert all_quick_picks[category]["best_overall"] is not None


class TestQuickPicksAPI:
    """Test quick picks API endpoints."""

    @pytest.mark.asyncio
    async def test_quick_picks_endpoint_not_found(self):
        """Test quick picks endpoint with nonexistent category."""
        # This would be tested with TestClient in a real setup
        # For now, we're testing the service logic
        pass

    @pytest.mark.asyncio
    async def test_all_quick_picks_endpoint(self):
        """Test all quick picks endpoint."""
        # This would be tested with TestClient in a real setup
        pass
