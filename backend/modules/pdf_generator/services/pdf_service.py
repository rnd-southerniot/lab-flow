"""
PDF Generation Service
Uses WeasyPrint to generate PDF from HTML template
"""
import os
from pathlib import Path
from datetime import datetime
from typing import Optional
from jinja2 import Environment, FileSystemLoader
import qrcode
from io import BytesIO
import base64

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 data URI"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    base64_image = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{base64_image}"


def format_date(date_obj) -> str:
    """Format date to DD.MM.YYYY"""
    if date_obj:
        if isinstance(date_obj, str):
            return date_obj
        return date_obj.strftime("%d.%m.%Y")
    return ""


def render_report_html(
    # Patient info
    invoice_no: str,
    receive_date,
    reporting_date,
    patient_name: str,
    age: int,
    age_unit: str,
    sex: str,
    consultant_name: str,
    consultant_designation: str,
    investigation_type: str,
    clinical_information: str,

    # Report content
    specimen: str,
    gross_examination: str,
    microscopic_examination: str,
    diagnosis: str,
    special_stains: Optional[str] = None,
    immunohistochemistry: Optional[str] = None,
    comments: Optional[str] = None,

    # Doctor info
    doctor_name: Optional[str] = None,
    doctor_designation: Optional[str] = None,
    doctor_registration: Optional[str] = None,
    signature_image_url: Optional[str] = None,

    # Lab info (letterhead)
    lab_name: str = "PATHOLOGY LABORATORY",
    lab_address: str = "Address Line 1, City, Country",
    lab_phone: str = "+XX-XXXX-XXXXXX",
    lab_email: str = "lab@example.com",

    # Verification
    verification_code: Optional[str] = None,
    verification_url: Optional[str] = None,

    # Options
    is_preview: bool = False
) -> str:
    """Render the HTML template with data"""

    # Set up Jinja2 environment
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("histopathology_report.html")

    # Generate QR code if verification code provided
    qr_code_url = None
    if verification_code and verification_url:
        qr_data = f"{verification_url}/{verification_code}"
        qr_code_url = generate_qr_code(qr_data)

    # Render template
    html_content = template.render(
        # Patient info
        invoice_no=invoice_no,
        receive_date=format_date(receive_date),
        reporting_date=format_date(reporting_date),
        patient_name=patient_name,
        age=age,
        age_unit=age_unit,
        sex=sex,
        consultant_name=consultant_name,
        consultant_designation=consultant_designation,
        investigation_type=investigation_type,
        clinical_information=clinical_information or "",

        # Report content
        specimen=specimen,
        gross_examination=gross_examination,
        microscopic_examination=microscopic_examination,
        diagnosis=diagnosis,
        special_stains=special_stains,
        immunohistochemistry=immunohistochemistry,
        comments=comments,

        # Doctor info
        doctor_name=doctor_name,
        doctor_designation=doctor_designation,
        doctor_registration=doctor_registration,
        signature_image_url=signature_image_url,

        # Lab info
        lab_name=lab_name,
        lab_address=lab_address,
        lab_phone=lab_phone,
        lab_email=lab_email,

        # QR Code
        qr_code_url=qr_code_url,

        # Preview watermark
        is_preview=is_preview
    )

    return html_content


def generate_pdf(html_content: str) -> bytes:
    """Generate PDF from HTML content using WeasyPrint"""
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except ImportError:
        # Fallback: return HTML as bytes if WeasyPrint not installed
        raise ImportError(
            "WeasyPrint is not installed. "
            "Install it with: pip install weasyprint"
        )


def generate_report_pdf(
    patient_data: dict,
    report_data: dict,
    doctor_data: dict = None,
    lab_config: dict = None,
    verification_code: str = None,
    verification_url: str = None,
    is_preview: bool = False
) -> bytes:
    """
    Generate a complete PDF report

    Args:
        patient_data: Patient information dict
        report_data: Report content dict
        doctor_data: Doctor information dict (optional)
        lab_config: Lab letterhead configuration (optional)
        verification_code: QR code verification code (optional)
        verification_url: Base URL for verification (optional)
        is_preview: Add watermark for preview (default False)

    Returns:
        PDF file as bytes
    """
    # Default lab config
    default_lab = {
        "lab_name": "PATHOLOGY LABORATORY",
        "lab_address": "Address Line 1, City, Country",
        "lab_phone": "+XX-XXXX-XXXXXX",
        "lab_email": "lab@example.com"
    }
    lab = {**default_lab, **(lab_config or {})}

    # Default doctor data
    default_doctor = {
        "doctor_name": "",
        "doctor_designation": "",
        "doctor_registration": "",
        "signature_image_url": None
    }
    doctor = {**default_doctor, **(doctor_data or {})}

    # Render HTML
    html_content = render_report_html(
        # Patient
        invoice_no=patient_data.get("invoice_no", ""),
        receive_date=patient_data.get("receive_date"),
        reporting_date=patient_data.get("reporting_date"),
        patient_name=patient_data.get("patient_name", ""),
        age=patient_data.get("age", 0),
        age_unit=patient_data.get("age_unit", "years"),
        sex=patient_data.get("sex", ""),
        consultant_name=patient_data.get("consultant_name", ""),
        consultant_designation=patient_data.get("consultant_designation", ""),
        investigation_type=patient_data.get("investigation_type", "Histopathology"),
        clinical_information=patient_data.get("clinical_information", ""),

        # Report
        specimen=report_data.get("specimen", ""),
        gross_examination=report_data.get("gross_examination", ""),
        microscopic_examination=report_data.get("microscopic_examination", ""),
        diagnosis=report_data.get("diagnosis", ""),
        special_stains=report_data.get("special_stains"),
        immunohistochemistry=report_data.get("immunohistochemistry"),
        comments=report_data.get("comments"),

        # Doctor
        doctor_name=doctor.get("doctor_name"),
        doctor_designation=doctor.get("doctor_designation"),
        doctor_registration=doctor.get("doctor_registration"),
        signature_image_url=doctor.get("signature_image_url"),

        # Lab
        **lab,

        # Verification
        verification_code=verification_code,
        verification_url=verification_url,

        # Preview
        is_preview=is_preview
    )

    # Generate PDF
    return generate_pdf(html_content)
