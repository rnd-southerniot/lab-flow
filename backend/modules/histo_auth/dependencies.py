"""
Histo-Cyto Authentication Dependencies
Provides dependency injection for authentication and authorization
"""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from core.database import get_db_histo_users
from core.security import decode_token
from modules.histo_users.models.user import HistoUser


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_histo_users)
) -> HistoUser:
    """
    Get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization:
        raise credentials_exception

    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.replace("Bearer ", "")

    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception

    # Get user from database
    user = db.query(HistoUser).filter(HistoUser.username == username).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: HistoUser = Depends(get_current_user)
) -> HistoUser:
    """
    Ensure the current user is active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_role(required_roles: list):
    """
    Dependency factory to require specific roles
    Usage: Depends(require_role(["admin"]))
    """
    async def role_checker(
        current_user: HistoUser = Depends(get_current_user)
    ) -> HistoUser:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker


def require_admin():
    """
    Dependency to require admin role
    """
    return require_role(["admin"])


def require_doctor():
    """
    Dependency to require doctor role
    """
    return require_role(["doctor"])


def require_admin_or_doctor():
    """
    Dependency to require either admin or doctor role
    """
    return require_role(["admin", "doctor"])


class RoleChecker:
    """
    Class-based dependency for role checking
    Usage: Depends(RoleChecker(["admin", "doctor"]))
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: HistoUser = Depends(get_current_user)) -> HistoUser:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(self.allowed_roles)}"
            )
        return user
