"""
Histo-Cyto User Management Routes
Admin-only endpoints for managing users
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db_histo_users
from core.security import get_password_hash, verify_password
from ..models.user import HistoUser, ActivityLog
from ..schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse,
    ActivityLogResponse, PasswordChange
)

router = APIRouter()


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str = None,
    entity_id: int = None,
    details: dict = None,
    request: Request = None
):
    """Helper function to log user activity"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    db.commit()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db_histo_users)
):
    """
    Create a new user (Admin only)
    """
    # Check if email or username already exists
    existing_user = db.query(HistoUser).filter(
        (HistoUser.email == user_data.email) | (HistoUser.username == user_data.username)
    ).first()

    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = HistoUser(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role.value,
        qualification=user_data.qualification,
        registration_number=user_data.registration_number,
        department=user_data.department,
        is_superuser=(user_data.role.value == "admin")
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_histo_users)
):
    """
    Get all users with optional filters
    """
    query = db.query(HistoUser)

    if role:
        query = query.filter(HistoUser.role == role)
    if is_active is not None:
        query = query.filter(HistoUser.is_active == is_active)

    users = query.order_by(HistoUser.id.desc()).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db_histo_users)
):
    """
    Get a specific user by ID
    """
    user = db.query(HistoUser).filter(HistoUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db_histo_users)
):
    """
    Update a user's information
    """
    user = db.query(HistoUser).filter(HistoUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)

    # Handle password separately
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        del update_data["password"]

    # Handle role enum
    if "role" in update_data and update_data["role"]:
        update_data["role"] = update_data["role"].value
        update_data["is_superuser"] = (update_data["role"] == "admin")

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db_histo_users)
):
    """
    Delete a user (soft delete by setting is_active=False, or hard delete)
    """
    user = db.query(HistoUser).filter(HistoUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Soft delete - just deactivate
    user.is_active = False
    db.commit()

    return None


@router.get("/{user_id}/activity", response_model=List[ActivityLogResponse])
def get_user_activity(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db_histo_users)
):
    """
    Get activity log for a specific user
    """
    # Verify user exists
    user = db.query(HistoUser).filter(HistoUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()

    return logs


@router.post("/{user_id}/change-password", status_code=status.HTTP_200_OK)
def change_password(
    user_id: int,
    password_data: PasswordChange,
    db: Session = Depends(get_db_histo_users)
):
    """
    Change user's password (requires current password verification)
    """
    user = db.query(HistoUser).filter(HistoUser.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
