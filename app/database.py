"""Database configuration and session management."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

DATABASE_URL = "postgresql+asyncpg://dev:dev@localhost/comp4"

async_engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with async_session_maker() as session:
        yield session
