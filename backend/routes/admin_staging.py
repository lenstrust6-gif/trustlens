"""Admin routes for staging queue management."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from backend.db.connection import get_db_session
from backend.db import repositories as repos
from backend.db.models import StagingQueueModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/admin", tags=["admin-staging"])


@router.get("/staging-queue")
async def get_staging_queue(
    status: str = Query(None, description="Filter by status"),
    priority: str = Query(None, description="Filter by priority"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db_session),
):
    """Get all staging queue items with optional filters."""
    try:
        if status:
            items = await repos.staging_queue.get_by_status(session, status)
        elif priority:
            items = await repos.staging_queue.get_all(session, priority=priority, limit=limit)
        else:
            items = await repos.staging_queue.get_all(session, limit=limit)

        # Paginate
        total = len(items)
        paginated = items[offset : offset + limit]

        return {
            "status": "ok",
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": str(item.id),
                    "name": item.name,
                    "asin": item.asin,
                    "category": item.category,
                    "brand": item.brand,
                    "source": item.source,
                    "review_count_amazon": item.review_count_amazon,
                    "review_count_youtube": item.review_count_youtube,
                    "status": item.status,
                    "priority": item.priority,
                    "demand_count": item.demand_count,
                    "approved_by": item.approved_by,
                    "approved_at": item.approved_at.isoformat() if item.approved_at else None,
                    "detected_at": item.detected_at.isoformat() if item.detected_at else None,
                }
                for item in paginated
            ],
        }
    except Exception as e:
        logger.error(f"Error fetching staging queue: {e}")
        raise HTTPException(status_code=500, detail="Error fetching staging queue")


@router.get("/staging-queue/pending")
async def get_pending_staging(
    session: AsyncSession = Depends(get_db_session),
):
    """Get count of items pending editorial review."""
    try:
        pending = await repos.staging_queue.get_pending_editorial(session)
        return {
            "status": "ok",
            "pending_count": len(pending),
        }
    except Exception as e:
        logger.error(f"Error fetching pending count: {e}")
        raise HTTPException(status_code=500, detail="Error fetching pending count")


@router.post("/staging-queue/{queue_id}/approve")
async def approve_staging_item(
    queue_id: str,
    approved_by: str = Query("admin"),
    session: AsyncSession = Depends(get_db_session),
):
    """Approve a staging queue item for verdict generation."""
    try:
        item = await repos.staging_queue.get_by_id(session, queue_id)
        if not item:
            raise HTTPException(status_code=404, detail="Staging item not found")

        updated = await repos.staging_queue.update_status(
            session,
            queue_id,
            "approved",
            approved_by=approved_by,
        )
        await session.commit()

        return {
            "status": "ok",
            "message": f"Approved: {item.name}",
            "item": {
                "id": str(updated.id),
                "name": updated.name,
                "status": updated.status,
                "approved_by": updated.approved_by,
                "approved_at": updated.approved_at.isoformat(),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error approving staging item: {e}")
        raise HTTPException(status_code=500, detail="Error approving item")


@router.post("/staging-queue/{queue_id}/reject")
async def reject_staging_item(
    queue_id: str,
    reason: str = Query(""),
    session: AsyncSession = Depends(get_db_session),
):
    """Reject a staging queue item."""
    try:
        item = await repos.staging_queue.get_by_id(session, queue_id)
        if not item:
            raise HTTPException(status_code=404, detail="Staging item not found")

        await repos.staging_queue.update_status(
            session,
            queue_id,
            "insufficient_data",
        )
        await session.commit()

        return {
            "status": "ok",
            "message": f"Rejected: {item.name}",
            "reason": reason,
        }
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error rejecting staging item: {e}")
        raise HTTPException(status_code=500, detail="Error rejecting item")


@router.post("/staging-queue/{queue_id}/priority")
async def set_priority(
    queue_id: str,
    priority: str = Query("normal"),
    session: AsyncSession = Depends(get_db_session),
):
    """Update priority of a staging queue item."""
    if priority not in ["low", "normal", "high"]:
        raise HTTPException(status_code=400, detail="Invalid priority")

    try:
        item = await repos.staging_queue.get_by_id(session, queue_id)
        if not item:
            raise HTTPException(status_code=404, detail="Staging item not found")

        stmt = update(StagingQueueModel).where(
            StagingQueueModel.id == queue_id
        ).values(priority=priority)
        await session.execute(stmt)
        await session.commit()

        return {
            "status": "ok",
            "message": f"Priority updated to {priority}",
            "queue_id": queue_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error updating priority: {e}")
        raise HTTPException(status_code=500, detail="Error updating priority")


@router.delete("/staging-queue/{queue_id}")
async def delete_staging_item(
    queue_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a staging queue item."""
    try:
        deleted = await repos.staging_queue.delete(session, queue_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Staging item not found")

        await session.commit()
        return {
            "status": "ok",
            "message": "Staging item deleted",
        }
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error deleting staging item: {e}")
        raise HTTPException(status_code=500, detail="Error deleting item")
