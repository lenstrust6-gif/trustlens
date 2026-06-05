from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import EmailCaptureModel, EmailModel, VerdictRatingModel
import uuid
from datetime import datetime, timezone
from uuid import UUID


async def create(
    session: AsyncSession,
    email: str,
    product_name: str | None = None,
    locale: str = "in",
) -> EmailCaptureModel:
    """Create an email capture for notify-me."""
    capture = EmailCaptureModel(
        id=uuid.uuid4(),
        email=email,
        product_name=product_name,
        locale=locale,
        notified=False,
        created_at=datetime.utcnow(),
    )
    session.add(capture)
    await session.flush()
    return capture


async def get_all(session: AsyncSession) -> list[dict]:
    """Get all email captures."""
    stmt = select(EmailCaptureModel).order_by(EmailCaptureModel.created_at.desc())
    result = await session.execute(stmt)
    captures = result.scalars().all()
    return [
        {
            "email": c.email,
            "product_name": c.product_name,
            "locale": c.locale,
            "notified": c.notified,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in captures
    ]


# EMAIL NOTIFICATION FUNCTIONS

async def create_email(
    session: AsyncSession,
    recipient: str,
    subject: str,
    body: str,
    verdict_id: UUID | None = None,
    email_capture_id: UUID | None = None,
) -> EmailModel:
    """Create a new email notification record."""
    email = EmailModel(
        recipient=recipient,
        subject=subject,
        body=body,
        verdict_id=verdict_id,
        email_capture_id=email_capture_id,
        status="pending",
    )
    session.add(email)
    await session.flush()
    return email


async def update_email_status(
    session: AsyncSession,
    email_id: UUID,
    status: str,
    resend_id: str | None = None,
    error_message: str | None = None,
) -> EmailModel | None:
    """Update email status (pending, sent, failed, bounced)."""
    stmt = select(EmailModel).where(EmailModel.id == email_id)
    result = await session.execute(stmt)
    email = result.scalars().first()

    if not email:
        return None

    email.status = status
    if resend_id:
        email.resend_id = resend_id
    if error_message:
        email.error_message = error_message
    if status == "sent":
        email.sent_at = datetime.now(timezone.utc)

    await session.flush()
    return email


async def get_pending_emails(session: AsyncSession, limit: int = 50) -> list[EmailModel]:
    """Get pending emails for sending."""
    stmt = select(EmailModel).where(EmailModel.status == "pending").limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()


# VERDICT RATING FUNCTIONS

async def create_rating(
    session: AsyncSession,
    verdict_id: UUID,
    helpful: bool,
    user_id: str | None = None,
    ip_address: str | None = None,
) -> VerdictRatingModel:
    """Create a verdict rating (helpful/unhelpful)."""
    rating = VerdictRatingModel(
        verdict_id=verdict_id,
        helpful=helpful,
        user_id=user_id,
        ip_address=ip_address,
    )
    session.add(rating)
    await session.flush()
    return rating


async def get_rating_stats(
    session: AsyncSession,
    verdict_id: UUID,
) -> dict:
    """Get rating statistics for a verdict."""
    stmt = select(VerdictRatingModel).where(VerdictRatingModel.verdict_id == verdict_id)
    result = await session.execute(stmt)
    ratings = result.scalars().all()

    helpful = sum(1 for r in ratings if r.helpful)
    unhelpful = sum(1 for r in ratings if not r.helpful)
    total = len(ratings)

    return {
        "verdict_id": str(verdict_id),
        "helpful": helpful,
        "unhelpful": unhelpful,
        "total": total,
        "helpful_percentage": (helpful / total * 100) if total > 0 else 0,
    }
