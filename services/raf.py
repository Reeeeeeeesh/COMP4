"""Revenue Adjustment Factor (RAF) calculation service.

This module contains pure functions for calculating the Revenue Adjustment Factor
based on 3-year rolling average team revenue changes.
"""

import logging
from typing import Dict, List, Optional

# Setup logging
logger = logging.getLogger(__name__)


def calc_raf(
    emp_id: str, period: str, team_revenue_data: Optional[List[Dict]] = None
) -> float:
    """Calculate Revenue Adjustment Factor (RAF) for an employee.

    This function:
    1. Pulls the employee's team funds
    2. Sums TeamRevenue for the last 4 fiscal years
    3. Computes two 3-year rolling averages (Y0-2 vs Y-1--3) and percentage change
    4. Returns 1 + change × 0.20, then clamps between 0.90 and 1.10

    Args:
        emp_id: Employee ID
        period: Review period (e.g., '2025')
        team_revenue_data: Optional pre-fetched team revenue data

    Returns:
        float: Revenue Adjustment Factor (RAF)
    """
    # If data is not provided, fetch it
    if team_revenue_data is None:
        team_revenue_data = _get_team_revenue_data(emp_id, period)

    if not team_revenue_data:
        logger.warning(
            f"No team revenue data found for employee {emp_id} in period {period}"
        )
        return 1.0  # Default to neutral RAF if no data

    # Extract the review period year as an integer
    try:
        current_year = int(period)
    except ValueError:
        logger.error(f"Invalid period format: {period}. Expected a year (YYYY).")
        return 1.0

    # Calculate the years needed for the rolling averages
    years_needed = [
        current_year - 1,  # Y-1
        current_year - 2,  # Y-2
        current_year - 3,  # Y-3
        current_year,  # Y0
        current_year - 4,  # Y-4 (needed for the older 3-year average)
    ]

    # Filter data to only include the years we need
    filtered_data = [
        entry for entry in team_revenue_data if entry["year"] in years_needed
    ]

    # Group revenue by year
    revenue_by_year = {}
    for entry in filtered_data:
        year = entry["year"]
        total_revenue = entry["management_fees"] + entry["performance_fees"]

        if year in revenue_by_year:
            revenue_by_year[year] += total_revenue
        else:
            revenue_by_year[year] = total_revenue

    # Calculate the two 3-year rolling averages
    recent_years = [current_year, current_year - 1, current_year - 2]
    older_years = [current_year - 1, current_year - 2, current_year - 3]

    recent_avg = _calculate_average_revenue(revenue_by_year, recent_years)
    older_avg = _calculate_average_revenue(revenue_by_year, older_years)

    # Calculate percentage change
    if older_avg == 0:
        logger.warning(
            f"Older average revenue is zero for employee {emp_id} in period {period}"
        )
        return 1.0  # Default to neutral RAF if older average is zero

    percentage_change = (recent_avg - older_avg) / older_avg

    # Calculate RAF: 1 + change × 0.20, clamped between 0.90 and 1.10
    sensitivity_factor = 0.20
    raf = 1.0 + (percentage_change * sensitivity_factor)

    # Clamp RAF between 0.90 and 1.10
    raf = max(0.90, min(1.10, raf))

    # Round to 4 decimal places for precision
    raf = round(raf, 4)

    logger.info(
        f"RAF calculation for employee {emp_id}, period {period}: "
        f"Recent avg: {recent_avg}, Older avg: {older_avg}, "
        f"Change: {percentage_change:.4f}, RAF: {raf:.4f}"
    )

    return raf


def _get_team_revenue_data(emp_id: str, period: str) -> List[Dict]:
    """Get team revenue data for an employee's funds.

    This is a placeholder function that would normally fetch data from a database.
    In a real implementation, this would query the TeamRevenue table for funds
    associated with the employee.

    Args:
        emp_id: Employee ID
        period: Review period

    Returns:
        List[Dict]: List of team revenue data dictionaries
    """
    # This is placeholder data - in production this would come from a database
    # Example placeholder data for a 4-year period
    current_year = int(period)

    return [
        {
            "fund_id": "UKEF001",
            "year": current_year,
            "management_fees": 2200000,
            "performance_fees": 800000,
        },
        {
            "fund_id": "UKEF001",
            "year": current_year - 1,
            "management_fees": 2100000,
            "performance_fees": 700000,
        },
        {
            "fund_id": "UKEF001",
            "year": current_year - 2,
            "management_fees": 2000000,
            "performance_fees": 600000,
        },
        {
            "fund_id": "UKEF001",
            "year": current_year - 3,
            "management_fees": 1900000,
            "performance_fees": 500000,
        },
        {
            "fund_id": "GFIF002",
            "year": current_year,
            "management_fees": 1800000,
            "performance_fees": 200000,
        },
        {
            "fund_id": "GFIF002",
            "year": current_year - 1,
            "management_fees": 1700000,
            "performance_fees": 150000,
        },
        {
            "fund_id": "GFIF002",
            "year": current_year - 2,
            "management_fees": 1600000,
            "performance_fees": 100000,
        },
        {
            "fund_id": "GFIF002",
            "year": current_year - 3,
            "management_fees": 1500000,
            "performance_fees": 50000,
        },
    ]


def _calculate_average_revenue(
    revenue_by_year: Dict[int, float], years: List[int]
) -> float:
    """Calculate average revenue for a list of years.

    Args:
        revenue_by_year: Dictionary mapping years to total revenue
        years: List of years to average

    Returns:
        float: Average revenue
    """
    total = 0.0
    count = 0

    for year in years:
        if year in revenue_by_year:
            total += revenue_by_year[year]
            count += 1

    if count == 0:
        return 0.0

    return total / count
