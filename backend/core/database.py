from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from .config import settings
from enum import Enum
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseType(Enum):
    """Database type enum for multi-database architecture"""
    USERS = "users"
    ORDERS = "orders"
    CLIENTS = "clients"
    USERS_IMPLEMENTATION ="users-implementation"
    END_DEVICE ="end-device"
    GATEWAY = "gateway"
    # Histo-Cyto databases
    HISTO_USERS = "histo-users"
    HISTO_PATIENTS = "histo-patients"
    HISTO_REPORTS = "histo-reports"
    HISTO_SIGNATURES = "histo-signatures"


def create_db_engine(url: str):
    """Create database engine with appropriate settings based on URL type"""
    if url.startswith("sqlite"):
        # SQLite doesn't support connection pooling the same way
        return create_engine(url, connect_args={"check_same_thread": False})
    else:
        # PostgreSQL with connection pooling
        pool_settings = {
            "pool_pre_ping": True,
            "pool_size": 25,
            "max_overflow": 25,
            "pool_recycle": 1800,
            "pool_timeout": 60,
            "echo_pool": False,
            "pool_use_lifo": True,
        }
        return create_engine(url, **pool_settings)


# Create engines for each database
engines = {
    DatabaseType.USERS: create_db_engine(settings.DATABASE_URL_USERS),
    DatabaseType.ORDERS: create_db_engine(settings.DATABASE_URL_ORDERS),
    DatabaseType.CLIENTS: create_db_engine(settings.DATABASE_URL_CLIENTS),
    DatabaseType.USERS_IMPLEMENTATION: create_db_engine(settings.DATABASE_URL_USERS_IMPLEMENTATION),
    DatabaseType.END_DEVICE: create_db_engine(settings.DATABASE_URL_END_DEVICE),
    DatabaseType.GATEWAY: create_db_engine(settings.DATABASE_URL_GATEWAY),
}

# Histo-Cyto database engines (created conditionally to avoid errors when not using histo system)
try:
    histo_engines = {
        DatabaseType.HISTO_USERS: create_db_engine(settings.DATABASE_URL_HISTO_USERS),
        DatabaseType.HISTO_PATIENTS: create_db_engine(settings.DATABASE_URL_HISTO_PATIENTS),
        DatabaseType.HISTO_REPORTS: create_db_engine(settings.DATABASE_URL_HISTO_REPORTS),
        DatabaseType.HISTO_SIGNATURES: create_db_engine(settings.DATABASE_URL_HISTO_SIGNATURES),
    }
    engines.update(histo_engines)
except Exception as e:
    logger.warning(f"Histo-Cyto databases not configured: {e}")

# Create SessionLocal classes for each database

SessionLocalUsers = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.USERS])
SessionLocalOrders = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.ORDERS])
SessionLocalClients = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.CLIENTS])

SessionLocalUsersImplementation = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.USERS_IMPLEMENTATION])
SessionLocalEndDevice = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.END_DEVICE])
SessionLocalGateway = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.GATEWAY])

# Histo-Cyto SessionLocal classes (created conditionally)
SessionLocalHistoUsers = None
SessionLocalHistoPatients = None
SessionLocalHistoReports = None
SessionLocalHistoSignatures = None

if DatabaseType.HISTO_USERS in engines:
    SessionLocalHistoUsers = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.HISTO_USERS])
    SessionLocalHistoPatients = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.HISTO_PATIENTS])
    SessionLocalHistoReports = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.HISTO_REPORTS])
    SessionLocalHistoSignatures = sessionmaker(autocommit=False, autoflush=False, bind=engines[DatabaseType.HISTO_SIGNATURES])


# Create separate Base classes for each database

BaseUsers = declarative_base()
BaseOrders = declarative_base()
BaseClients = declarative_base()
BaseUsersImplementation = declarative_base()
BaseEndDevice = declarative_base()
BaseGateway = declarative_base()

