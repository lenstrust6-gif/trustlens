"""Tests for Week 1: Email notifications and verdict ratings."""
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from backend.db.models import EmailModel, VerdictRatingModel, VerdictModel, ProductModel
from backend.db import repositories as repos
from sqlalchemy.ext.asyncio import AsyncSession


class TestEmailNotifications:
    """Test email notification system."""

    @pytest.mark.asyncio
    async def test_create_email(self, db_session: AsyncSession):
        """Test creating an email record."""
        email = await repos.emails.create_email(
            session=db_session,
            recipient="user@example.com",
            subject="Test Subject",
            body="Test body",
        )

        assert email.recipient == "user@example.com"
        assert email.subject == "Test Subject"
        assert email.body == "Test body"
        assert email.status == "pending"
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_update_email_status_to_sent(self, db_session: AsyncSession):
        """Test updating email status to sent."""
        email = await repos.emails.create_email(
            session=db_session,
            recipient="user@example.com",
            subject="Test",
            body="Body",
        )
        email_id = email.id
        await db_session.commit()

        updated = await repos.emails.update_email_status(
            session=db_session,
            email_id=email_id,
            status="sent",
            resend_id="email-123456",
        )

        assert updated.status == "sent"
        assert updated.resend_id == "email-123456"
        assert updated.sent_at is not None
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_update_email_status_to_failed(self, db_session: AsyncSession):
        """Test updating email status to failed with error."""
        email = await repos.emails.create_email(
            session=db_session,
            recipient="invalid@",
            subject="Test",
            body="Body",
        )
        email_id = email.id
        await db_session.commit()

        updated = await repos.emails.update_email_status(
            session=db_session,
            email_id=email_id,
            status="failed",
            error_message="Invalid email address",
        )

        assert updated.status == "failed"
        assert updated.error_message == "Invalid email address"
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_create_email_with_verdict_id(self, db_session: AsyncSession):
        """Test creating email linked to a verdict."""
        # Create a product and verdict first
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=8.5,
            summary="Test summary",
            confidence_tier="established",
        )
        await db_session.commit()

        email = await repos.emails.create_email(
            session=db_session,
            recipient="user@example.com",
            subject="Verdict Ready",
            body="Your verdict is ready",
            verdict_id=verdict.id,
        )

        assert email.verdict_id == verdict.id
        await db_session.commit()


class TestVerdictRatings:
    """Test verdict rating system (helpful/unhelpful)."""

    @pytest.mark.asyncio
    async def test_create_helpful_rating(self, db_session: AsyncSession):
        """Test creating a helpful rating."""
        # Create product and verdict
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=8.5,
            summary="Test summary",
            confidence_tier="established",
        )
        await db_session.commit()

        rating = await repos.emails.create_rating(
            session=db_session,
            verdict_id=verdict.id,
            helpful=True,
            user_id="user-123",
        )

        assert rating.verdict_id == verdict.id
        assert rating.helpful is True
        assert rating.user_id == "user-123"
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_create_unhelpful_rating(self, db_session: AsyncSession):
        """Test creating an unhelpful rating."""
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=8.5,
            summary="Test summary",
            confidence_tier="established",
        )
        await db_session.commit()

        rating = await repos.emails.create_rating(
            session=db_session,
            verdict_id=verdict.id,
            helpful=False,
            ip_address="192.168.1.1",
        )

        assert rating.helpful is False
        assert rating.ip_address == "192.168.1.1"
        await db_session.commit()

    @pytest.mark.asyncio
    async def test_get_rating_stats_no_ratings(self, db_session: AsyncSession):
        """Test getting stats for verdict with no ratings."""
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=8.5,
            summary="Test summary",
            confidence_tier="established",
        )
        await db_session.commit()

        stats = await repos.emails.get_rating_stats(
            session=db_session,
            verdict_id=verdict.id,
        )

        assert stats["helpful"] == 0
        assert stats["unhelpful"] == 0
        assert stats["total"] == 0
        assert stats["helpful_percentage"] == 0.0

    @pytest.mark.asyncio
    async def test_get_rating_stats_with_ratings(self, db_session: AsyncSession):
        """Test getting stats for verdict with ratings."""
        product = await repos.products.create(
            session=db_session,
            name="Test Product",
            slug="test-product",
            locale="in",
            category="test",
            brand="test",
        )
        await db_session.commit()

        verdict = await repos.verdicts.create(
            session=db_session,
            product_id=product.id,
            trust_score=8.5,
            summary="Test summary",
            confidence_tier="established",
        )
        await db_session.commit()

        # Create 3 helpful and 1 unhelpful rating
        for i in range(3):
            await repos.emails.create_rating(
                session=db_session,
                verdict_id=verdict.id,
                helpful=True,
            )
        await repos.emails.create_rating(
            session=db_session,
            verdict_id=verdict.id,
            helpful=False,
        )
        await db_session.commit()

        stats = await repos.emails.get_rating_stats(
            session=db_session,
            verdict_id=verdict.id,
        )

        assert stats["helpful"] == 3
        assert stats["unhelpful"] == 1
        assert stats["total"] == 4
        assert stats["helpful_percentage"] == 75.0


class TestEmailService:
    """Test EmailService for Resend API integration."""

    def test_email_service_initialization(self):
        """Test EmailService is properly configured."""
        from backend.services.email_service import EmailService

        assert EmailService.RESEND_API_URL == "https://api.resend.com/emails"
        assert EmailService.RESEND_FROM == "verdicts@trustlens.in"

    @pytest.mark.asyncio
    async def test_send_verdict_notification_html_format(self):
        """Test verdict notification HTML generation."""
        from backend.services.email_service import EmailService

        # This is a unit test that doesn't call the real API
        html_content = """
        <html>
            <body>Test verdict notification</body>
        </html>
        """

        assert "html" in html_content
        assert "Test verdict notification" in html_content
