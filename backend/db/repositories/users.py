"""Repository for user management and preferences."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import UserModel, UserPreferencesModel, SavedSearchModel
from uuid import UUID
import uuid


# USER FUNCTIONS

async def create_user(
    session: AsyncSession,
    email: str,
    name: str | None = None,
    google_id: str | None = None,
    avatar_url: str | None = None,
) -> UserModel:
    """Create a new user."""
    user = UserModel(
        id=google_id or str(uuid.uuid4()),
        email=email,
        name=name,
        google_id=google_id,
        avatar_url=avatar_url,
    )
    session.add(user)
    await session.flush()
    return user


async def get_user_by_id(
    session: AsyncSession,
    user_id: str,
) -> UserModel | None:
    """Get user by ID."""
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_user_by_email(
    session: AsyncSession,
    email: str,
) -> UserModel | None:
    """Get user by email."""
    stmt = select(UserModel).where(UserModel.email == email)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_user_by_google_id(
    session: AsyncSession,
    google_id: str,
) -> UserModel | None:
    """Get user by Google ID."""
    stmt = select(UserModel).where(UserModel.google_id == google_id)
    result = await session.execute(stmt)
    return result.scalars().first()


# PREFERENCES FUNCTIONS

async def get_or_create_preferences(
    session: AsyncSession,
    user_id: str,
) -> UserPreferencesModel:
    """Get or create user preferences."""
    stmt = select(UserPreferencesModel).where(UserPreferencesModel.user_id == user_id)
    result = await session.execute(stmt)
    prefs = result.scalars().first()

    if not prefs:
        prefs = UserPreferencesModel(user_id=user_id)
        session.add(prefs)
        await session.flush()

    return prefs


async def update_preferences(
    session: AsyncSession,
    user_id: str,
    email_notifications: bool | None = None,
    default_locale: str | None = None,
    default_sort: str | None = None,
) -> UserPreferencesModel:
    """Update user preferences."""
    prefs = await get_or_create_preferences(session, user_id)

    if email_notifications is not None:
        prefs.email_notifications = email_notifications
    if default_locale is not None:
        prefs.default_locale = default_locale
    if default_sort is not None:
        prefs.default_sort = default_sort

    await session.flush()
    return prefs


# SAVED SEARCHES FUNCTIONS

async def create_saved_search(
    session: AsyncSession,
    user_id: str,
    query: str,
    category: str | None = None,
    filters: dict | None = None,
) -> SavedSearchModel:
    """Save a search for a user."""
    search = SavedSearchModel(
        user_id=user_id,
        query=query,
        category=category,
        filters=filters,
    )
    session.add(search)
    await session.flush()
    return search


async def get_saved_searches(
    session: AsyncSession,
    user_id: str,
) -> list[SavedSearchModel]:
    """Get all saved searches for a user."""
    stmt = (
        select(SavedSearchModel)
        .where(SavedSearchModel.user_id == user_id)
        .order_by(SavedSearchModel.last_searched.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().all()


async def delete_saved_search(
    session: AsyncSession,
    search_id: UUID,
    user_id: str,
) -> bool:
    """Delete a saved search (verify ownership)."""
    stmt = select(SavedSearchModel).where(
        (SavedSearchModel.id == search_id) & (SavedSearchModel.user_id == user_id)
    )
    result = await session.execute(stmt)
    search = result.scalars().first()

    if search:
        await session.delete(search)
        await session.flush()
        return True
    return False


async def update_search_timestamp(
    session: AsyncSession,
    search_id: UUID,
) -> SavedSearchModel | None:
    """Update last_searched timestamp for a saved search."""
    stmt = select(SavedSearchModel).where(SavedSearchModel.id == search_id)
    result = await session.execute(stmt)
    search = result.scalars().first()

    if search:
        from datetime import datetime, timezone
        search.last_searched = datetime.now(timezone.utc)
        await session.flush()

    return search
