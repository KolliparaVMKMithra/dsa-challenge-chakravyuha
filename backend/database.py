import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL_ENV = os.getenv("DATABASE_URL")
if DATABASE_URL_ENV:
    DATABASE_URL = DATABASE_URL_ENV
    IS_PRODUCTION = True
else:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/dsa_challenge"
    IS_PRODUCTION = False

FALLBACK_DATABASE_URL = "sqlite:///./dsa_challenge.db"

def init_postgres_db():
    """Attempts to connect to postgres server and create the database if it doesn't exist."""
    # Only run this if we are using PostgreSQL
    if not DATABASE_URL.startswith("postgresql"):
        return
    
    # Parse base connection string (connecting to default 'postgres' database)
    try:
        # e.g., postgresql://postgres:postgres@localhost:5432/dsa_challenge -> postgresql://postgres:postgres@localhost:5432/postgres
        base_url, db_name = DATABASE_URL.rsplit("/", 1)
        temp_url = f"{base_url}/postgres"
        
        # Connect to 'postgres' to check / create our database
        temp_engine = create_engine(temp_url, isolation_level="AUTOCOMMIT")
        with temp_engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
            exists = result.scalar()
            
            if not exists:
                logger.info(f"Database '{db_name}' does not exist. Creating it...")
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                logger.info(f"Database '{db_name}' created successfully.")
            else:
                logger.info(f"Database '{db_name}' already exists.")
        temp_engine.dispose()
    except Exception as e:
        logger.error(f"Failed to auto-create PostgreSQL database: {e}. Moving on, connection might still succeed or fall back.")

# Try to initialize postgres database
init_postgres_db()

try:
    logger.info(f"Connecting to primary database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Successfully connected to primary database.")
except Exception as e:
    if IS_PRODUCTION or DATABASE_URL.startswith("postgresql://") and DATABASE_URL != "postgresql://postgres:postgres@localhost:5432/dsa_challenge":
        logger.error(f"Failed to connect to primary database ({DATABASE_URL}): {e}. SQLite fallback is disabled for production PostgreSQL configurations.")
        raise e
    logger.error(f"Failed to connect to primary database ({DATABASE_URL}): {e}. Falling back to SQLite.")
    engine = create_engine(FALLBACK_DATABASE_URL, connect_args={"check_same_thread": False} if FALLBACK_DATABASE_URL.startswith("sqlite") else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
