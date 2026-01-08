"""
Patient Routes - CRUD operations and verification workflow
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime

from core.database import get_db_histo_patients
from ..models.patient import Patient, ReferringDoctor
from ..schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse,
    PatientVerify, PatientReject,
    ReferringDoctorCreate, ReferringDoctorUpdate, ReferringDoctorResponse,
    VerificationStatus
)

router = APIRouter()


def generate_invoice_no(db: Session) -> str:
    """Generate unique Invoice No: INV-YYYY-XXXX"""
    year = datetime.now().year
    prefix = f"INV-{year}-"

    # Get the last invoice number for this year
    result = db.execute(
        text("SELECT invoice_no FROM patients WHERE invoice_no LIKE :pattern ORDER BY id DESC LIMIT 1"),
        {"pattern": f"{prefix}%"}
    ).fetchone()

    if result:
        try:
            last_number = int(result[0].split("-")[-1])
            new_number = last_number + 1
        except:
            new_number = 1
    else:
        new_number = 1

    return f"{prefix}{new_number:04d}"


# ==================== PATIENT ENDPOINTS ====================

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    created_by: int = 1,  # TODO: Get from auth
    db: Session = Depends(get_db_histo_patients)
):
    """Register a new patient"""
    invoice_no = generate_invoice_no(db)

    new_patient = Patient(
        invoice_no=invoice_no,
        receive_date=patient_data.receive_date,
        reporting_date=patient_data.reporting_date,
        patient_name=patient_data.patient_name,
        age=patient_data.age,
        age_unit=patient_data.age_unit,
        sex=patient_data.sex.value,
        consultant_name=patient_data.consultant_name,
        consultant_designation=patient_data.consultant_designation,
        investigation_type=patient_data.investigation_type.value,
        clinical_information=patient_data.clinical_information,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        created_by=created_by,
        verification_status="pending"
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient


@router.get("/", response_model=List[PatientResponse])
def get_patients(
    verification_status: Optional[str] = None,
    investigation_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_histo_patients)
):
    """Get all patients with optional filters"""
    query = db.query(Patient)

    if verification_status:
        query = query.filter(Patient.verification_status == verification_status)

    if investigation_type:
        query = query.filter(Patient.investigation_type == investigation_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Patient.patient_name.ilike(search_term)) |
            (Patient.invoice_no.ilike(search_term)) |
            (Patient.consultant_name.ilike(search_term))
        )

    patients = query.order_by(Patient.id.desc()).offset(skip).limit(limit).all()
    return patients


@router.get("/pending-verification", response_model=List[PatientResponse])
def get_pending_verification(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_histo_patients)
):
    """Get patients pending admin verification"""
    patients = db.query(Patient).filter(
        Patient.verification_status == "pending"
    ).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db_histo_patients)
):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient


@router.get("/invoice/{invoice_no}", response_model=PatientResponse)
def get_patient_by_invoice(
    invoice_no: str,
    db: Session = Depends(get_db_histo_patients)
):
    """Get a patient by invoice number"""
    patient = db.query(Patient).filter(Patient.invoice_no == invoice_no).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db_histo_patients)
):
    """Update patient information"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    update_data = patient_data.model_dump(exclude_unset=True)

    # Handle enums
    if "sex" in update_data and update_data["sex"]:
        update_data["sex"] = update_data["sex"].value
    if "investigation_type" in update_data and update_data["investigation_type"]:
        update_data["investigation_type"] = update_data["investigation_type"].value

    for key, value in update_data.items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db_histo_patients)
):
    """Delete a patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    db.delete(patient)
    db.commit()

    return None


# ==================== VERIFICATION ENDPOINTS ====================

@router.post("/{patient_id}/verify", response_model=PatientResponse)
def verify_patient(
    patient_id: int,
    verification_data: PatientVerify,
    verified_by: int = 1,  # TODO: Get from auth (admin user)
    db: Session = Depends(get_db_histo_patients)
):
    """Admin verifies patient details"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    if patient.verification_status == "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient is already verified"
        )

    patient.verification_status = "verified"
    patient.verified_by = verified_by
    patient.verified_at = datetime.utcnow()
    patient.verification_notes = verification_data.notes

    db.commit()
    db.refresh(patient)

    return patient


@router.post("/{patient_id}/reject", response_model=PatientResponse)
def reject_patient(
    patient_id: int,
    rejection_data: PatientReject,
    verified_by: int = 1,  # TODO: Get from auth (admin user)
    db: Session = Depends(get_db_histo_patients)
):
    """Admin rejects patient details with notes"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    patient.verification_status = "rejected"
    patient.verified_by = verified_by
    patient.verified_at = datetime.utcnow()
    patient.verification_notes = rejection_data.notes

    db.commit()
    db.refresh(patient)

    return patient


# ==================== REFERRING DOCTOR ENDPOINTS ====================

@router.post("/referring-doctors/", response_model=ReferringDoctorResponse, status_code=status.HTTP_201_CREATED)
def create_referring_doctor(
    doctor_data: ReferringDoctorCreate,
    db: Session = Depends(get_db_histo_patients)
):
    """Add a new referring doctor"""
    new_doctor = ReferringDoctor(
        name=doctor_data.name,
        designation=doctor_data.designation,
        hospital=doctor_data.hospital,
        phone=doctor_data.phone,
        email=doctor_data.email
    )

    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return new_doctor


@router.get("/referring-doctors/", response_model=List[ReferringDoctorResponse])
def get_referring_doctors(
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db_histo_patients)
):
    """Get all referring doctors"""
    query = db.query(ReferringDoctor)
    if is_active is not None:
        query = query.filter(ReferringDoctor.is_active == is_active)

    return query.order_by(ReferringDoctor.name).all()


@router.put("/referring-doctors/{doctor_id}", response_model=ReferringDoctorResponse)
def update_referring_doctor(
    doctor_id: int,
    doctor_data: ReferringDoctorUpdate,
    db: Session = Depends(get_db_histo_patients)
):
    """Update a referring doctor"""
    doctor = db.query(ReferringDoctor).filter(ReferringDoctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referring doctor not found"
        )

    update_data = doctor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doctor, key, value)

    db.commit()
    db.refresh(doctor)

    return doctor


@router.delete("/referring-doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_referring_doctor(
    doctor_id: int,
    db: Session = Depends(get_db_histo_patients)
):
    """Delete a referring doctor (soft delete)"""
    doctor = db.query(ReferringDoctor).filter(ReferringDoctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referring doctor not found"
        )

    doctor.is_active = False
    db.commit()

    return None
