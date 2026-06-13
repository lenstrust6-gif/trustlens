"""Repository for staging_queue table operations."""
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import StagingQueueModel
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


async def create(
    session: AsyncSession,
    name: str,
    source: str,
    asin: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    locale: str = "in",
    priority: str = "normal",
    demand_count: int = 0,
    notes: str | None = None,
) -> StagingQueueModel:
    """Create a new staging queue entry."""
    queue_item = StagingQueueModel(
        id=uuid.uuid4(),
        name=name,
        asin=asin,
        category=category,
        brand=brand,
        locale=locale,
        source=source,
        priority=priority,
        demand_count=demand_count,
        notes=notes,
        status="pending_editorial",
        detected_at=datetime.utcnow(),
    )
    session.add(queue_item)
    await session.flush()
    return queue_item


async def get_by_id(session: AsyncSession, queue_id: str) -> StagingQueueModel | None:
    """Get a staging queue item by ID."""
    result = await session.execute(
        select(StagingQueueModel).where(StagingQueueModel.id == queue_id)
    )
    return result.scalars().first()


async def get_by_asin(session: AsyncSession, asin: str, locale: str = "in") -> StagingQueueModel | None:
    """Check if product already in staging queue."""
    result = await session.execute(
        select(StagingQueueModel).where(
            (StagingQueueModel.asin == asin) & (StagingQueueModel.locale == locale)
        )
    )
    return result.scalars().first()


async def get_by_name(session: AsyncSession, name: str, locale: str = "in") -> StagingQueueModel | None:
    """Find staging queue item by product name."""
    result = await session.execute(
        select(StagingQueueModel).where(
            (StagingQueueModel.name.ilike(f"%{name}%")) & (StagingQueueModel.locale == locale)
        )
    )
    return result.scalars().first()


async def get_all(session: AsyncSession, status: str | None = None, priority: str | None = None, limit: int = 100) -> list[StagingQueueModel]:
    """Get all staging queue items with optional filters."""
    stmt = select(StagingQueueModel).order_by(StagingQueueModel.detected_at.desc()).limit(limit)

    if status:
        stmt = stmt.where(StagingQueueModel.status == status)
    if priority:
        stmt = stmt.where(StagingQueueModel.priority == priority)

    result = await session.execute(stmt)
    return result.scalars().all()


async def get_pending_editorial(session: AsyncSession) -> list[StagingQueueModel]:
    """Get all items awaiting editorial review."""
    return await get_all(session, status="pending_editorial")


async def get_by_status(session: AsyncSession, status: str) -> list[StagingQueueModel]:
    """Get all items with a specific status."""
    return await get_all(session, status=status)


async def update_status(
    session: AsyncSession,
    queue_id: str,
    new_status: str,
    approved_by: str | None = None,
) -> StagingQueueModel | None:
    """Update status of a staging queue item."""
    stmt = update(StagingQueueModel).where(StagingQueueModel.id == queue_id).values(
        status=new_status,
        approved_by=approved_by,
        approved_at=datetime.utcnow() if new_status == "approved" else None,
        updated_at=datetime.utcnow(),
    )
    await session.execute(stmt)
    await session.flush()
    return await get_by_id(session, queue_id)


async def update_review_counts(
    session: AsyncSession,
    queue_id: str,
    amazon_count: int | None = None,
    youtube_count: int | None = None,
) -> StagingQueueModel | None:
    """Update review counts for a staging item."""
    values = {"updated_at": datetime.utcnow()}
    if amazon_count is not None:
        values["review_count_amazon"] = amazon_count
    if youtube_count is not None:
        values["review_count_youtube"] = youtube_count

    stmt = update(StagingQueueModel).where(StagingQueueModel.id == queue_id).values(**values)
    await session.execute(stmt)
    await session.flush()
    return await get_by_id(session, queue_id)


async def increment_demand_count(session: AsyncSession, queue_id: str) -> StagingQueueModel | None:
    """Increment demand_count (for user searches)."""
    queue_item = await get_by_id(session, queue_id)
    if not queue_item:
        return None

    stmt = update(StagingQueueModel).where(StagingQueueModel.id == queue_id).values(
        demand_count=StagingQueueModel.demand_count + 1,
        updated_at=datetime.utcnow(),
    )
    await session.execute(stmt)
    await session.flush()
    return await get_by_id(session, queue_id)


async def set_go_live_date(session: AsyncSession, queue_id: str, go_live_at: datetime) -> StagingQueueModel | None:
    """Schedule when a product should go live."""
    stmt = update(StagingQueueModel).where(StagingQueueModel.id == queue_id).values(
        go_live_at=go_live_at,
        updated_at=datetime.utcnow(),
    )
    await session.execute(stmt)
    await session.flush()
    return await get_by_id(session, queue_id)


async def delete(session: AsyncSession, queue_id: str) -> bool:
    """Delete a staging queue item."""
    queue_item = await get_by_id(session, queue_id)
    if not queue_item:
        return False

    await session.delete(queue_item)
    await session.flush()
    return True
