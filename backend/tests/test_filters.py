"""Tests for product filtering and search service."""
import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.filter_service import FilterService
from backend.db import repositories as repos


class TestFilterService:
    """Test product filtering service."""

    @pytest.fixture
    async def sample_products(self, db_session: AsyncSession):
        """Create sample products for testing."""
        products_data = [
            ("boAt Airdopes 141", "boat-airdopes-141", "tws-earbuds", "boAt", Decimal("8.5")),
            ("Noise Buds Pro", "noise-buds-pro", "tws-earbuds", "Noise", Decimal("8.0")),
            ("Realme Buds Air 3S", "realme-buds-air-3s", "tws-earbuds", "Realme", Decimal("7.5")),
            ("Noise ColorFit Pro 4", "noise-colorfitpro4", "smartwatches", "Noise", Decimal("7.9")),
            ("boAt Storm", "boat-storm", "smartwatches", "boAt", Decimal("7.2")),
            ("Mi Power Bank 3i", "mi-power-bank-3i", "power-banks", "Xiaomi", Decimal("8.1")),
        ]

        products = []
        for name, slug, category, brand, score in products_data:
            product = await repos.products.create(
                session=db_session,
                name=name,
                slug=slug,
                locale="in",
                category=category,
                brand=brand,
            )
            await db_session.commit()

            verdict = await repos.verdicts.create(
                session=db_session,
                product_id=product.id,
                trust_score=score,
                summary=f"Summary for {name}",
                confidence_tier="established",
                source_count_yt=42,
                source_count_amz=38,
            )
            await db_session.commit()
            products.append((product, verdict))

        return products

    @pytest.mark.asyncio
    async def test_filter_by_category(self, db_session: AsyncSession, sample_products):
        """Test filtering by category."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            category="tws-earbuds",
        )

        assert results["total"] == 3
        assert len(results["products"]) == 3
        assert all(p["category"] == "tws-earbuds" for p in results["products"])

    @pytest.mark.asyncio
    async def test_filter_by_trust_score_range(self, db_session: AsyncSession, sample_products):
        """Test filtering by trust score range."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            trust_score_min=8.0,
            trust_score_max=8.5,
        )

        assert len(results["products"]) > 0
        assert all(8.0 <= p["trustScore"] <= 8.5 for p in results["products"])

    @pytest.mark.asyncio
    async def test_filter_by_brand(self, db_session: AsyncSession, sample_products):
        """Test filtering by brand."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            brands=["boAt", "Noise"],
        )

        assert results["total"] >= 4  # boAt and Noise products
        assert all(p["brand"] in ["boAt", "Noise"] for p in results["products"])

    @pytest.mark.asyncio
    async def test_sort_by_trust_score_desc(self, db_session: AsyncSession, sample_products):
        """Test sorting by trust score descending."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            sort_by="trust_score_desc",
        )

        scores = [p["trustScore"] for p in results["products"] if p["trustScore"]]
        assert scores == sorted(scores, reverse=True)

    @pytest.mark.asyncio
    async def test_sort_by_name_asc(self, db_session: AsyncSession, sample_products):
        """Test sorting by name ascending."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            sort_by="name_asc",
        )

        names = [p["name"] for p in results["products"]]
        assert names == sorted(names)

    @pytest.mark.asyncio
    async def test_pagination(self, db_session: AsyncSession, sample_products):
        """Test pagination."""
        # First page
        results1 = await FilterService.filter_products(
            session=db_session,
            locale="in",
            limit=2,
            offset=0,
        )

        assert len(results1["products"]) == 2
        assert results1["hasMore"] is True

        # Second page
        results2 = await FilterService.filter_products(
            session=db_session,
            locale="in",
            limit=2,
            offset=2,
        )

        assert len(results2["products"]) == 2
        # Verify different products
        ids1 = [p["id"] for p in results1["products"]]
        ids2 = [p["id"] for p in results2["products"]]
        assert ids1 != ids2

    @pytest.mark.asyncio
    async def test_search_products_by_name(self, db_session: AsyncSession, sample_products):
        """Test full-text search by product name."""
        results = await FilterService.search_products(
            session=db_session,
            locale="in",
            query="boAt",
        )

        assert len(results["products"]) > 0
        assert all("boAt" in p["name"] or "boAt" in p["brand"] for p in results["products"])

    @pytest.mark.asyncio
    async def test_search_products_by_brand(self, db_session: AsyncSession, sample_products):
        """Test full-text search by brand."""
        results = await FilterService.search_products(
            session=db_session,
            locale="in",
            query="Noise",
        )

        assert len(results["products"]) > 0
        assert any("Noise" in p["brand"] for p in results["products"])

    @pytest.mark.asyncio
    async def test_search_with_category_filter(self, db_session: AsyncSession, sample_products):
        """Test search with category filter."""
        results = await FilterService.search_products(
            session=db_session,
            locale="in",
            query="boAt",
            category="tws-earbuds",
        )

        assert all(p["category"] == "tws-earbuds" for p in results["products"])

    @pytest.mark.asyncio
    async def test_get_available_brands(self, db_session: AsyncSession, sample_products):
        """Test getting available brands."""
        brands = await FilterService.get_available_brands(
            session=db_session,
            locale="in",
        )

        assert len(brands) > 0
        assert "boAt" in brands
        assert "Noise" in brands

    @pytest.mark.asyncio
    async def test_get_available_brands_by_category(self, db_session: AsyncSession, sample_products):
        """Test getting brands for specific category."""
        brands = await FilterService.get_available_brands(
            session=db_session,
            locale="in",
            category="tws-earbuds",
        )

        # Should only have brands from tws-earbuds
        assert "boAt" in brands
        assert "Noise" in brands
        assert "Realme" in brands

    @pytest.mark.asyncio
    async def test_get_trust_score_range(self, db_session: AsyncSession, sample_products):
        """Test getting trust score range."""
        score_range = await FilterService.get_trust_score_range(
            session=db_session,
            locale="in",
        )

        assert score_range["min"] <= score_range["max"]
        assert score_range["min"] >= 0.0
        assert score_range["max"] <= 10.0

    @pytest.mark.asyncio
    async def test_combined_filters(self, db_session: AsyncSession, sample_products):
        """Test combining multiple filters."""
        results = await FilterService.filter_products(
            session=db_session,
            locale="in",
            category="tws-earbuds",
            trust_score_min=7.5,
            brands=["boAt", "Noise"],
            sort_by="trust_score_desc",
        )

        # Verify all filters applied
        assert all(p["category"] == "tws-earbuds" for p in results["products"])
        assert all(p["trustScore"] >= 7.5 for p in results["products"])
        assert all(p["brand"] in ["boAt", "Noise"] for p in results["products"])

        # Verify sorting
        scores = [p["trustScore"] for p in results["products"]]
        assert scores == sorted(scores, reverse=True)
