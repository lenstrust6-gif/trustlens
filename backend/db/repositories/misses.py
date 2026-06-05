from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import SearchMissModel
from datetime import datetime
import uuid


async def upsert(session: AsyncSession, query: str, locale: str) -> None:
    """
    Increment count for a search miss (query not found).
    If exists, increment count. If not, create new with count=1.
    """
    # Check if already exists
    stmt = select(SearchMissModel).where(
        SearchMissModel.query == query, SearchMissModel.locale == locale
    )
    result = await session.execute(stmt)
    existing = result.scalars().first()

    if existing:
        # Increment count
        stmt = (
            update(SearchMissModel)
            .where(SearchMissModel.id == existing.id)
            .values(count=SearchMissModel.count + 1, last_searched=datetime.utcnow())
        )
        await session.execute(stmt)
    else:
        # Create new
        miss = SearchMissModel(
            id=uuid.uuid4(),
            query=query,
            locale=locale,
            count=1,
            last_searched=datetime.utcnow(),
        )
        session.add(miss)

    await session.flush()
