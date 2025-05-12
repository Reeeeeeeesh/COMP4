"""Employee routes for compensation API."""

from typing import Dict

from fastapi import APIRouter, HTTPException, Query

from services.bonus_engine import calculate_bonus

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/{emp_id}/compensation")
async def get_employee_compensation(
    emp_id: str, period: str = Query(..., description="Review period in format YYYY")
) -> Dict:
    """Get compensation breakdown for an employee.

    This endpoint calls calculate_bonus if a record doesn't exist for the given
    employee and period, otherwise returns the existing record.

    Args:
        emp_id: Employee ID
        period: Review period (e.g., '2025')

    Returns:
        Dict: Compensation breakdown with all components

    Raises:
        HTTPException: If employee not found or other error occurs
    """
    try:
        # In a real implementation, we would check if a BonusPayout record exists
        # and return that if it does, otherwise calculate a new one

        # For now, we'll just calculate a new one each time
        result = calculate_bonus(emp_id, period)

        return result
    except Exception as e:
        # Log the error
        raise HTTPException(
            status_code=500, detail=f"Error calculating compensation: {str(e)}"
        )
