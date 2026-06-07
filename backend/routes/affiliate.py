"""Routes for affiliate link management."""
from fastapi import APIRouter, HTTPException
from uuid import UUID
from backend.db import repositories as repos
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/products", tags=["affiliate"])


@router.get("/{product_id}/affiliate-link")
async def get_affiliate_link(
    product_id: UUID,
    db=None,
):
    """Get affiliate link for a product."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            link = await repos.affiliate.get_by_product_id(session, product_id)

            if not link:
                raise HTTPException(status_code=404, detail="Affiliate link not found")

            return {
                "status": "ok",
                "productId": str(product_id),
                "affiliateLink": {
                    "id": str(link.id),
                    "amazonUrl": link.amazon_url,
                    "trackingCode": link.tracking_code,
                    "clickCount": link.click_count,
                },
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching affiliate link: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching affiliate link")


@router.post("/{product_id}/affiliate-link/click")
async def record_affiliate_click(
    product_id: UUID,
    db=None,
):
    """Record a click on an affiliate link (for tracking)."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            link = await repos.affiliate.record_click(session, product_id)

            if not link:
                raise HTTPException(status_code=404, detail="Affiliate link not found")

            await session.commit()

            return {
                "status": "ok",
                "productId": str(product_id),
                "clickCount": link.click_count,
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording click: {str(e)}")
        raise HTTPException(status_code=500, detail="Error recording click")
