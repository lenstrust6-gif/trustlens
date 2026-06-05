from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SubmitRequest(BaseModel):
    product_name: str
    email: str
    locale: str = "in"


class SubmitResponse(BaseModel):
    status: str
    message: str


@router.post("/api/v1/submit")
async def submit_product(request: SubmitRequest, session: AsyncSession = Depends(get_db_session)):
    """Submit product for analysis + capture email for notify-me."""
    logger.info(f"Submit request: {request.product_name} from {request.email}")

    try:
        # Capture email for notify-me
        await repos.emails.create(
            session,
            email=request.email,
            product_name=request.product_name,
            locale=request.locale,
        )

        # Log search miss (increment count if exists)
        await repos.misses.upsert(session, request.product_name, request.locale)

        await session.commit()
        logger.info(f"Email captured + search miss logged: {request.product_name}")

        return SubmitResponse(
            status="ok",
            message=f"Product '{request.product_name}' submitted. We'll analyze it and email {request.email} when ready!",
        )
    except Exception as e:
        logger.error(f"Submit failed: {e}")
        await session.rollback()
        return SubmitResponse(
            status="error",
            message="Failed to submit product. Please try again.",
        )
