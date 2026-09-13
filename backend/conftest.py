"""Shared test database infrastructure for VISWAH backend tests.

Creates a single in-memory SQLite engine with StaticPool so all
test modules share one database. The autouse fixture manages
table creation/drops per test and wires/unwires the FastAPI
dependency override so test modules cannot interfere with each other.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only-not-production")

from database import Base, get_db
from main import app

# ── Single shared test engine ──────────────────────────────────
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=TEST_ENGINE
)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Autouse fixture: table lifecycle + dependency override ──────
@pytest.fixture(autouse=True)
def _setup_test_db():
    """Per-test: create all tables, wire the dependency, yield, drop all tables."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)
    app.dependency_overrides.pop(get_db, None)
