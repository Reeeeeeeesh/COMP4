"""SQLAlchemy models for the compensation system."""
from datetime import date
from decimal import Decimal

from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


class Employee(Base):
    """Employee model."""

    __tablename__ = "employees"
    __mapper_args__ = {"eager_defaults": True}

    def __str__(self) -> str:
        return (
            f"Employee(id={self.id}, name={self.name}, "
            f"role={self.role}, base_salary={self.base_salary})"
        )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    role: Mapped[str]
    hire_date: Mapped[date]
    base_salary: Mapped[Decimal]

    qualitative_scores: Mapped[list["QualitativeScore"]] = relationship(
        back_populates="employee"
    )


class SalaryBand(Base):
    """Salary band model."""

    __tablename__ = "salary_bands"
    __mapper_args__ = {"eager_defaults": True}

    def __str__(self) -> str:
        return (
            f"SalaryBand(id={self.id}, role={self.role}, "
            f"min={self.min_salary}, max={self.max_salary})"
        )

    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[str]
    min_salary: Mapped[Decimal]
    max_salary: Mapped[Decimal]


class QualitativeScore(Base):
    """Qualitative performance scores for employees."""

    __tablename__ = "qualitative_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    metric: Mapped[str]
    score: Mapped[float]
    year: Mapped[int]

    employee: Mapped[Employee] = relationship(back_populates="qualitative_scores")


class CompensationRule(Base):
    """Compensation rule model."""

    __tablename__ = "compensation_rules"
    __mapper_args__ = {"eager_defaults": True}

    def __str__(self) -> str:
        return (
            f"CompRule(id={self.id}, year={self.year}, "
            f"target={self.target_bonus_percent}, ref={self.rev_adjust_ref})"
        )

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int]
    target_bonus_percent: Mapped[float]
    rev_adjust_low: Mapped[float]
    rev_adjust_high: Mapped[float]
    rev_adjust_ref: Mapped[float]
    mrt_cap_percent: Mapped[float]
