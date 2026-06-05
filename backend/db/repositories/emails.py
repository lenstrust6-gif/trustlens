from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import EmailCaptureModel
import uuid
from datetime import datetime


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
