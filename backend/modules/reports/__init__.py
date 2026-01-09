"""
Reports Module - Lab reports management and workflow
"""
from .routes.reports import router as reports_router
from .routes.voice import router as voice_router
from .models.report import Report, ReportVersion, AIChatHistory

__all__ = ["reports_router", "voice_router", "Report", "ReportVersion", "AIChatHistory"]
