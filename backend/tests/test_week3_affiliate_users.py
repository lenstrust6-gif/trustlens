"""Tests for Week 3: Affiliate Links and User Management."""
import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import repositories as repos


class TestAffiliateLinks:
    """Test affiliate link management."""

    @pytest.mark.asyncio
    async def test_create_affiliate_link(self, db_session: AsyncSession):
        """Test creating an affiliate link."""
        # Create product first
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="tws-earbuds",
            brand="TestBrand",
        )
        await db_session.commit()

        # Create affiliate link
        link = await repos.affiliate.create_affiliate_link(
            session=db_session,
            product_id=product.id,
            amazon_url="https://amazon.in/dp/B1234567890",
            tracking_code="trustlens-20",
        )

        assert link.product_id == product.id
        assert "amazon.in" in link.amazon_url
        assert link.tracking_code == "trustlens-20"
        assert link.click_count == 0
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_get_affiliate_link(self, db_session: AsyncSession):
        """Test retrieving an affiliate link."""
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="power-banks",
            brand="Brand",
        )
        await db_session.commit()

        link = await repos.affiliate.create_affiliate_link(
            session=db_session,
            product_id=product.id,
            amazon_url="https://amazon.in/dp/B9876543210",
        )
        await db_session.commit()

        retrieved = await repos.affiliate.get_by_product_id(session=db_session, product_id=product.id)

        assert retrieved is not None
        assert retrieved.id == link.id

    @pytest.mark.asyncio
    async def test_record_click(self, db_session: AsyncSession):
        """Test recording a click on an affiliate link."""
        product = await repos.products.create(
            session=db_session,
            name="Test",
            slug="test",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        link = await repos.affiliate.create_affiliate_link(
            session=db_session,
            product_id=product.id,
            amazon_url="https://amazon.in/dp/TESTTEST",
        )
        await db_session.commit()

        # Record clicks
        await repos.affiliate.record_click(session=db_session, product_id=product.id)
        await repos.affiliate.record_click(session=db_session, product_id=product.id)
        await db_session.commit()

        retrieved = await repos.affiliate.get_by_product_id(session=db_session, product_id=product.id)
        assert retrieved.click_count == 2

    @pytest.mark.asyncio
    async def test_get_all_for_products(self, db_session: AsyncSession):
        """Test getting affiliate links for multiple products."""
        product_ids = []
        for i in range(3):
            product = await repos.products.create(
                session=db_session,
                name=f"Product {i}",
                slug=f"product-{i}",
                locale="in",
                category="test",
                brand="test",
            )
            await db_session.commit()

            await repos.affiliate.create_affiliate_link(
                session=db_session,
                product_id=product.id,
                amazon_url=f"https://amazon.in/dp/TEST{i}",
            )
            await db_session.commit()
            product_ids.append(product.id)

        links = await repos.affiliate.get_all_for_products(session=db_session, product_ids=product_ids)

        assert len(links) == 3


class TestUserManagement:
    """Test user management."""

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        """Test creating a user."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
            name="Test User",
            google_id="google-123456",
        )
        await db_session.commit()

        assert user.email == "user@example.com"
        assert user.name == "Test User"
        assert user.google_id == "google-123456"

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, db_session: AsyncSession):
        """Test retrieving user by email."""
        await repos.users.create_user(
            session=db_session,
            email="user@example.com",
            name="Test User",
        )
        await db_session.commit()

        user = await repos.users.get_user_by_email(session=db_session, email="user@example.com")

        assert user is not None
        assert user.email == "user@example.com"

    @pytest.mark.asyncio
    async def test_get_user_by_google_id(self, db_session: AsyncSession):
        """Test retrieving user by Google ID."""
        await repos.users.create_user(
            session=db_session,
            email="user@example.com",
            google_id="google-987654",
        )
        await db_session.commit()

        user = await repos.users.get_user_by_google_id(session=db_session, google_id="google-987654")

        assert user is not None
        assert user.google_id == "google-987654"


class TestUserPreferences:
    """Test user preferences management."""

    @pytest.mark.asyncio
    async def test_get_or_create_preferences(self, db_session: AsyncSession):
        """Test getting or creating user preferences."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
        )
        await db_session.commit()

        prefs = await repos.users.get_or_create_preferences(session=db_session, user_id=user.id)

        assert prefs.user_id == user.id
        assert prefs.email_notifications is True
        assert prefs.default_locale == "in"
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_update_preferences(self, db_session: AsyncSession):
        """Test updating user preferences."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
        )
        await db_session.commit()

        updated = await repos.users.update_preferences(
            session=db_session,
            user_id=user.id,
            email_notifications=False,
            default_locale="us",
            default_sort="name_asc",
        )
        await db_session.commit()

        assert updated.email_notifications is False
        assert updated.default_locale == "us"
        assert updated.default_sort == "name_asc"


class TestSavedSearches:
    """Test saved searches management."""

    @pytest.mark.asyncio
    async def test_create_saved_search(self, db_session: AsyncSession):
        """Test creating a saved search."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
        )
        await db_session.commit()

        search = await repos.users.create_saved_search(
            session=db_session,
            user_id=user.id,
            query="wireless earbuds",
            category="tws-earbuds",
            filters={"brand": ["boAt", "Noise"]},
        )
        await db_session.commit()

        assert search.query == "wireless earbuds"
        assert search.category == "tws-earbuds"
        assert search.filters["brand"] == ["boAt", "Noise"]

    @pytest.mark.asyncio
    async def test_get_saved_searches(self, db_session: AsyncSession):
        """Test retrieving saved searches."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
        )
        await db_session.commit()

        # Create multiple searches
        for i in range(3):
            await repos.users.create_saved_search(
                session=db_session,
                user_id=user.id,
                query=f"search {i}",
            )
        await db_session.commit()

        searches = await repos.users.get_saved_searches(session=db_session, user_id=user.id)

        assert len(searches) == 3

    @pytest.mark.asyncio
    async def test_delete_saved_search(self, db_session: AsyncSession):
        """Test deleting a saved search."""
        user = await repos.users.create_user(
            session=db_session,
            email="user@example.com",
        )
        await db_session.commit()

        search = await repos.users.create_saved_search(
            session=db_session,
            user_id=user.id,
            query="test search",
        )
        await db_session.commit()
        search_id = search.id

        # Delete search
        deleted = await repos.users.delete_saved_search(session=db_session, search_id=search_id, user_id=user.id)
        await db_session.commit()

        assert deleted is True

        # Verify deleted
        searches = await repos.users.get_saved_searches(session=db_session, user_id=user.id)
        assert len(searches) == 0
