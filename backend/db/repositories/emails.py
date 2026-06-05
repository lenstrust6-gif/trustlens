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