# Histo-Cyto Base classes
BaseHistoUsers = declarative_base()
BaseHistoPatients = declarative_base()
BaseHistoReports = declarative_base()
BaseHistoSignatures = declarative_base()


# Legacy aliases for backward compatibility
engine = engines[DatabaseType.USERS]


Base = BaseUsers



def get_db_users():
    """Get database session for users DB"""
    db = SessionLocalUsers()
    try:
        yield db
    finally:
        db.close()

def get_db_clients():
    """Get database session for clients DB"""
    db = SessionLocalClients()
    try:
        yield db
    finally:
        db.close()

def get_db_orders():
    """Get database session for orders DB"""
    db = SessionLocalOrders()
    try:
        yield db
    finally:
        db.close()

def get_db_users_implementation():
    """Get database session for orders DB"""
    db = SessionLocalUsersImplementation()
    try:
        yield db
    finally:
        db.close()


def get_db_end_device():
    """Get database session for orders DB"""
    db = SessionLocalEndDevice()
    try:
        yield db
    finally:
        db.close()

def get_db_gateway():
    """Get database session for gateway DB"""
    db = SessionLocalGateway()
    try:
        yield db
    finally:
        db.close()


# Histo-Cyto database dependency injection functions
def get_db_histo_users():
    """Get database session for histo users DB"""
    if SessionLocalHistoUsers is None:
        raise RuntimeError("Histo-Cyto databases not configured")
    db = SessionLocalHistoUsers()
    try:
        yield db
    finally:
        db.close()

def get_db_histo_patients():
    """Get database session for histo patients DB"""
    if SessionLocalHistoPatients is None:
        raise RuntimeError("Histo-Cyto databases not configured")
    db = SessionLocalHistoPatients()
    try:
        yield db
    finally:
        db.close()

def get_db_histo_reports():
    """Get database session for histo reports DB"""
    if SessionLocalHistoReports is None:
        raise RuntimeError("Histo-Cyto databases not configured")
    db = SessionLocalHistoReports()
    try:
        yield db
    finally:
        db.close()

def get_db_histo_signatures():
    """Get database session for histo signatures DB"""
    if SessionLocalHistoSignatures is None:
        raise RuntimeError("Histo-Cyto databases not configured")
    db = SessionLocalHistoSignatures()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize all databases - create all tables"""
    max_retries = 5
    retry_interval = 5

    databases = []

    # Add Histo-Cyto databases FIRST if configured (important for shared database scenarios)
    if DatabaseType.HISTO_USERS in engines:
        databases.extend([
            (DatabaseType.HISTO_USERS, BaseHistoUsers, "Histo-Users"),
            (DatabaseType.HISTO_PATIENTS, BaseHistoPatients, "Histo-Patients"),
            (DatabaseType.HISTO_REPORTS, BaseHistoReports, "Histo-Reports"),
            (DatabaseType.HISTO_SIGNATURES, BaseHistoSignatures, "Histo-Signatures"),
        ])

    # Add other databases after Histo databases
    databases.extend([
        (DatabaseType.USERS, BaseUsers, "Users"),
        (DatabaseType.CLIENTS, BaseClients, "Clients"),
        (DatabaseType.ORDERS, BaseOrders, "Orders"),
        (DatabaseType.USERS_IMPLEMENTATION, BaseUsersImplementation, "Users_implementation"),
        (DatabaseType.END_DEVICE, BaseEndDevice, "End-device"),
        (DatabaseType.GATEWAY, BaseGateway, "Gateway"),
    ])

    for db_type, base_class, db_name in databases:
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to {db_name} database (attempt {attempt + 1}/{max_retries})...")
                base_class.metadata.create_all(bind=engines[db_type])
                logger.info(f"{db_name} database tables created successfully!")
                break
            except OperationalError as e:
                if attempt < max_retries - 1:
                    logger.warning(f"{db_name} DB connection failed: {e}. Retrying in {retry_interval}s...")
                    time.sleep(retry_interval)
                else:
                    logger.error(f"Failed to connect to {db_name} database after {max_retries} attempts")
                    raise

    return True
