"""
PDF Generation Routes
Generate and download PDF reports
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from typing import Optional
import hashlib
import uuid

from core.database import get_db_histo_reports, get_db_histo_patients, get_db_histo_users
from modules.reports.models.report import Report
from modules.patients.models.patient import Patient
from modules.histo_users.models.user import HistoUser
from ..services.pdf_service import generate_report_pdf

router = APIRouter()


def get_verification_code(report_id: int, invoice_no: str) -> str:
    """Generate a verification code for the report"""
    data = f"{report_id}-{invoice_no}-{uuid.uuid4()}"
    return hashlib.sha256(data.encode()).hexdigest()[:16].upper()


@router.get("/report/{report_id}")
def generate_pdf_report(
    report_id: int,
    db_reports: Session = Depends(get_db_histo_reports),
    db_patients: Session = Depends(get_db_histo_patients),
    db_users: Session = Depends(get_db_histo_users)
):
    """
    Generate PDF for a published/signed report
    """
    # Get report
    report = db_reports.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status not in ["signed", "published"]:
        raise HTTPException(
            status_code=400,
            detail="PDF can only be generated for signed or published reports"
        )

    # Get patient
    patient = db_patients.query(Patient).filter(
        Patient.invoice_no == report.invoice_no
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get doctor who signed
    doctor = None
    if report.signed_by:
        doctor = db_users.query(HistoUser).filter(
            HistoUser.id == report.signed_by
        ).first()

    # Prepare data
    patient_data = {
        "invoice_no": patient.invoice_no,
        "receive_date": patient.receive_date,
        "reporting_date": patient.reporting_date or report.published_at,
        "patient_name": patient.patient_name,
        "age": patient.age,
        "age_unit": patient.age_unit,
        "sex": patient.sex,
        "consultant_name": patient.consultant_name or "",
        "consultant_designation": patient.consultant_designation or "",
        "investigation_type": patient.investigation_type,
        "clinical_information": patient.clinical_information or ""
    }

    report_data = {
        "specimen": report.specimen or "",
        "gross_examination": report.gross_examination or "",
        "microscopic_examination": report.microscopic_examination or "",
        "diagnosis": report.diagnosis or "",
        "special_stains": report.special_stains,
        "immunohistochemistry": report.immunohistochemistry,
        "comments": report.comments
    }

    doctor_data = None
    if doctor:
        doctor_data = {
            "doctor_name": doctor.full_name or doctor.username,
            "doctor_designation": doctor.qualification or "",
            "doctor_registration": doctor.registration_number or "",
            "signature_image_url": doctor.signature_image_url
        }

    # Generate verification code
    verification_code = get_verification_code(report.id, report.invoice_no)

    # Generate PDF
    try:
        pdf_bytes = generate_report_pdf(
            patient_data=patient_data,
            report_data=report_data,
            doctor_data=doctor_data,
            verification_code=verification_code,
            verification_url="https://lab.example.com/verify",  # TODO: Configure this
            is_preview=False
        )
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    # Return PDF as download
    filename = f"Report_{report.invoice_no}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.get("/report/{report_id}/preview")
def preview_pdf_report(
    report_id: int,
    db_reports: Session = Depends(get_db_histo_reports),
    db_patients: Session = Depends(get_db_histo_patients),
    db_users: Session = Depends(get_db_histo_users)
):
    """
    Generate a preview PDF with watermark (any status)
    """
    # Get report
    report = db_reports.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Get patient
    patient = db_patients.query(Patient).filter(
        Patient.invoice_no == report.invoice_no
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get doctor (if available)
    doctor = None
    if report.created_by:
        doctor = db_users.query(HistoUser).filter(
            HistoUser.id == report.created_by
        ).first()

    # Prepare data
    patient_data = {
        "invoice_no": patient.invoice_no,
        "receive_date": patient.receive_date,
        "reporting_date": patient.reporting_date,
        "patient_name": patient.patient_name,
        "age": patient.age,
        "age_unit": patient.age_unit,
        "sex": patient.sex,
        "consultant_name": patient.consultant_name or "",
        "consultant_designation": patient.consultant_designation or "",
        "investigation_type": patient.investigation_type,
        "clinical_information": patient.clinical_information or ""
    }

    report_data = {
        "specimen": report.specimen or "",
        "gross_examination": report.gross_examination or "",
        "microscopic_examination": report.microscopic_examination or "",
        "diagnosis": report.diagnosis or "",
        "special_stains": report.special_stains,
        "immunohistochemistry": report.immunohistochemistry,
        "comments": report.comments
    }

    doctor_data = None
    if doctor:
        doctor_data = {
            "doctor_name": doctor.full_name or doctor.username,
            "doctor_designation": doctor.qualification or "",
            "doctor_registration": doctor.registration_number or "",
            "signature_image_url": None  # No signature in preview
        }

    # Generate PDF with preview watermark
    try:
        pdf_bytes = generate_report_pdf(
            patient_data=patient_data,
            report_data=report_data,
            doctor_data=doctor_data,
            is_preview=True  # Add watermark
        )
    except Exception as e:
        import traceback
        import logging
        logging.error(f"PDF generation error: {type(e).__name__}: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {type(e).__name__}: {str(e)}"
        )

    # Return PDF inline (not as download)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf"
    )


@router.get("/verify/{code}")
def verify_report(code: str):
    """
    Public endpoint to verify a report by QR code
    """
    # TODO: Implement verification lookup
    return {
        "code": code,
        "valid": True,
        "message": "Report verification endpoint. Implementation pending."
    }
