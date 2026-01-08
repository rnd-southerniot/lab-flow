"""
Histo-Cyto Authentication Routes
Login, logout, and token management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from core.database import get_db_histo_users
from core.security import verify_password, create_access_token, get_password_hash
from core.config import settings
from modules.histo_users.models.user import HistoUser, ActivityLog
from modules.histo_users.schemas.user import (
    Token, LoginRequest, UserResponse, UserCreate
)
from ..dependencies import get_current_user

router = APIRouter()


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    request: Request = None,
    details: dict = None
):
    """Helper function to log user activity"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    db.commit()


@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db_histo_users)
):
    """
    Authenticate user and return JWT token
    """
    # Find user by username
    user = db.query(HistoUser).filter(HistoUser.username == login_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role
        },
        expires_delta=access_token_expires
    )

    # Update last login and log activity
    user.last_login = datetime.utcnow()
    db.commit()

    log_activity(db, user.id, "login", request, {"role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: HistoUser = Depends(get_current_user)
):
    """
    Get current authenticated user's information
    """
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_first_admin(
    user_data: UserCreate,
    db: Session = Depends(get_db_histo_users)
):
    """
    Register the first admin user (only works if no users exist)
    This endpoint is for initial setup only.
    """
    # Check if any users exist
    existing_users = db.query(HistoUser).first()
    if existing_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed. Please contact administrator."
        )

    # Check if email or username already exists
    existing_user = db.query(HistoUser).filter(
        (HistoUser.email == user_data.email) | (HistoUser.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Create the first admin user
    hashed_password = get_password_hash(user_data.password)
    new_user = HistoUser(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role="admin",  # First user is always admin
        qualification=user_data.qualification,
        registration_number=user_data.registration_number,
        department=user_data.department,
        is_superuser=True,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/logout")
def logout(
    request: Request,
    current_user: HistoUser = Depends(get_current_user),
    db: Session = Depends(get_db_histo_users)
):
    """
    Logout user (client should discard token)
    Log the logout activity
    """
    log_activity(db, current_user.id, "logout", request)

    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user: HistoUser = Depends(get_current_user)
):
    """
    Refresh the access token for an authenticated user
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": current_user.username,
            "user_id": current_user.id,
            "role": current_user.role
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
