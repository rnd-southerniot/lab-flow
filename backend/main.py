"""
Southern IOT System - Main Application Entry Point
Modular FastAPI Backend
"""
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core import settings, init_db, setup_logging
from core.database import SessionLocalUsers, SessionLocalUsersImplementation


# Import routers from modules (Importing here ensures models are registered before init_db)
from modules.auth import auth_router, auth_implementation_router
from modules.orders import orders_router
from modules.clients import clients_router
from modules.users import users_router

from modules.users_implementation import users_implementation_router
from modules.users_implementation.models.user_implementation import User as UserImplementation
from modules.end_device import end_device_router
# Import Telemetry models to register them with Base metadata for init_db
from modules.end_device.models.telemetry import Telemetry
from modules.gateway import gateway_router
from modules.gateway.models.telemetry import GatewayTelemetry

from modules.health import health_router

# Histo-Cyto Module Imports (conditionally loaded)
try:
    from modules.histo_auth import histo_auth_router
    from modules.histo_users import histo_users_router
    from modules.histo_users.models.user import HistoUser
    from modules.patients import patients_router
    from modules.patients.models.patient import Patient, ReferringDoctor
    from modules.reports import reports_router
    from modules.reports.models.report import Report, ReportVersion, AIChatHistory
    from modules.pdf_generator import pdf_router
    HISTO_CYTO_ENABLED = True
except ImportError as e:
    HISTO_CYTO_ENABLED = False
    histo_auth_router = None
    histo_users_router = None
    patients_router = None
    reports_router = None
    pdf_router = None

# Configure logging
logger = setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS - Allow all origins for internal ERP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}\n"
        f"Request: {request.method} {request.url}\n"
        f"Traceback: {traceback.format_exc()}"
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later.",
            "error_type": type(exc).__name__
        }
    )

@app.on_event("startup")
async def startup_event():
    """Initialize all databases on startup"""
    logger.info("Initializing all databases...")
    init_db()
    logger.info("All databases initialized successfully!")

    # Initialize sample data in users database
    db = SessionLocalUsers()
    db_implement = SessionLocalUsersImplementation()
    try:
        from init_data import init_admin_user
        init_admin_user(db)
        # For implementation users
        init_admin_user(db_implement, UserImplementation)
    finally:
        db.close()
        db_implement.close()

    # Initialize Histo-Cyto admin user
    if HISTO_CYTO_ENABLED:
        from core.database import SessionLocalHistoUsers
        from core.security import get_password_hash
        db_histo = SessionLocalHistoUsers()
        try:
            existing = db_histo.query(HistoUser).filter(HistoUser.username == "admin").first()
            if not existing:
                logger.info("Creating admin user for Histo-Cyto system...")
                admin = HistoUser(
                    email="admin@histocyto.com",
                    username="admin",
                    hashed_password=get_password_hash("admin"),
                    full_name="System Administrator",
                    role="admin",
                    is_active=True,
                    is_superuser=True
                )
                db_histo.add(admin)
                db_histo.commit()
                logger.info("Histo-Cyto admin user created successfully!")
            else:
                logger.info("Histo-Cyto admin user already exists")
        except Exception as e:
            logger.error(f"Error creating Histo-Cyto admin user: {e}")
            db_histo.rollback()
        finally:
            db_histo.close()

@app.get("/")
async def root():
    return {
        "message": "Welcome to Southern IOT Sales/Implementation Dashboard",
        "version": settings.VERSION,
        "docs": "/docs"
    }

# Register routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(auth_implementation_router, prefix=f"{settings.API_V1_STR}/auth_implementation", tags=["auth_implementation"])
app.include_router(orders_router, prefix=f"{settings.API_V1_STR}/orders", tags=["orders"])
app.include_router(clients_router, prefix=f"{settings.API_V1_STR}/clients", tags=["clients"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])

app.include_router(users_implementation_router, prefix=f"{settings.API_V1_STR}/users_implementation", tags=["users_implementation"])
app.include_router(end_device_router, prefix=f"{settings.API_V1_STR}/end_device", tags=["end_device"])
app.include_router(gateway_router, prefix=f"{settings.API_V1_STR}/gateway", tags=["gateway"])

app.include_router(health_router, prefix=f"{settings.API_V1_STR}", tags=["health"])

# Histo-Cyto Routes (conditionally registered)
if HISTO_CYTO_ENABLED:
    if histo_auth_router:
        app.include_router(histo_auth_router, prefix=f"{settings.API_V1_STR}/histo_auth", tags=["histo_auth"])
    if histo_users_router:
        app.include_router(histo_users_router, prefix=f"{settings.API_V1_STR}/histo_users", tags=["histo_users"])
    if patients_router:
        app.include_router(patients_router, prefix=f"{settings.API_V1_STR}/patients", tags=["patients"])
    if reports_router:
        app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
    if pdf_router:
        app.include_router(pdf_router, prefix=f"{settings.API_V1_STR}/pdf", tags=["pdf"])
    logger.info("Histo-Cyto modules registered successfully")
