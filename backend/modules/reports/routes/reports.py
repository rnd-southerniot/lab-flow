"""
Report Routes - CRUD operations and workflow management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db_histo_reports
from ..models.report import Report, ReportVersion, AIChatHistory
from ..schemas.report import (
    ReportCreate, ReportUpdate, ReportResponse,
    ReportSubmit, ReportVerify, ReportReject, ReportSign, ReportAmend,
    ReportVersionResponse, AIChatMessage, AIChatResponse,
    ReportStatus, ReportType
)

router = APIRouter()


def create_version_snapshot(db: Session, report: Report, changed_by: int, reason: str = None):
    """Create a version snapshot of the report"""
    # Count existing versions
    version_count = db.query(ReportVersion).filter(
        ReportVersion.report_id == report.id
    ).count()

    version = ReportVersion(
        report_id=report.id,
        version_number=version_count + 1,
        content={
            "specimen": report.specimen,
            "gross_examination": report.gross_examination,
            "microscopic_examination": report.microscopic_examination,
            "diagnosis": report.diagnosis,
            "special_stains": report.special_stains,
            "immunohistochemistry": report.immunohistochemistry,
            "comments": report.comments,
            "status": report.status
        },
        changed_by=changed_by,
        change_reason=reason
    )
    db.add(version)
    db.commit()


# ==================== REPORT CRUD ====================

@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    created_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_reports)
):
    """Create a new report for a patient"""
    # Check if report already exists for this patient
    existing = db.query(Report).filter(
        Report.invoice_no == report_data.invoice_no,
        Report.is_amended == False
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report already exists for invoice {report_data.invoice_no}"
        )

    new_report = Report(
        patient_id=report_data.patient_id,
        invoice_no=report_data.invoice_no,
        report_type=report_data.report_type.value,
        specimen=report_data.specimen,
        gross_examination=report_data.gross_examination,
        microscopic_examination=report_data.microscopic_examination,
        diagnosis=report_data.diagnosis,
        icd_code=report_data.icd_code,
        special_stains=report_data.special_stains,
        immunohistochemistry=report_data.immunohistochemistry,
        comments=report_data.comments,
        created_by=created_by,
        status="draft"
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


@router.get("/", response_model=List[ReportResponse])
def get_reports(
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    invoice_no: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_histo_reports)
):
    """Get all reports with optional filters"""
    query = db.query(Report)

    if status:
        query = query.filter(Report.status == status)

    if report_type:
        query = query.filter(Report.report_type == report_type)

    if invoice_no:
        query = query.filter(Report.invoice_no.ilike(f"%{invoice_no}%"))

    reports = query.order_by(Report.id.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/pending", response_model=List[ReportResponse])
def get_pending_reports(
    db: Session = Depends(get_db_histo_reports)
):
    """Get reports pending verification"""
    reports = db.query(Report).filter(
        Report.status == "pending_verification"
    ).order_by(Report.created_at.desc()).all()

    return reports


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db_histo_reports)
):
    """Get a specific report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    return report


@router.get("/patient/{invoice_no}", response_model=List[ReportResponse])
def get_reports_by_patient(
    invoice_no: str,
    db: Session = Depends(get_db_histo_reports)
):
    """Get all reports for a patient"""
    reports = db.query(Report).filter(
        Report.invoice_no == invoice_no
    ).order_by(Report.created_at.desc()).all()

    return reports


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    report_data: ReportUpdate,
    updated_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_reports)
):
    """Update report (only allowed in draft status)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if report.status not in ["draft", "pending_verification"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit report in '{report.status}' status"
        )

    update_data = report_data.model_dump(exclude_unset=True)

    # Handle enum
    if "report_type" in update_data and update_data["report_type"]:
        update_data["report_type"] = update_data["report_type"].value

    for key, value in update_data.items():
        setattr(report, key, value)

    db.commit()
    db.refresh(report)

    return report


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db_histo_reports)
):
    """Delete a draft report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if report.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft reports"
        )

    db.delete(report)
    db.commit()

    return None


# ==================== WORKFLOW ENDPOINTS ====================

