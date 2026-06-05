"""Routes for user management and preferences."""
from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from pydantic import BaseModel
from backend.db import repositories as repos
from backend.config import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["users"])


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
    db=None,
):
    """Get current user profile."""
    if db is None:
        db = get_db()

    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        async with db.session() as session:
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
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching user")


@router.put("/{user_id}/preferences")
async def update_preferences(
    user_id: str,
    preferences: PreferencesUpdate,
    db=None,
):
    """Update user preferences."""
    if db is None:
        db = get_db()

    try:
        async with db.session() as session:
            # Verify user exists
            user = await repos.users.get_user_by_id(session, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Update preferences
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
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating preferences")


@router.get("/{user_id}/preferences")
async def get_preferences(
    user_id: str,
    db=None,
):
    """Get user preferences."""
    if db is None:
        db = get_db()

    try:
        async with db.session() as session:
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
        logger.error(f"Error fetching preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching preferences")


@router.post("/{user_id}/saved-searches")
async def create_saved_search(
    user_id: str,
    search: SavedSearchCreate,
    db=None,
):
    """Create a saved search."""
    if db is None:
        db = get_db()

    try:
        async with db.session() as session:
            # Verify user exists
            user = await repos.users.get_user_by_id(session, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Create saved search
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
        logger.error(f"Error creating saved search: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating saved search")


@router.get("/{user_id}/saved-searches")
async def get_saved_searches(
    user_id: str,
    db=None,
):
    """Get all saved searches for a user."""
    if db is None:
        db = get_db()

    try:
        async with db.session() as session:
            # Verify user exists
            user = await repos.users.get_user_by_id(session, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get saved searches
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
        logger.error(f"Error fetching saved searches: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching saved searches")


@router.delete("/{user_id}/saved-searches/{search_id}")
async def delete_saved_search(
    user_id: str,
    search_id: UUID,
    db=None,
):
    """Delete a saved search."""
    if db is None:
        db = get_db()

    try:
        async with db.session() as session:
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
        logger.error(f"Error deleting saved search: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting saved search")


def get_current_user_id(authorization: str = None) -> str | None:
    """Extract user ID from JWT token (placeholder)."""
    # This would be replaced with actual JWT validation
    return None
