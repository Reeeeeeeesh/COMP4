"""Admin routes for compensation management."""

import csv
import io
from typing import Dict

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, validator

router = APIRouter(prefix="/admin", tags=["admin"])


class QualitativeScoreCreate(BaseModel):
    """Schema for creating a qualitative score entry."""

    review_period: str = Field(
        ..., description="Review period in format YYYY or YYYY-QN"
    )
    risk_score: float = Field(
        ..., ge=0.0, le=1.0, description="Risk management score (0-1)"
    )
    compliance_score: float = Field(
        ..., ge=0.0, le=1.0, description="Compliance score (0-1)"
    )
    teamwork_score: float = Field(
        ..., ge=0.0, le=1.0, description="Teamwork score (0-1)"
    )
    esg_score: float = Field(
        ..., ge=0.0, le=1.0, description="ESG considerations score (0-1)"
    )
    client_score: float = Field(
        ..., ge=0.0, le=1.0, description="Client outcomes score (0-1)"
    )


class TeamRevenueRow(BaseModel):
    """Schema for a row in the team revenue CSV."""

    fund_id: str
    year: int
    management_fees: float
    performance_fees: float

    @validator("management_fees", "performance_fees")
    def fees_must_be_positive(cls, v):
        """Validate that fees are non-negative."""
        if v < 0:
            raise ValueError("Fees must be non-negative")
        return v


@router.post("/team-revenue/upload")
async def upload_team_revenue(
    file: UploadFile = File(..., description="CSV file with team revenue data")
) -> Dict[str, str]:
    """Upload team revenue data from a CSV file.

    The CSV should have the following columns:
    - fund_id: Fund ID
    - year: Fiscal year
    - management_fees: Revenue from management fees
    - performance_fees: Revenue from performance fees

    Args:
        file: CSV file with team revenue data

    Returns:
        Dict: Status message

    Raises:
        HTTPException: If file format is invalid or other error occurs
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    try:
        # Read the CSV file
        contents = await file.read()

        # Decode and parse CSV
        csv_text = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(csv_text))

        # Validate and process each row
        processed_rows = []
        for row in csv_reader:
            # Validate row data
            try:
                validated_row = TeamRevenueRow(
                    fund_id=row["fund_id"],
                    year=int(row["year"]),
                    management_fees=float(row["management_fees"]),
                    performance_fees=float(row["performance_fees"]),
                )
                processed_rows.append(validated_row)
            except Exception as e:
                raise HTTPException(
                    status_code=400, detail=f"Invalid row data: {str(e)}"
                )

        # In a real implementation, we would save the data to the database
        # For now, we'll just return a success message

        return {
            "status": "success",
            "message": f"Successfully processed {len(processed_rows)} rows of team revenue data",
        }
    except Exception as e:
        # Log the error
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")


@router.post("/qualitative/{emp_id}")
async def create_qualitative_score(
    emp_id: str, score_data: QualitativeScoreCreate
) -> Dict[str, str]:
    """Create a qualitative score entry for an employee.

    Args:
        emp_id: Employee ID
        score_data: Qualitative score data

    Returns:
        Dict: Status message

    Raises:
        HTTPException: If employee not found or other error occurs
    """
    try:
        # In a real implementation, we would save the data to the database
        # For now, we'll just return a success message

        return {
            "status": "success",
            "message": f"Successfully created qualitative score for employee {emp_id} for period {score_data.review_period}",
        }
    except Exception as e:
        # Log the error
        raise HTTPException(
            status_code=500, detail=f"Error creating qualitative score: {str(e)}"
        )
