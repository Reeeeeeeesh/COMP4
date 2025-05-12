"""Routes package initialization."""

from routes.admin import router as admin_router
from routes.employee import router as employee_router

__all__ = [
    "employee_router",
    "admin_router",
]
