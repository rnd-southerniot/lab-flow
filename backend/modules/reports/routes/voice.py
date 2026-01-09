"""
Voice transcription routes for report dictation
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional

from ..schemas.voice import (
    ReportFieldType,
    TranscriptionResponse,
    TextEnhanceRequest,
    TextEnhanceResponse
)
from ..services.voice_service import voice_service

router = APIRouter()

# Supported audio formats by Whisper API
ALLOWED_AUDIO_TYPES = {
    "audio/webm", "audio/mp3", "audio/mpeg", "audio/wav",
    "audio/ogg", "audio/flac", "audio/m4a", "audio/mp4"
}
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB (Whisper limit)


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file (webm, mp3, wav, etc.)"),
    field_type: ReportFieldType = Form(...),
    enhance: bool = Form(True),
    existing_text: Optional[str] = Form(None)
):
    """
    Transcribe audio to text using OpenAI Whisper API.
    Optionally enhance the text with GPT-4 for medical terminology.

    - **audio**: Audio file from browser MediaRecorder (typically webm)
    - **field_type**: Which report field this is for (affects enhancement)
    - **enhance**: Whether to AI-enhance the transcription (default: True)
    - **existing_text**: Existing text in field for context
    """
    if not voice_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription service not available. OpenAI API key not configured."
        )

    # Validate content type
    content_type = audio.content_type or ""
    if content_type not in ALLOWED_AUDIO_TYPES and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format: {content_type}. Supported: webm, mp3, wav, ogg, flac, m4a"
        )

    # Read audio data
    audio_data = await audio.read()

    # Validate size
    if len(audio_data) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large. Maximum size: {MAX_AUDIO_SIZE // 1024 // 1024}MB"
        )

    if len(audio_data) < 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio recording too short. Please record at least 1 second of audio."
        )

    try:
        # Step 1: Transcribe with Whisper
        raw_transcription = await voice_service.transcribe_audio(
            audio_data,
            audio.filename or "recording.webm"
        )

        if not raw_transcription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No speech detected in audio. Please try again."
            )

        # Step 2: Optionally enhance with GPT-4
        enhanced_text = None
        was_enhanced = False

        if enhance:
            context = existing_text if existing_text else None
            enhanced_text, _ = await voice_service.enhance_medical_text(
                raw_transcription,
                field_type.value,
                context
            )
            was_enhanced = True

        return TranscriptionResponse(
            raw_transcription=raw_transcription,
            enhanced_text=enhanced_text,
            field_type=field_type.value,
            was_enhanced=was_enhanced
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.post("/enhance-text", response_model=TextEnhanceResponse)
async def enhance_text(request: TextEnhanceRequest):
    """
    Enhance existing text using GPT-4 for medical terminology.
    Useful for enhancing manually typed text or re-enhancing transcriptions.

    - **text**: Text to enhance
    - **field_type**: Which report field this is for
    - **context**: Optional context (e.g., specimen description for diagnosis)
    """
    if not voice_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI enhancement service not available. OpenAI API key not configured."
        )

    try:
        enhanced_text, corrections = await voice_service.enhance_medical_text(
            request.text,
            request.field_type.value,
            request.context
        )

        return TextEnhanceResponse(
            original_text=request.text,
            enhanced_text=enhanced_text,
            field_type=request.field_type.value,
            corrections_made=corrections
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enhancement failed: {str(e)}"
        )


@router.get("/status")
async def voice_service_status():
    """Check if voice transcription service is available"""
    return {
        "available": voice_service.is_available(),
        "whisper_model": "whisper-1" if voice_service.is_available() else None,
        "enhancement_model": "gpt-4o" if voice_service.is_available() else None
    }
