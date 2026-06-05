from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.connection import get_db_session
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
    """Submit product for analysis + email capture."""
    logger.info(f"Submit request: {request.product_name} from {request.email}")

    # TODO: Week 2 - implement email capture and search miss logging
    return SubmitResponse(
        status="ok",
        message=f"Product '{request.product_name}' submitted. You'll receive an email at {request.email} when analysis is ready.",
    )
