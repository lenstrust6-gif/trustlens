from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Literal
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
from backend.db import repositories as repos
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SubmitRequest(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    locale: Literal["in", "us", "uk"] = "in"


class SubmitResponse(BaseModel):
    status: str
    message: str


@router.post("/api/v1/submit")
async def submit_product(request: SubmitRequest, session: AsyncSession = Depends(get_db_session)):
    """Submit product for analysis + capture email for notify-me."""
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
    except ValueError as e:
        logger.error(f"Validation error in submit: {e}")
        await session.rollback()
        return SubmitResponse(
            status="error",
            message=f"Invalid input: {str(e)}",
        )
    except Exception as e:
        logger.error(f"Submit failed: {e}", exc_info=True)
        await session.rollback()
        return SubmitResponse(
            status="error",
            message="Failed to submit product. Please try again.",
        )
