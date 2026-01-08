"""
Patients Module - Patient registration and management
"""
from .routes.patients import router as patients_router
from .models.patient import Patient, ReferringDoctor

__all__ = ["patients_router", "Patient", "ReferringDoctor"]
