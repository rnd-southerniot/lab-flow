"""
Histo-Cyto User Model
Supports Admin and Doctor roles for lab report system
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from core.database import BaseHistoUsers


class HistoUser(BaseHistoUsers):
    """User model for Histo-Cyto Lab System"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Role: 'admin' or 'doctor'
    role = Column(String(50), nullable=False, default='doctor')

    # Doctor-specific fields
    qualification = Column(String(255), nullable=True)  # e.g., "MD, Pathologist"
    registration_number = Column(String(100), nullable=True)  # Medical council registration
    department = Column(String(100), nullable=True)

    # Signature image URL (for PDF reports)
    signature_image_url = Column(String(500), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Granular permissions (JSON array)
    permissions = Column(JSON, nullable=True, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<HistoUser(id={self.id}, username='{self.username}', role='{self.role}')>"


class ActivityLog(BaseHistoUsers):
    """Activity log for audit trail"""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g., 'login', 'create_patient', 'sign_report'
    entity_type = Column(String(50), nullable=True)  # e.g., 'patient', 'report', 'signature'
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)  # Additional details as JSON
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, user_id={self.user_id}, action='{self.action}')>"
