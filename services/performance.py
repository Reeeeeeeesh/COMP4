"""Investment performance calculation service.

This module contains pure functions for calculating investment performance scores
based on fund returns, benchmarks, and other metrics.
"""

import logging
from typing import Dict, List

# Setup logging
logger = logging.getLogger(__name__)


def calc_investment_score(emp_id: str, period: str) -> float:
    """Calculate investment performance score for an employee.

    This function fetches all funds managed by the employee and their returns & benchmarks,
    computes alpha in basis points and Information Ratio for 1-yr and 3-yr horizons,
    and maps the alpha to a payout multiplier curve.

    Args:
        emp_id: Employee ID
        period: Review period (e.g., '2025')

    Returns:
        float: Weighted investment performance multiplier (60% weight)

    Note:
        The alpha to multiplier mapping is:
        - 0× if alpha < 0
        - 1× at benchmark
        - 1.8× at +300 bps
        - Linear in-between
    """
    # This would normally fetch data from a database or external service
    # For now, we'll implement a placeholder that will be replaced with actual data access

    # Get funds managed by employee
    funds_data = _get_employee_funds(emp_id, period)

    if not funds_data:
        logger.warning(f"No funds found for employee {emp_id} in period {period}")
        return 0.0

    # Calculate alpha and IR for each fund
    fund_metrics = []
    for fund_data in funds_data:
        one_yr_alpha = _calculate_alpha(fund_data, "1yr")
        three_yr_alpha = _calculate_alpha(fund_data, "3yr")
        one_yr_ir = _calculate_information_ratio(fund_data, "1yr")
        three_yr_ir = _calculate_information_ratio(fund_data, "3yr")

        # Weight the metrics (example weighting)
        weighted_alpha = (one_yr_alpha * 0.4) + (three_yr_alpha * 0.6)
        weighted_ir = (one_yr_ir * 0.4) + (three_yr_ir * 0.6)

        fund_metrics.append(
            {
                "fund_id": fund_data["fund_id"],
                "weighted_alpha": weighted_alpha,
                "weighted_ir": weighted_ir,
                "aum_weight": fund_data[
                    "aum_weight"
                ],  # Assume each fund has a weight based on AUM
            }
        )

    # Calculate overall weighted alpha across all funds
    total_alpha = sum(
        metric["weighted_alpha"] * metric["aum_weight"] for metric in fund_metrics
    )

    # Map alpha to multiplier using the defined curve
    multiplier = _alpha_to_multiplier(total_alpha)

    # Apply 60% weight to the investment performance component
    return multiplier * 0.6


def _get_employee_funds(emp_id: str, period: str) -> List[Dict]:
    """Get funds managed by an employee with performance data.

    This is a placeholder function that would normally fetch data from a database.
    In a real implementation, this would query the database for funds associated with
    the employee and their performance metrics.

    Args:
        emp_id: Employee ID
        period: Review period

    Returns:
        List[Dict]: List of fund data dictionaries
    """
    # This is placeholder data - in production this would come from a database
    # In a real implementation, we would fetch from the performance_data_source
    # Example placeholder data
    return [
        {
            "fund_id": "UKEF001",
            "fund_name": "UK Equity Fund",
            "returns_1yr": 0.0725,  # 7.25%
            "benchmark_1yr": 0.0650,  # 6.50%
            "returns_3yr": 0.2150,  # 21.50% (cumulative)
            "benchmark_3yr": 0.1950,  # 19.50% (cumulative)
            "tracking_error_1yr": 0.0120,  # 1.20%
            "tracking_error_3yr": 0.0150,  # 1.50%
            "aum_weight": 0.65,  # 65% of employee's AUM
        },
        {
            "fund_id": "GFIF002",
            "fund_name": "Global Fixed Income Fund",
            "returns_1yr": 0.0320,  # 3.20%
            "benchmark_1yr": 0.0280,  # 2.80%
            "returns_3yr": 0.0950,  # 9.50% (cumulative)
            "benchmark_3yr": 0.0850,  # 8.50% (cumulative)
            "tracking_error_1yr": 0.0080,  # 0.80%
            "tracking_error_3yr": 0.0090,  # 0.90%
            "aum_weight": 0.35,  # 35% of employee's AUM
        },
    ]


def _calculate_alpha(fund_data: Dict, horizon: str) -> float:
    """Calculate alpha (outperformance vs benchmark) in basis points.

    Args:
        fund_data: Fund performance data
        horizon: Time horizon ('1yr' or '3yr')

    Returns:
        float: Alpha in basis points
    """
    if horizon == "1yr":
        alpha = fund_data["returns_1yr"] - fund_data["benchmark_1yr"]
    else:  # 3yr
        alpha = fund_data["returns_3yr"] - fund_data["benchmark_3yr"]

    # Convert to basis points (multiply by 10000)
    return alpha * 10000


def _calculate_information_ratio(fund_data: Dict, horizon: str) -> float:
    """Calculate Information Ratio (alpha / tracking error).

    Args:
        fund_data: Fund performance data
        horizon: Time horizon ('1yr' or '3yr')

    Returns:
        float: Information Ratio
    """
    if horizon == "1yr":
        alpha = fund_data["returns_1yr"] - fund_data["benchmark_1yr"]
        tracking_error = fund_data["tracking_error_1yr"]
    else:  # 3yr
        alpha = fund_data["returns_3yr"] - fund_data["benchmark_3yr"]
        tracking_error = fund_data["tracking_error_3yr"]

    # Avoid division by zero
    if tracking_error == 0:
        return 0.0

    return alpha / tracking_error


def _alpha_to_multiplier(alpha_bps: float) -> float:
    """Map alpha in basis points to a payout multiplier.

    The mapping is:
    - 0× if alpha < 0
    - 1× at benchmark (alpha = 0)
    - 1.8× at +300 bps
    - Linear in-between

    Args:
        alpha_bps: Alpha in basis points

    Returns:
        float: Payout multiplier
    """
    if alpha_bps < 0:
        return 0.0
    elif alpha_bps > 300:
        return 1.8
    else:
        # Linear interpolation between 1.0 at 0 bps and 1.8 at 300 bps
        return 1.0 + (alpha_bps / 300) * 0.8
