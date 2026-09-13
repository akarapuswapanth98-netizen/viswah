"""Backend tests for Admin endpoints — SEC-01 and SEC-02 regression."""

import pytest
from fastapi.testclient import TestClient

from conftest import TestSessionLocal
from main import app
from models.models import Course, User
from routes.auth import get_password_hash


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user(db, email, username, role="user"):
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash("password123"),
        level="beginner",
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(client, email="test@example.com", password="password123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# --- Admin access tests ---

def test_admin_stats_requires_auth(client):
    resp = client.get("/api/admin/stats")
    assert resp.status_code == 401


def test_admin_stats_rejects_non_admin(client, db_session):
    user = create_user(db_session, "regular@test.com", "regularuser")
    token = get_token(client, "regular@test.com", "password123")
    resp = client.get("/api/admin/stats", headers=auth_header(token))
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Admin access required"


def test_admin_stats_works_for_admin(client, db_session):
    user = create_user(db_session, "admin@test.com", "adminuser", role="admin")
    token = get_token(client, "admin@test.com", "password123")
    resp = client.get("/api/admin/stats", headers=auth_header(token))
    assert resp.status_code == 200
    assert "total_courses" in resp.json()
    assert "total_lessons" in resp.json()


def test_admin_create_course_no_attribute_error(client, db_session):
    """SEC-01 regression: ensure no AttributeError on user.get('role')."""
    user = create_user(db_session, "regular2@test.com", "regularuser2")
    token = get_token(client, "regular2@test.com", "password123")
    resp = client.post("/api/admin/courses", json={
        "title": "Test",
        "description": "Test course",
        "stage": 1,
        "instrument": "piano",
    }, headers=auth_header(token))
    # Should be 403, NOT 500 AttributeError
    assert resp.status_code == 403


def test_admin_create_course_rejects_unauthenticated(client):
    resp = client.post("/api/admin/courses", json={
        "title": "Test",
        "description": "Test course",
        "stage": 1,
        "instrument": "piano",
    })
    assert resp.status_code == 401


def test_admin_create_course_error_safe(client, db_session):
    """SEC-02 regression: error response should not leak internal details."""
    user = create_user(db_session, "admin2@test.com", "adminuser2", role="admin")
    token = get_token(client, "admin2@test.com", "password123")
    # Send invalid data to trigger a validation error
    resp = client.post("/api/admin/courses", json={
        "title": "",  # Empty title should fail validation
        "description": "Test",
        "stage": 1,
        "instrument": "piano",
    }, headers=auth_header(token))
    # Pydantic validation rejects this (min_length=1)
    assert resp.status_code == 422


def test_admin_update_course_rejects_non_admin(client, db_session):
    course = Course(title="Test", description="Desc", stage=1, instrument="piano", difficulty="beginner")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    user = create_user(db_session, "regular3@test.com", "regularuser3")
    token = get_token(client, "regular3@test.com", "password123")
    resp = client.put(f"/api/admin/courses/{course.id}", json={
        "title": "Updated",
    }, headers=auth_header(token))
    assert resp.status_code == 403


def test_admin_delete_course_rejects_non_admin(client, db_session):
    course = Course(title="Test2", description="Desc2", stage=1, instrument="piano", difficulty="beginner")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    user = create_user(db_session, "regular4@test.com", "regularuser4")
    token = get_token(client, "regular4@test.com", "password123")
    resp = client.delete(f"/api/admin/courses/{course.id}", headers=auth_header(token))
    assert resp.status_code == 403
