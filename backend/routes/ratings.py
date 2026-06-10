"""Routes for verdict ratings."""
from fastapi import APIRouter, HTTPException, Request, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db import repositories as repos
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/verdicts", tags=["ratings"])


@router.post("/{verdict_id}/rate")
async def rate_verdict(
    verdict_id: UUID,
    helpful: bool,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    """Rate a verdict as helpful or not helpful."""
    client_ip = request.client.host if request.client else None

    try:
        # Check verdict exists
        verdict = await repos.verdicts.get_by_id(session, verdict_id)
        if not verdict:
            raise HTTPException(status_code=404, detail="Verdict not found")

        # Create rating
        await repos.emails.create_rating(
            session=session,
            verdict_id=verdict_id,
            helpful=helpful,
            ip_address=client_ip,
        )
        await session.commit()

        return {
            "status": "ok",
            "verdict_id": str(verdict_id),
            "helpful": helpful,
            "message": "Thank you for your feedback!",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rating verdict: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error saving rating")


@router.get("/{verdict_id}/rating-stats")
async def get_verdict_rating_stats(
    verdict_id: UUID,
    session: AsyncSession = Depends(get_db_session),
):
    """Get rating statistics for a verdict."""
    try:
        # Check verdict exists
        verdict = await repos.verdicts.get_by_id(session, verdict_id)
        if not verdict:
            raise HTTPException(status_code=404, detail="Verdict not found")

        # Get stats
        stats = await repos.emails.get_rating_stats(session, verdict_id)

        return {
            "status": "ok",
            "verdict_id": str(verdict_id),
            "stats": stats,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting rating stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching stats")
