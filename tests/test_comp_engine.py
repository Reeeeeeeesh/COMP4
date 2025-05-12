"""Test suite for compensation calculation engine."""
from datetime import date, datetime
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, CompensationRule, Employee, SalaryBand
from app.services.comp_engine import calculate_compensation


# Test data
@pytest.fixture
def test_employee() -> Employee:
    return Employee(
        id=1,
        name="John Doe",
        role="trader",
        hire_date=date(2020, 1, 1),
        base_salary=Decimal("100000.00"),
        qualitative_scores=[],
    )


@pytest.fixture
def test_band() -> SalaryBand:
    return SalaryBand(
        id=1,
        role="trader",
        min_salary=Decimal("80000.00"),
        max_salary=Decimal("150000.00"),
    )


@pytest.fixture
def test_rule() -> CompensationRule:
    current_year = datetime.now().year
    return CompensationRule(
        id=1,
        year=current_year,
        target_bonus_percent=0.3,
        rev_adjust_ref=1000000.0,
        rev_adjust_low=0.9,
        rev_adjust_high=1.1,
        mrt_cap_percent=0.2,  # Lower cap to trigger breach
    )


@pytest.fixture(autouse=True)
async def setup_test_data(
    db_session: AsyncSession,
    test_employee: Employee,
    test_band: SalaryBand,
    test_rule: CompensationRule,
) -> None:
    """Setup test data before each test."""
    db_session.add_all([test_employee, test_band, test_rule])
    await db_session.commit()
    await db_session.refresh(test_employee)
    await db_session.refresh(test_band)
    await db_session.refresh(test_rule)


@pytest.fixture
async def db_session() -> AsyncSession:
    """Create a synchronous session for testing."""
    # Create in-memory database
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=True,  # Enable SQL logging
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session factory
    session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=True
    )

    # Create session
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()
            await engine.dispose()


@pytest.mark.parametrize(
    "revenue,scores,expected_bonus,expected_breaches",
    [
        # Happy path - no breaches
        (1000000.0, {"risk": 1.0}, 20000.0, ["mrt_cap"]),
        # Revenue factor clipping - low
        (700000.0, {"risk": 1.0}, 20000.0, ["mrt_cap"]),
        # Revenue factor clipping - high
        (1300000.0, {"risk": 1.0}, 20000.0, ["mrt_cap"]),
        # MRT cap breach
        (2000000.0, {"risk": 1.0}, 20000.0, ["mrt_cap"]),
    ],
)
async def test_calculate_compensation(
    db_session: AsyncSession,
    test_employee: Employee,
    revenue: float,
    scores: dict[str, float],
    expected_bonus: float,
    expected_breaches: list[str],
) -> None:
    """Test compensation calculation with various scenarios."""
    result = await calculate_compensation(
        employee_id=test_employee.id,
        revenue_actual=revenue,
        qualitative_scores=scores,
        session=db_session,
    )

    assert result.base == float(test_employee.base_salary)
    assert pytest.approx(result.bonus) == expected_bonus
    assert result.breaches == expected_breaches


async def test_salary_band_breach(
    db_session: AsyncSession, test_employee: Employee
) -> None:
    """Test detection of salary band breach."""
    # Update employee salary above band maximum
    test_employee.base_salary = Decimal("160000.00")
    db_session.commit()

    result = await calculate_compensation(
        employee_id=test_employee.id,
        revenue_actual=1000000.0,
        qualitative_scores={"risk": 1.0},
        session=db_session,
    )

    assert "salary_band" in result.breaches


async def test_employee_not_found(
    db_session: AsyncSession, test_employee: Employee
) -> None:
    """Test error when employee not found."""
    with pytest.raises(ValueError, match="Employee .* not found"):
        await calculate_compensation(
            employee_id=999,  # Non-existent ID
            revenue_actual=1000000.0,
            qualitative_scores={"risk": 1.0},
            session=db_session,
        )
