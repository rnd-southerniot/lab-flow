"""
Report Model - Matches the exact template structure
Histopathology/Cytopathology Report fields from PDF template
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from core.database import BaseHistoReports


class Report(BaseHistoReports):
    """Lab Report model matching the template exactly"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Link to patient (by invoice_no for cross-database reference)
    patient_id = Column(Integer, nullable=False, index=True)
    invoice_no = Column(String(20), nullable=False, index=True)

    # Report Type
    report_type = Column(String(50), nullable=False, default="Histopathology")  # Histopathology / Cytopathology

    # ==================== REPORT CONTENT (from template) ====================

    # Specimen
    specimen = Column(Text, nullable=True)  # e.g., "Tissue from right breast (Excisional biopsy)"

    # Gross examination
    gross_examination = Column(Text, nullable=True)

    # Microscopic examination
    microscopic_examination = Column(Text, nullable=True)

    # Diagnosis (final)
    diagnosis = Column(Text, nullable=True)

    # ==================== ADDITIONAL FIELDS ====================

    # ICD Code (optional)
    icd_code = Column(String(20), nullable=True)

    # Special stains (if any)
    special_stains = Column(Text, nullable=True)

    # Immunohistochemistry (if any)
    immunohistochemistry = Column(Text, nullable=True)

    # Additional comments
    comments = Column(Text, nullable=True)

    # AI assistance tracking
    ai_assisted = Column(Boolean, default=False)

    # ==================== WORKFLOW STATUS ====================

    status = Column(String(30), default="draft")
    # draft -> pending_verification -> verified -> pending_signature -> signed -> published

    # ==================== TRACKING ====================

    # Created by (doctor)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Verified by (admin)
    verified_by = Column(Integer, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Signed by (doctor)
    signed_by = Column(Integer, nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)

    # Published
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Amendment tracking
    is_amended = Column(Boolean, default=False)
    amendment_reason = Column(Text, nullable=True)
    original_report_id = Column(Integer, nullable=True)  # Self-reference for amendments

    def __repr__(self):
        return f"<Report(id={self.id}, invoice_no='{self.invoice_no}', status='{self.status}')>"


class ReportVersion(BaseHistoReports):
    """Version history for audit trail"""
    __tablename__ = "report_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)  # Full report snapshot
    changed_by = Column(Integer, nullable=False)
    change_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ReportVersion(report_id={self.report_id}, version={self.version_number})>"


class AIChatHistory(BaseHistoReports):
    """AI chat history for each report"""
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    model_used = Column(String(50), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AIChatHistory(report_id={self.report_id}, role='{self.role}')>"
