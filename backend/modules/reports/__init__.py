"""
Reports Module - Lab reports management and workflow
"""
from .routes.reports import router as reports_router
from .models.report import Report, ReportVersion, AIChatHistory

__all__ = ["reports_router", "Report", "ReportVersion", "AIChatHistory"]
