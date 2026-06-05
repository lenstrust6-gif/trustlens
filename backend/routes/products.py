from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/v1/verdict/{locale}/{slug}")
async def get_verdict(locale: str, slug: str, session: AsyncSession = Depends(get_db_session)):
    """Get full verdict card for a product."""
    logger.info(f"Verdict request: {locale}/{slug}")

    # TODO: Week 2 - fetch verdict from cache/DB
    raise HTTPException(status_code=404, detail="Verdict not found")
