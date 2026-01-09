"""
Voice transcription schemas for report dictation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ReportFieldType(str, Enum):
    """Valid report fields for voice transcription"""
    SPECIMEN = "specimen"
    GROSS_EXAMINATION = "gross_examination"
    MICROSCOPIC_EXAMINATION = "microscopic_examination"
    DIAGNOSIS = "diagnosis"
    SPECIAL_STAINS = "special_stains"
    IMMUNOHISTOCHEMISTRY = "immunohistochemistry"
    COMMENTS = "comments"


class TranscriptionResponse(BaseModel):
    """Response after transcription and optional enhancement"""
    raw_transcription: str
    enhanced_text: Optional[str] = None
    field_type: str
    was_enhanced: bool = False


class TextEnhanceRequest(BaseModel):
    """Request to enhance existing text"""
    text: str = Field(..., min_length=1)
    field_type: ReportFieldType
    context: Optional[str] = None


class TextEnhanceResponse(BaseModel):
    """Response with enhanced text"""
    original_text: str
    enhanced_text: str
    field_type: str
    corrections_made: List[str] = []