@router.post("/{report_id}/submit", response_model=ReportResponse)
def submit_report(
    report_id: int,
    submit_data: ReportSubmit,
    submitted_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_reports)
):
    """Submit report for verification"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "draft":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit report in '{report.status}' status"
        )

    # Validate required fields
    if not report.specimen or not report.diagnosis:
        raise HTTPException(
            status_code=400,
            detail="Specimen and Diagnosis are required to submit"
        )

    create_version_snapshot(db, report, submitted_by, "Submitted for verification")

    report.status = "pending_verification"
    db.commit()
    db.refresh(report)

    return report


@router.post("/{report_id}/verify", response_model=ReportResponse)
def verify_report(
    report_id: int,
    verify_data: ReportVerify,
    verified_by: int = 1,  # TODO: Get from auth (admin)
    db: Session = Depends(get_db_histo_reports)
):
    """Admin verifies the report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "pending_verification":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot verify report in '{report.status}' status"
        )

    create_version_snapshot(db, report, verified_by, "Verified by admin")

    report.status = "verified"
    report.verified_by = verified_by
    report.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(report)

    return report


@router.post("/{report_id}/reject", response_model=ReportResponse)
def reject_report(
    report_id: int,
    reject_data: ReportReject,
    rejected_by: int = 1,  # TODO: Get from auth (admin)
    db: Session = Depends(get_db_histo_reports)
):
    """Admin rejects the report back to draft"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "pending_verification":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject report in '{report.status}' status"
        )

    create_version_snapshot(db, report, rejected_by, f"Rejected: {reject_data.reason}")

    report.status = "draft"
    report.comments = f"[REJECTED] {reject_data.reason}\n\n{report.comments or ''}"
    db.commit()
    db.refresh(report)

    return report


@router.post("/{report_id}/sign", response_model=ReportResponse)
def sign_report(
    report_id: int,
    sign_data: ReportSign,
    signed_by: int = 1,  # TODO: Get from auth (doctor)
    db: Session = Depends(get_db_histo_reports)
):
    """Doctor signs the report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "verified":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot sign report in '{report.status}' status. Must be verified first."
        )

    # TODO: Verify signature password against user's signature certificate

    create_version_snapshot(db, report, signed_by, "Signed by doctor")

    report.status = "signed"
    report.signed_by = signed_by
    report.signed_at = datetime.utcnow()
    db.commit()
    db.refresh(report)

    return report


@router.post("/{report_id}/publish", response_model=ReportResponse)
def publish_report(
    report_id: int,
    published_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_reports)
):
    """Publish the signed report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "signed":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish report in '{report.status}' status. Must be signed first."
        )

    create_version_snapshot(db, report, published_by, "Published")

    report.status = "published"
    report.published_at = datetime.utcnow()
    db.commit()
    db.refresh(report)

    return report


@router.post("/{report_id}/amend", response_model=ReportResponse)
def amend_report(
    report_id: int,
    amend_data: ReportAmend,
    amended_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_reports)
):
    """Create an amendment to a published report"""
    original_report = db.query(Report).filter(Report.id == report_id).first()
    if not original_report:
        raise HTTPException(status_code=404, detail="Report not found")

    if original_report.status != "published":
        raise HTTPException(
            status_code=400,
            detail="Can only amend published reports"
        )

    # Create new report as amendment
    amended_report = Report(
        patient_id=original_report.patient_id,
        invoice_no=original_report.invoice_no,
        report_type=original_report.report_type,
        specimen=original_report.specimen,
        gross_examination=original_report.gross_examination,
        microscopic_examination=original_report.microscopic_examination,
        diagnosis=original_report.diagnosis,
        icd_code=original_report.icd_code,
        special_stains=original_report.special_stains,
        immunohistochemistry=original_report.immunohistochemistry,
        comments=original_report.comments,
        created_by=amended_by,
        status="draft",
        is_amended=True,
        amendment_reason=amend_data.reason,
        original_report_id=original_report.id
    )

    db.add(amended_report)
    db.commit()
    db.refresh(amended_report)

    return amended_report


# ==================== VERSION HISTORY ====================

@router.get("/{report_id}/versions", response_model=List[ReportVersionResponse])
def get_report_versions(
    report_id: int,
    db: Session = Depends(get_db_histo_reports)
):
    """Get version history for a report"""
    versions = db.query(ReportVersion).filter(
        ReportVersion.report_id == report_id
    ).order_by(ReportVersion.version_number.desc()).all()

    return versions
