"""
Patient Model - Matches the exact template structure
Fields from the PDF template table
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Date
from sqlalchemy.sql import func
from core.database import BaseHistoPatients


class Patient(BaseHistoPatients):
    """Patient registration model matching the template"""
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Invoice No. (Auto-generated: INV-YYYY-XXXX)
    invoice_no = Column(String(20), unique=True, nullable=False, index=True)

    # Dates
    receive_date = Column(Date, nullable=False)  # Receive Date
    reporting_date = Column(Date, nullable=True)  # Reporting Date (filled when report is done)

    # Patient Information
    patient_name = Column(String(255), nullable=False)  # Name of Patient
    age = Column(Integer, nullable=False)  # Age in years
    age_unit = Column(String(20), default="years")  # years, months, days
    sex = Column(String(20), nullable=False)  # Male, Female, Other

    # Referring Doctor
    consultant_name = Column(String(255), nullable=True)  # Consultant/Referred by name
    consultant_designation = Column(String(255), nullable=True)  # MBBS, BCS, FCPS etc.

    # Investigation Type
    investigation_type = Column(String(100), nullable=False, default="Histopathology")  # Histopathology / Cytopathology

    # Clinical Information
    clinical_information = Column(Text, nullable=True)

    # Contact Information (optional)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    # Admin Verification
    verification_status = Column(String(20), default="pending")  # pending, verified, rejected
    verified_by = Column(Integer, nullable=True)  # Admin user ID
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_notes = Column(Text, nullable=True)

    # Tracking
    created_by = Column(Integer, nullable=False)  # User who registered
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Patient(id={self.id}, invoice_no='{self.invoice_no}', name='{self.patient_name}')>"


class ReferringDoctor(BaseHistoPatients):
    """Pre-registered referring doctors for quick selection"""
    __tablename__ = "referring_doctors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=True)  # MBBS, FCPS, etc.
    hospital = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ReferringDoctor(id={self.id}, name='{self.name}')>"
