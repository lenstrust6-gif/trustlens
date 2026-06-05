from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    product_name: str
    locale: str = "in"


class SearchResponse(BaseModel):
    status: str
    message: str


@router.post("/api/v1/search")
async def search(request: SearchRequest, session: AsyncSession = Depends(get_db_session)):
    """Search for product and trigger pipeline."""
    logger.info(f"Search request: {request.product_name} ({request.locale})")

    # TODO: Week 2 - implement full pipeline
    return SearchResponse(
        status="ok",
        message=f"Search stub for '{request.product_name}' in locale '{request.locale}'",
    )
