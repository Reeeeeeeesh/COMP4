# Multi-Factor Compensation Tool

A modular, auditable compensation tool for UK equity & fixed-income portfolio managers.

## Business Rules

- Variable pay = Base × Target Bonus × Weighted Performance Score (Investment Perf 60%, Qualitative 40%)
- Revenue Adjustment Factor (RAF) = 1 + (Δ3yrRollingAvgTeamRevenue × SensitivityFactor)
  - Δ3-yr rolling revenue = (Avg Rev Years 0-2 − Avg Rev Years -1--3) / Avg Rev Years -1--3
  - SensitivityFactor = 0.20, clip RAF to 0.90 … 1.10
- Qualitative scorecard covers risk, compliance, teamwork, ESG, client outcomes
- Final outputs: per-employee statement, admin dashboards, and exportable CSV for payroll

## Tech Stack

- Backend: Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic
- Frontend: React 18, TypeScript 5, Vite, Tailwind CSS, Shadcn UI, React Query, Zustand
- Tooling: Poetry for dependency management, Black + Isort for formatting, Ruff for linting, MyPy strict mode for typing
- Testing: Pytest (unit + integration), Cypress (E2E), Coverage ≥ 90%

## Project Structure

- `models/`: ORM entities and Pydantic schemas (one file per entity)
- `services/`: Pure-function business logic (no I/O)
- `routes/`: FastAPI routers (thin ► call services)
- `ui/`: React components and pages under ui/components and ui/pages
- `tests/`: Mirrors source tree; name tests test\_\*.py
- `infra/`: Terraform / Docker / GitHub Actions

## Setup

1. Create a virtual environment:

   ```
   python -m venv venv
   ```

2. Activate the virtual environment:

   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   uvicorn main:app --reload
   ```

## Development

- Follow the coding guidelines in the project documentation
- Ensure all financial formulas are in pure functions inside services/
- Use functional, declarative style; avoid classes except for ORM models
- Write Google-style docstrings and ensure 100% type annotations
