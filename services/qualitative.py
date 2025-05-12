"""Qualitative score calculation service.

This module contains pure functions for calculating qualitative performance scores
based on risk, compliance, teamwork, ESG, and client outcome metrics.
"""

import logging
from typing import Dict, Optional

# Setup logging
logger = logging.getLogger(__name__)


def calc_qualitative_score(
    emp_id: str, period: str, qualitative_data: Optional[Dict] = None
) -> float:
    """Calculate qualitative performance score for an employee.

    This function normalizes each of the five factors (risk, compliance, teamwork, ESG, client)
    to 0-1, averages them, and converts to multipliers:
    - 0× (<0.4)
    - 1× (0.4-0.7)
    - 1.2× (>0.7)

    Args:
        emp_id: Employee ID
        period: Review period (e.g., '2025')
        qualitative_data: Optional pre-fetched qualitative data

    Returns:
        float: Weighted qualitative performance multiplier (40% weight)
    """
    # If data is not provided, fetch it
    if qualitative_data is None:
        qualitative_data = _get_qualitative_data(emp_id, period)

    if not qualitative_data:
        logger.warning(
            f"No qualitative data found for employee {emp_id} in period {period}"
        )
        return 0.0

    # Extract the five factors
    risk_score = qualitative_data.get("risk_score", 0.0)
    compliance_score = qualitative_data.get("compliance_score", 0.0)
    teamwork_score = qualitative_data.get("teamwork_score", 0.0)
    esg_score = qualitative_data.get("esg_score", 0.0)
    client_score = qualitative_data.get("client_score", 0.0)

    # Calculate average score
    factors = [risk_score, compliance_score, teamwork_score, esg_score, client_score]
    average_score = sum(factors) / len(factors)

    # Map average score to multiplier
    multiplier = _score_to_multiplier(average_score)

    # Apply 40% weight to the qualitative component
    return multiplier * 0.4


def _get_qualitative_data(emp_id: str, period: str) -> Dict:
    """Get qualitative data for an employee.

    This is a placeholder function that would normally fetch data from a database.
    In a real implementation, this would query the QualitativeScore table.

    Args:
        emp_id: Employee ID
        period: Review period

    Returns:
        Dict: Qualitative data dictionary
    """
    # This is placeholder data - in production this would come from a database
    # Example placeholder data
    return {
        "risk_score": 0.85,
        "compliance_score": 0.90,
        "teamwork_score": 0.75,
        "esg_score": 0.80,
        "client_score": 0.85,
    }


def _score_to_multiplier(average_score: float) -> float:
    """Map average qualitative score to a payout multiplier.

    The mapping is:
    - 0× (<0.4)
    - 1× (0.4-0.7)
    - 1.2× (>0.7)

    Args:
        average_score: Average qualitative score (0-1)

    Returns:
        float: Payout multiplier
    """
    if average_score < 0.4:
        return 0.0
    elif average_score <= 0.7:
        return 1.0
    else:
        return 1.2
