"""
Report Schemas - Pydantic models matching the template
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ReportType(str, Enum):
    HISTOPATHOLOGY = "Histopathology"
    CYTOPATHOLOGY = "Cytopathology"


class ReportStatus(str, Enum):
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    PUBLISHED = "published"
    AMENDED = "amended"


# Report Schemas
class ReportBase(BaseModel):
    """Base report schema matching template fields"""
    report_type: ReportType = ReportType.HISTOPATHOLOGY
    specimen: Optional[str] = None
    gross_examination: Optional[str] = None
    microscopic_examination: Optional[str] = None
    diagnosis: Optional[str] = None
    icd_code: Optional[str] = None
    special_stains: Optional[str] = None
    immunohistochemistry: Optional[str] = None
    comments: Optional[str] = None


class ReportCreate(ReportBase):
    """Schema for creating a new report"""
    patient_id: int
    invoice_no: str


class ReportUpdate(BaseModel):
    """Schema for updating report"""
    report_type: Optional[ReportType] = None
    specimen: Optional[str] = None
    gross_examination: Optional[str] = None
    microscopic_examination: Optional[str] = None
    diagnosis: Optional[str] = None
    icd_code: Optional[str] = None
    special_stains: Optional[str] = None
    immunohistochemistry: Optional[str] = None
    comments: Optional[str] = None
    ai_assisted: Optional[bool] = None


class ReportResponse(ReportBase):
    """Report response schema"""
    id: int
    patient_id: int
    invoice_no: str
    status: ReportStatus
    ai_assisted: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    signed_by: Optional[int] = None
    signed_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    is_amended: bool
    amendment_reason: Optional[str] = None
    original_report_id: Optional[int] = None

    class Config:
        from_attributes = True


# Workflow Schemas
class ReportSubmit(BaseModel):
    """Submit report for verification"""
    notes: Optional[str] = None


class ReportVerify(BaseModel):
    """Admin verifies report"""
    notes: Optional[str] = None


class ReportReject(BaseModel):
    """Admin rejects report"""
    reason: str = Field(..., min_length=1)


class ReportSign(BaseModel):
    """Doctor signs report"""
    signature_password: str  # For verification


class ReportAmend(BaseModel):
    """Create amendment to published report"""
    reason: str = Field(..., min_length=1)


# Version Schema
class ReportVersionResponse(BaseModel):
    id: int
    report_id: int
    version_number: int
    content: dict
    changed_by: int
    change_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# AI Chat Schemas
class AIChatMessage(BaseModel):
    content: str = Field(..., min_length=1)


class AIChatResponse(BaseModel):
    id: int
    report_id: int
    user_id: int
    role: str
    content: str
    model_used: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# AI Suggestion Schemas
class AISuggestionRequest(BaseModel):
    """Request AI suggestion for a field"""
    field: str  # 'gross_examination', 'microscopic_examination', 'diagnosis'
    context: Optional[str] = None  # Additional context
    specimen: Optional[str] = None


class AISuggestionResponse(BaseModel):
    """AI suggestion response"""
    suggestion: str
    field: str
    model_used: str
