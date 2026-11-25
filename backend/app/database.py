from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def migrate_submission_proof_images():
    inspector = inspect(engine)
    if not inspector.has_table("submissions"):
        return

    columns = {column["name"] for column in inspector.get_columns("submissions")}
    if "proof_image_url" not in columns or "proof_image_urls" in columns:
        return

    if engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE submissions RENAME COLUMN proof_image_url TO proof_image_urls"
            ))
            connection.execute(text("""
                ALTER TABLE submissions
                ALTER COLUMN proof_image_urls TYPE JSON
                USING CASE
                    WHEN proof_image_urls IS NULL OR proof_image_urls = 'qr_scan_verification' THEN '[]'::json
                    ELSE json_build_array(proof_image_urls)::json
                END
            """))
    elif engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE submissions ADD COLUMN proof_image_urls JSON"))
            connection.execute(text("""
                UPDATE submissions
                SET proof_image_urls = CASE
                    WHEN proof_image_url = 'qr_scan_verification' THEN '[]'
                    ELSE json_array(proof_image_url)
                END
            """))
    else:
        raise RuntimeError(f"Unsupported database migration dialect: {engine.dialect.name}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
