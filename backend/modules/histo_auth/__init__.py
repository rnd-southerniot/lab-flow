"""
Histo-Cyto Authentication Module
JWT-based authentication for lab system
"""
from .routes.auth import router as histo_auth_router
from .dependencies import (
    get_current_user,
    get_current_active_user,
    require_role,
    require_admin,
    require_doctor,
    require_admin_or_doctor,
    RoleChecker
)

__all__ = [
    "histo_auth_router",
    "get_current_user",
    "get_current_active_user",
    "require_role",
    "require_admin",
    "require_doctor",
    "require_admin_or_doctor",
    "RoleChecker"
]
