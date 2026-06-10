"""Routes for user management and preferences."""
from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import repositories as repos
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_current_user_id(authorization: str = None) -> str | None:
    """Extract user ID from JWT token (placeholder)."""
    # TODO: Replace with actual JWT validation
    return None


class PreferencesUpdate(BaseModel):
    email_notifications: bool | None = None
    default_locale: str | None = None
    default_sort: str | None = None


class SavedSearchCreate(BaseModel):
    query: str
    category: str | None = None
    filters: dict | None = None


@router.get("/me")
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db_session),
):
    """Get current user profile."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = await repos.users.get_user_by_id(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "status": "ok",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatarUrl": user.avatar_url,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching user")


@router.put("/{user_id}/preferences")
async def update_preferences(
    user_id: str,
    preferences: PreferencesUpdate,
    session: AsyncSession = Depends(get_db_session),
):
    """Update user preferences."""
    try:
        user = await repos.users.get_user_by_id(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        prefs = await repos.users.update_preferences(
            session=session,
            user_id=user_id,
            email_notifications=preferences.email_notifications,
            default_locale=preferences.default_locale,
            default_sort=preferences.default_sort,
        )
        await session.commit()

        return {
            "status": "ok",
            "preferences": {
                "userId": user_id,
                "emailNotifications": prefs.email_notifications,
                "defaultLocale": prefs.default_locale,
                "defaultSort": prefs.default_sort,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error updating preferences")


@router.get("/{user_id}/preferences")
async def get_preferences(
    user_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Get user preferences."""
    try:
        prefs = await repos.users.get_or_create_preferences(session, user_id)

        return {
            "status": "ok",
            "preferences": {
                "userId": user_id,
                "emailNotifications": prefs.email_notifications,
                "defaultLocale": prefs.default_locale,
                "defaultSort": prefs.default_sort,
            },
        }

    except Exception as e:
        logger.error(f"Error fetching preferences: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching preferences")


@router.post("/{user_id}/saved-searches")
async def create_saved_search(
    user_id: str,
    search: SavedSearchCreate,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a saved search."""
    try:
        user = await repos.users.get_user_by_id(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        saved = await repos.users.create_saved_search(
            session=session,
            user_id=user_id,
            query=search.query,
            category=search.category,
            filters=search.filters,
        )
        await session.commit()

        return {
            "status": "ok",
            "savedSearch": {
                "id": str(saved.id),
                "query": saved.query,
                "category": saved.category,
                "filters": saved.filters,
                "createdAt": saved.created_at.isoformat() if saved.created_at else None,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating saved search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error creating saved search")


@router.get("/{user_id}/saved-searches")
async def get_saved_searches(
    user_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Get all saved searches for a user."""
    try:
        user = await repos.users.get_user_by_id(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        searches = await repos.users.get_saved_searches(session, user_id)

        return {
            "status": "ok",
            "userId": user_id,
            "savedSearches": [
                {
                    "id": str(s.id),
                    "query": s.query,
                    "category": s.category,
                    "filters": s.filters,
                    "createdAt": s.created_at.isoformat() if s.created_at else None,
                    "lastSearched": s.last_searched.isoformat() if s.last_searched else None,
                }
                for s in searches
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching saved searches: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching saved searches")


@router.delete("/{user_id}/saved-searches/{search_id}")
async def delete_saved_search(
    user_id: str,
    search_id: UUID,
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a saved search."""
    try:
        deleted = await repos.users.delete_saved_search(session, search_id, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Saved search not found")

        await session.commit()

        return {
            "status": "ok",
            "message": "Saved search deleted",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error deleting saved search")
