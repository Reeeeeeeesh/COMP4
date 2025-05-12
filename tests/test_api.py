"""Test suite for compensation API endpoints."""
from datetime import date, datetime
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database import get_session
from app.main import app
from app.models import Base, CompensationRule, Employee, SalaryBand

# Test data
TEST_EMPLOYEE = Employee(
    id=1,
    name="John Doe",
    role="Portfolio Manager",
    hire_date=date(2020, 1, 1),
    base_salary=Decimal("100000.00"),
)

TEST_BAND = SalaryBand(
    id=1,
    role="Portfolio Manager",
    min_salary=Decimal("90000.00"),
    max_salary=Decimal("150000.00"),
)

TEST_RULE = CompensationRule(
    id=1,
    year=datetime.now().year,
    target_bonus_percent=0.3,
    rev_adjust_low=0.8,
    rev_adjust_high=1.2,
    rev_adjust_ref=1000000.0,
    mrt_cap_percent=2.0,
)


@pytest.fixture
async def async_session() -> AsyncSession:
    """Create an async session for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        async with session.begin():
            session.add(TEST_EMPLOYEE)
            session.add(TEST_BAND)
            session.add(TEST_RULE)
        await session.commit()

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def override_get_session(async_session: AsyncSession):
    """Override the get_session dependency for testing."""

    async def _get_session():
        yield async_session

    app.dependency_overrides[get_session] = _get_session
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_calculate_compensation(override_get_session: None) -> None:
    """Test the compensation calculation endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/calc/",
            json={
                "employee_id": TEST_EMPLOYEE.id,
                "revenue_actual": 1000000.0,
                "qualitative_scores": {"risk": 1.0},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["base"] == float(TEST_EMPLOYEE.base_salary)
    assert data["bonus"] == pytest.approx(30000.0)  # 30% of base salary
    assert not data["breaches"]
