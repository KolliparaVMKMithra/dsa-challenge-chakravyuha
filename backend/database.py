import os
import time
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RUNNING_IN_DOCKER = os.path.exists('/.dockerenv')

DATABASE_URL_ENV = os.getenv("DATABASE_URL")
if DATABASE_URL_ENV and DATABASE_URL_ENV.strip():
    DATABASE_URL = DATABASE_URL_ENV
    IS_PRODUCTION = True
elif RUNNING_IN_DOCKER:
    DATABASE_URL = "postgresql://postgres:chakravyuha_secure_pass_123@db:5432/dsa_challenge"
    IS_PRODUCTION = True
else:
    DATABASE_URL = "sqlite:///./dsa_challenge.db"
    IS_PRODUCTION = False

FALLBACK_DATABASE_URL = "sqlite:///./dsa_challenge.db"

def init_postgres_db():
    """Attempts to connect to postgres server and create the database if it doesn't exist."""
    if not DATABASE_URL.startswith("postgresql"):
        return
    
    # Try to initialize the database by connecting to default 'postgres'
    max_retries = 10
    retry_interval = 2
    for attempt in range(1, max_retries + 1):
        try:
            base_url, db_name = DATABASE_URL.rsplit("/", 1)
            temp_url = f"{base_url}/postgres"
            
            logger.info(f"Checking/creating PostgreSQL database '{db_name}' (Attempt {attempt}/{max_retries})...")
            temp_engine = create_engine(temp_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
                exists = result.scalar()
                
                if not exists:
                    logger.info(f"Database '{db_name}' does not exist. Creating it...")
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    logger.info(f"Database '{db_name}' created successfully.")
                else:
                    logger.info(f"Database '{db_name}' already exists.")
            temp_engine.dispose()
            return # Success, we can exit the init loop
        except Exception as e:
            logger.warning(f"PostgreSQL database init attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_interval)
            else:
                logger.error("Failed to auto-create PostgreSQL database after maximum retries. Proceeding to connect directly.")

# Only initialize postgres if we are using PostgreSQL
if DATABASE_URL.startswith("postgresql"):
    init_postgres_db()

engine = None
connected = False

if DATABASE_URL.startswith("postgresql"):
    max_retries = 10
    retry_interval = 2
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to primary PostgreSQL database (Attempt {attempt}/{max_retries}): {DATABASE_URL}")
            engine = create_engine(DATABASE_URL)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to primary PostgreSQL database.")
            connected = True
            break
        except Exception as e:
            logger.warning(f"Connection attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_interval)
            else:
                last_exception = e
else:
    # SQLite logic
    try:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        connected = True
        logger.info(f"Successfully connected to local SQLite database: {DATABASE_URL}")
    except Exception as e:
        last_exception = e

if not connected:
    # In production, we do NOT fallback to SQLite to prevent silent data loss.
    if IS_PRODUCTION or DATABASE_URL.startswith("postgresql"):
        logger.critical(f"FATAL: Failed to connect to primary database. SQLite fallback is disabled for production PostgreSQL configurations to prevent data loss. Error: {last_exception}")
        raise last_exception
    else:
        logger.error(f"Failed to connect to primary database ({DATABASE_URL}): {last_exception}. Falling back to SQLite.")
        engine = create_engine(FALLBACK_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
