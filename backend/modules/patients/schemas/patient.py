"""
Patient Schemas - Pydantic models matching the template
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum


class SexEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class InvestigationType(str, Enum):
    HISTOPATHOLOGY = "Histopathology"
    CYTOPATHOLOGY = "Cytopathology"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


# Patient Schemas
class PatientBase(BaseModel):
    """Base patient schema matching template fields"""
    receive_date: date
    reporting_date: Optional[date] = None
    patient_name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=0, le=150)
    age_unit: str = "years"
    sex: SexEnum
    consultant_name: Optional[str] = None
    consultant_designation: Optional[str] = None
    investigation_type: InvestigationType = InvestigationType.HISTOPATHOLOGY
    clinical_information: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    pass


class PatientUpdate(BaseModel):
    """Schema for updating patient"""
    receive_date: Optional[date] = None
    reporting_date: Optional[date] = None
    patient_name: Optional[str] = None
    age: Optional[int] = None
    age_unit: Optional[str] = None
    sex: Optional[SexEnum] = None
    consultant_name: Optional[str] = None
    consultant_designation: Optional[str] = None
    investigation_type: Optional[InvestigationType] = None
    clinical_information: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class PatientResponse(PatientBase):
    """Patient response schema"""
    id: int
    invoice_no: str
    verification_status: VerificationStatus
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Verification Schemas
class PatientVerify(BaseModel):
    """Schema for verifying a patient"""
    notes: Optional[str] = None


class PatientReject(BaseModel):
    """Schema for rejecting a patient"""
    notes: str = Field(..., min_length=1)


# Referring Doctor Schemas
class ReferringDoctorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    designation: Optional[str] = None
    hospital: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ReferringDoctorCreate(ReferringDoctorBase):
    pass


class ReferringDoctorUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    hospital: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class ReferringDoctorResponse(ReferringDoctorBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
