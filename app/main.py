"""Main FastAPI application module."""
from fastapi import FastAPI

from app.api import router as comp_router

app = FastAPI(
    title="Compensation API",
    version="0.1.0",
)

app.include_router(
    comp_router,
    prefix="/compensation",
)


@app.get("/healthz")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
