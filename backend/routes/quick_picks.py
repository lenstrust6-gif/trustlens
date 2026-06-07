"""Routes for category quick picks."""
from fastapi import APIRouter, HTTPException
from backend.services.quick_picks_service import QuickPicksService
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["quick-picks"])


@router.get("/categories/{locale}/{category}/quick-picks")
async def get_category_quick_picks(
    locale: str,
    category: str,
    db=None,
):
    """Get quick picks for a specific category (Best Overall, Budget, Premium)."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            quick_picks = await QuickPicksService.get_category_quick_picks(
                session=session,
                locale=locale,
                category=category,
            )

            return {
                "status": "ok",
                "locale": locale,
                "category": category,
                "quickPicks": quick_picks,
            }

    except Exception as e:
        logger.error(f"Error fetching quick picks: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching quick picks")


@router.get("/quick-picks/{locale}")
async def get_all_categories_quick_picks(
    locale: str,
    db=None,
):
    """Get quick picks for all categories in a locale."""
    if db is None:
        db = get_db_session()

    try:
        async with db.session() as session:
            quick_picks = await QuickPicksService.get_all_categories_quick_picks(
                session=session,
                locale=locale,
            )

            return {
                "status": "ok",
                "locale": locale,
                "quickPicksByCategory": quick_picks,
            }

    except Exception as e:
        logger.error(f"Error fetching all quick picks: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching quick picks")
