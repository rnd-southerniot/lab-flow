"""
PDF Generator Module - Generate PDF reports
"""
from .routes.pdf import router as pdf_router

__all__ = ["pdf_router"]
