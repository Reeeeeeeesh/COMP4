"""Pydantic schemas for request/response validation."""
from typing import Dict, List

from pydantic import BaseModel, Field, NonNegativeFloat, PositiveInt


class CompRequest(BaseModel):
    """Request schema for compensation calculation."""

    employee_id: PositiveInt = Field(
        ..., description="Employee ID to calculate compensation for"
    )
    revenue_actual: NonNegativeFloat = Field(..., description="Actual revenue achieved")
    qualitative_scores: Dict[str, float] = Field(
        ...,
        description="Qualitative scores by metric",
        examples=[{"risk": 0.8, "compliance": 0.9, "teamwork": 0.85}],
    )

    @property
    def dict_for_calc(self) -> dict[str, int | float | dict[str, float]]:
        """Convert to dict for calculation function."""
        return {
            "employee_id": self.employee_id,
            "revenue_actual": self.revenue_actual,
            "qualitative_scores": self.qualitative_scores,
        }


class CompResult(BaseModel):
    """Response schema for compensation calculation result."""

    total_comp: NonNegativeFloat = Field(..., description="Total compensation amount")
    base: NonNegativeFloat = Field(..., description="Base salary component")
    bonus: NonNegativeFloat = Field(..., description="Bonus component")
    revenue_adjustment: float = Field(..., description="Revenue adjustment factor")
    qualitative_adjustment: float = Field(
        ..., description="Qualitative adjustment factor", ge=0.0, le=1.0
    )
    breaches: List[str] = Field(
        default_factory=list,
        description="Any policy breaches",
        examples=[["salary_band", "mrt_cap"]],
    )
