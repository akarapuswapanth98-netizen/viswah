# Database Connection

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Normalize postgres:// → postgresql:// for SQLAlchemy + psycopg2 compatibility (e.g., Railway/Heroku)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Use in-memory SQLite for Vercel (ephemeral filesystem)
if not DATABASE_URL or DATABASE_URL == "sqlite:///./viswah.db":
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:///:memory:"
    else:
        DATABASE_URL = "sqlite:///./viswah.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()