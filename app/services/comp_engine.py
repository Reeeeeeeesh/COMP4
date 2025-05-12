"""Compensation calculation engine."""
from datetime import datetime
from decimal import Decimal
from typing import Dict, List

from sqlalchemy import select
from sqlalchemy.engine import Result
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CompensationRule, Employee, SalaryBand
from app.schemas import CompResult


async def get_employee(session: AsyncSession, employee_id: int) -> Employee:
    """Get employee by ID.

    Args:
        session: SQLAlchemy session
        employee_id: Employee ID

    Returns:
        Employee instance

    Raises:
        ValueError: If employee not found
    """
    query = select(Employee).where(Employee.id == employee_id)
    result: Result[tuple[Employee]] = await session.execute(query)
    employee = result.scalar_one_or_none()
    if not employee:
        raise ValueError(f"Employee {employee_id} not found")
    return employee


async def get_salary_band(session: AsyncSession, role: str) -> SalaryBand:
    """Get salary band for role.

    Args:
        session: SQLAlchemy session
        role: Employee role

    Returns:
        SalaryBand instance

    Raises:
        ValueError: If no band found for role
    """
    query = select(SalaryBand).where(SalaryBand.role == role)
    result: Result[tuple[SalaryBand]] = await session.execute(query)
    band = result.scalar_one_or_none()
    if not band:
        raise ValueError(f"No salary band found for role {role}")
    return band


async def get_compensation_rule(session: AsyncSession, year: int) -> CompensationRule:
    """Get compensation rule for the given year or latest if not found.

    Args:
        session: SQLAlchemy session
        year: Target year

    Returns:
        CompensationRule for the year or latest

    Raises:
        ValueError: If no rules found
    """
    # Try current year first
    query = (
        select(CompensationRule)
        .where(CompensationRule.year == year)
        .order_by(CompensationRule.year.desc())
    )
    result: Result[tuple[CompensationRule]] = await session.execute(query)
    rule = result.scalar_one_or_none()

    # Try latest if no current year rule
    if not rule:
        query = select(CompensationRule).order_by(CompensationRule.year.desc())
        result = await session.execute(query)
        rule = result.scalar_one_or_none()

    if not rule:
        raise ValueError("No compensation rules found")

    return rule


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max values.

    Args:
        value: The value to clamp
        min_val: The minimum allowed value
        max_val: The maximum allowed value

    Returns:
        The clamped value
    """
    return max(min_val, min(value, max_val))


async def calculate_compensation(
    employee_id: int,
    revenue_actual: float,
    qualitative_scores: Dict[str, float],
    session: AsyncSession,
) -> CompResult:
    """Calculate total compensation for an employee.

    Args:
        employee_id: ID of the employee
        revenue_actual: Current-year revenue for the employee's desk
        qualitative_scores: Dict mapping metric names to scores (0.0-1.0)
        session: Async SQLAlchemy session

    Returns:
        CompResult containing total compensation and its components

    Raises:
        ValueError: If employee not found or invalid scores
    """
    # Fetch employee and validate
    employee = await get_employee(session, employee_id)

    # Get salary band for role
    band = await get_salary_band(session, employee.role)

    # Get latest compensation rule
    current_year = datetime.now().year
    # Get compensation rule
    rule = await get_compensation_rule(session, current_year)

    # Calculate revenue factor

    revenue_delta = revenue_actual / rule.rev_adjust_ref
    revenue_factor = clamp(revenue_delta, rule.rev_adjust_low, rule.rev_adjust_high)

    # Calculate qualitative factor (simple average)
    if not qualitative_scores:
        raise ValueError("No qualitative scores provided")
    qual_weighted = sum(qualitative_scores.values()) / len(qualitative_scores)

    # Calculate bonus

    target_bonus = employee.base_salary * Decimal(str(rule.target_bonus_percent))
    bonus_raw = (
        target_bonus * Decimal(str(revenue_factor)) * Decimal(str(qual_weighted))
    )

    # Calculate MRT cap
    mrt_cap = employee.base_salary * Decimal(str(rule.mrt_cap_percent))

    # Check for breaches
    breaches: List[str] = []
    if employee.base_salary < band.min_salary or employee.base_salary > band.max_salary:
        breaches.append("salary_band")

    # For MRT cap, compare raw bonus to cap
    if bonus_raw > mrt_cap:
        breaches.append("mrt_cap")
        bonus = mrt_cap
    else:
        bonus = bonus_raw

    return CompResult(
        total_comp=float(employee.base_salary + bonus),
        base=float(employee.base_salary),
        bonus=float(bonus),
        revenue_adjustment=revenue_factor,
        qualitative_adjustment=qual_weighted,
        breaches=breaches,
    )
