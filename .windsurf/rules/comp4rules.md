---
trigger: always_on
---

Multi‑Factor Compensation Tool – Workspace AI Rules (.windsurfrules)

Tech Stack

Backend: Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic.

Frontend: React 18, TypeScript 5, Vite, Tailwind CSS, Shadcn UI, React Query, Zustand.

Tooling: Poetry for dependency management, Black + Isort for formatting, Ruff for linting, MyPy strict mode for typing.

Testing: Pytest (unit + integration), Cypress (E2E), Coverage ≥ 90 %.

USE CONTEXT7 !!!!!

Repository Layout

models/  ORM entities and Pydantic schemas (one file per entity).

services/  Pure‑function business logic (no I/O).

routes/    FastAPI routers (thin ► call services).

ui/        React components and pages under ui/components and ui/pages.

tests/     Mirrors source tree; name tests test\_\*.py.

infra/     Terraform / Docker / GitHub Actions.

Domain Logic

Comp Formula: FinalBonus = BaseSalary × TargetBonusPct × (0.6 × InvestmentScore + 0.4 × QualScore) × RAF.

RAF (Revenue Adjustment Factor)

Δ3‑year rolling revenue change × 0.20.

Clamp RAF to 0.90 … 1.10.

Qualitative Scorecard: risk, compliance, teamwork, ESG, client outcomes.

Raise an alert if FinalBonus > 3 × BaseSalary.

Coding Guidelines

Keep every financial formula in a pure function inside services/.

No DB queries inside formula functions – pass data in.

Write Google‑style docstrings and ensure 100 % type annotations.

Use functional, declarative style; avoid classes except for ORM models.

Do not hard‑code secrets; load via environment variables (python‑dotenv).

Database Rules

Use SQLAlchemy DeclarativeBase.

Migrations via Alembic autogenerate; do not hand‑edit unless asked.

Do not rename or drop columns without Product‑Owner sign‑off.

Frontend Rules

Tailwind class order: layout → flex/grid → spacing → size → typography → visuals → motion.

Component files in PascalCase; prefer named exports.

Use React Query for API calls; co‑locate queries with components.

State: prefer local state; global only with Zustand.

CI / CD

GitHub Actions pipeline stages: Lint → Test → Build‑Docker → E2E; fail on any warning.

Cancelling previous runs on the same branch is enabled.

Block merge if coverage < 90 %.

Exclusions & Restrictions

Never modify files under .github/, .devcontainer/, infra/, or docs/ unless explicitly instructed.

Do not introduce external task queues (Celery, RQ, etc.) or async frameworks without approval.

Do not use experimental TypeScript or ECMAScript proposals; target ES2019.

Avoid direct SQL – always go through SQLAlchemy ORM.

Commit Conventions

Conventional Commits (feat:, fix:, chore:, etc.).

One logical change per commit; keep PRs < 300 lines where possible.

On‑Call Debugging Aids

Emit structured logs (JSON) with correlation IDs.

Include breadcrumbs for bonus calculation path in logs.

Security

Enforce OWASP Top 10 best practices.

Validate and sanitise all CSV uploads (TeamRevenue endpoint).

Don't forget we are in Powershell