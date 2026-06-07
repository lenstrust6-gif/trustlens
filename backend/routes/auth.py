"""Authentication routes for user management."""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.connection import get_db_session
from backend.db.models import Base

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class UserSyncRequest(BaseModel):
    """Request body for syncing user from NextAuth."""
    email: str
    name: str | None = None
    image: str | None = None
    provider: str = "google"
    provider_account_id: str


class UserProfileResponse(BaseModel):
    """User profile response."""
    id: str
    email: str
    name: str | None
    image: str | None


# In-memory fallback for when DB is unavailable
_users_store: dict[str, dict] = {}


@router.post("/sync")
async def sync_user(request: UserSyncRequest, session: AsyncSession = Depends(get_db_session)):
    """Sync user from NextAuth OAuth callback."""
    try:
        # For now, use in-memory store as fallback
        # TODO: Replace with real database User model when schema is finalized
        user_id = str(uuid.uuid4())
        
        # Check if user exists by email
        existing_user = next((u for u in _users_store.values() if u["email"] == request.email), None)
        if existing_user:
            user_id = existing_user["id"]
            logger.info(f"Synced existing user: {request.email}")
        else:
            # Store user in memory
            _users_store[user_id] = {
                "id": user_id,
                "email": request.email,
                "name": request.name,
                "image": request.image,
                "provider": request.provider,
                "provider_account_id": request.provider_account_id,
            }
            logger.info(f"Created new user: {request.email}")

        return {
            "id": user_id,
            "email": request.email,
            "name": request.name,
            "image": request.image,
        }

    except Exception as e:
        logger.error(f"Error syncing user: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error syncing user: {str(e)}",
        )


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_profile(user_id: str, session: AsyncSession = Depends(get_db_session)):
    """Get user profile by ID."""
    user = _users_store.get(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserProfileResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        image=user["image"],
    )


@router.post("/logout")
async def logout(user_id: str, session: AsyncSession = Depends(get_db_session)):
    """Logout user (clear NextAuth session on frontend)."""
    logger.info(f"User {user_id} logged out")
    return {"success": True, "message": "Logged out successfully"}
