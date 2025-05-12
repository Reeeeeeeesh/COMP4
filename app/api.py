"""API router for compensation calculations."""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas import CompRequest, CompResult
from app.services.comp_engine import calculate_compensation

router = APIRouter(prefix="/calc", tags=["compensation"])


@router.post("/", response_model=CompResult)
async def calculate(
    req: CompRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CompResult:
    """Calculate compensation for an employee.

    Args:
        req: Compensation calculation request
        session: SQLAlchemy async session

    Returns:
        CompResult containing compensation breakdown
    """
    return await calculate_compensation(**req.dict(), session=session)
