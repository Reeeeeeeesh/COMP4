"""Bonus calculation engine service.

This module contains the main bonus calculation logic that integrates
investment performance, qualitative scores, and revenue adjustment factors.
"""

import logging
from typing import Dict, Optional

from services.performance import calc_investment_score
from services.qualitative import calc_qualitative_score
from services.raf import calc_raf

# Setup logging
logger = logging.getLogger(__name__)


def calculate_bonus(
    emp_id: str,
    period: str,
    base_salary: Optional[float] = None,
    target_bonus_pct: Optional[float] = None,
) -> Dict[str, float]:
    """Calculate final bonus for an employee.

    This function:
    1. Calculates target bonus based on base salary and target bonus percentage
    2. Calculates performance multiplier from investment and qualitative scores
    3. Calculates initial bonus as target × performance multiplier
    4. Applies Revenue Adjustment Factor (RAF)
    5. Returns final bonus and all intermediate values

    Args:
        emp_id: Employee ID
        period: Review period (e.g., '2025')
        base_salary: Optional base salary override
        target_bonus_pct: Optional target bonus percentage override

    Returns:
        Dict[str, float]: Dictionary with all bonus calculation components
    """
    # Get employee data if not provided
    employee_data = _get_employee_data(emp_id, period)

    # Use provided values or fall back to employee data
    base_salary = (
        base_salary
        if base_salary is not None
        else employee_data.get("base_salary", 0.0)
    )
    target_bonus_pct = (
        target_bonus_pct
        if target_bonus_pct is not None
        else employee_data.get("target_bonus_pct", 0.0)
    )

    # Calculate target bonus
    target_bonus = base_salary * target_bonus_pct

    # Calculate performance components
    investment_score = calc_investment_score(emp_id, period)
    qualitative_score = calc_qualitative_score(emp_id, period)

    # Calculate overall performance multiplier
    # Note: The weights are already applied in the component functions
    # Investment (60%) + Qualitative (40%)
    perf_multiplier = investment_score + qualitative_score

    # Calculate initial bonus
    initial_bonus = target_bonus * perf_multiplier

    # Calculate Revenue Adjustment Factor (RAF)
    raf = calc_raf(emp_id, period)

    # Calculate final bonus
    final_bonus = initial_bonus * raf

    # Log if final bonus exceeds 3× base salary
    if final_bonus > (3 * base_salary):
        logger.warning(
            f"ALERT: Final bonus for employee {emp_id} in period {period} "
            f"exceeds 3× base salary. Final bonus: {final_bonus}, Base salary: {base_salary}"
        )

    # Create result dictionary with all components
    result = {
        "emp_id": emp_id,
        "period": period,
        "base_salary": base_salary,
        "target_bonus_pct": target_bonus_pct,
        "target_bonus": target_bonus,
        "investment_score": investment_score,
        "qualitative_score": qualitative_score,
        "perf_multiplier": perf_multiplier,
        "initial_bonus": initial_bonus,
        "raf": raf,
        "final_bonus": final_bonus,
    }

    # Log the calculation path for debugging
    logger.info(
        f"Bonus calculation for employee {emp_id}, period {period}: "
        f"Base: {base_salary}, Target %: {target_bonus_pct}, "
        f"Investment: {investment_score:.4f}, Qualitative: {qualitative_score:.4f}, "
        f"RAF: {raf:.4f}, Final: {final_bonus:.2f}"
    )

    return result


def _get_employee_data(emp_id: str, period: str) -> Dict:
    """Get employee data for bonus calculation.

    This is a placeholder function that would normally fetch data from a database.
    In a real implementation, this would query the Employee table.

    Args:
        emp_id: Employee ID
        period: Review period

    Returns:
        Dict: Employee data dictionary
    """
    # This is placeholder data - in production this would come from a database
    # Example placeholder data
    return {
        "emp_id": emp_id,
        "first_name": "John",
        "last_name": "Doe",
        "base_salary": 100000.0,
        "target_bonus_pct": 0.30,
        "perf_rating": 4,
    }
