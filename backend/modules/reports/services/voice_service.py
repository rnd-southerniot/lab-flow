"""
Voice transcription and AI enhancement service using OpenAI APIs
"""
import tempfile
import os
from typing import Optional, Tuple, List
from openai import OpenAI
from core.config import settings
import logging

logger = logging.getLogger(__name__)


class VoiceService:
    """Service for handling voice transcription and AI enhancement"""

    def __init__(self):
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def is_available(self) -> bool:
        """Check if OpenAI services are available"""
        return self.client is not None and bool(settings.OPENAI_API_KEY)

    async def transcribe_audio(self, audio_data: bytes, filename: str) -> str:
        """
        Transcribe audio using OpenAI Whisper API

        Args:
            audio_data: Raw audio bytes (webm, mp3, wav, etc.)
            filename: Original filename with extension

        Returns:
            Transcribed text
        """
        if not self.is_available():
            raise ValueError("OpenAI API key not configured")

        # Write to temp file (Whisper API requires file object)
        suffix = os.path.splitext(filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en",
                    response_format="text"
                )
            return transcript.strip()
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    async def enhance_medical_text(
        self,
        text: str,
        field_type: str,
        context: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """
        Enhance transcribed text using GPT-4 for medical terminology

        Args:
            text: Raw transcribed text
            field_type: Which report field this is for
            context: Additional context (e.g., specimen description)

        Returns:
            Tuple of (enhanced_text, list_of_corrections)
        """
        if not self.is_available():
            return text, []

        field_descriptions = {
            "specimen": "specimen description in a pathology report",
            "gross_examination": "gross/macroscopic examination findings",
            "microscopic_examination": "microscopic/histologic findings",
            "diagnosis": "pathological diagnosis",
            "special_stains": "special staining results",
            "immunohistochemistry": "immunohistochemistry (IHC) results",
            "comments": "clinical comments in a pathology report"
        }

        field_desc = field_descriptions.get(field_type, "medical report field")

        system_prompt = f"""You are a medical transcription assistant specializing in histopathology and cytopathology reports.
Your task is to enhance voice-transcribed text for a {field_desc}.

Rules:
1. Correct medical terminology spelling (e.g., "carsinoma" -> "carcinoma")
2. Add appropriate punctuation and capitalization
3. Format measurements properly (e.g., "5 by 3 cm" -> "5 x 3 cm")
4. Use standard pathology abbreviations appropriately
5. Maintain the original meaning - do not add or remove clinical information
6. Format lists and findings in a professional manner
7. If text mentions dimensions, ensure units are included

Return ONLY the enhanced text, nothing else."""

        user_prompt = f"Enhance this {field_desc} text:\n\n{text}"

        if context:
            user_prompt += f"\n\nContext (specimen description): {context}"

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            enhanced = response.choices[0].message.content.strip()

            corrections = []
            if enhanced.lower() != text.lower():
                corrections.append("Formatting and terminology corrections applied")

            return enhanced, corrections

        except Exception as e:
            logger.error(f"AI enhancement failed: {e}")
            return text, []


# Singleton instance
voice_service = VoiceService()
