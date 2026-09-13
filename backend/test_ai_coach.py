"""Tests for AI Coach API endpoints."""

import pytest
from fastapi.testclient import TestClient

from conftest import TestSessionLocal
from main import app
from models.models import User, PracticeSession
from routes.auth import get_password_hash


def create_user(db, username="coachuser", email="coach@test.com"):
    user = User(username=username, email=email, hashed_password=get_password_hash("testpass123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(client, email="coach@test.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "testpass123"})
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_session(db, user_id, activity, activity_id=None, score=None, duration=300, completed=True):
    session = PracticeSession(
        user_id=user_id, activity=activity, activity_id=activity_id,
        duration_seconds=duration, score=score, completed=completed,
    )
    db.add(session)
    db.commit()
    return session


class TestAICoachAuth:
    def test_summary_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/ai-coach/summary")
        assert resp.status_code in [401, 403]

    def test_recommendation_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/ai-coach/recommendation")
        assert resp.status_code in [401, 403]

    def test_plan_requires_auth(self):
        client = TestClient(app)
        resp = client.post("/api/ai-coach/plan?duration_minutes=10")
        assert resp.status_code in [401, 403]

    def test_message_requires_auth(self):
        client = TestClient(app)
        resp = client.post("/api/ai-coach/message", json={"message": "hello"})
        assert resp.status_code in [401, 403]


class TestAICoachSummary:
    def test_empty_user_summary(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/ai-coach/summary", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_sessions"] == 0
        assert data["coaching_state"] == "beginner"
        assert "greeting" in data
        assert "skill_health" in data
        assert "today_plan" in data

    def test_summary_with_sessions(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db, "sessionuser", "session@test.com")
            token = get_token(client, "session@test.com")

            for i in range(5):
                create_session(db, user.id, "vocal_guru", "pitch_exercise", score=70 + i)
            for i in range(3):
                create_session(db, user.id, "piano", "c_major_scale", score=80 + i)
        finally:
            db.close()

        resp = client.get("/api/ai-coach/summary", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_sessions"] == 8
        assert data["coaching_state"] != "beginner"
        assert data["average_score"] is not None
        assert "pitch" in data["skill_health"]
        assert "melody" in data["skill_health"]

    def test_user_isolation(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user_a = create_user(db, "usera", "a@test.com")
            user_b = create_user(db, "userb", "b@test.com")
            token_a = get_token(client, "a@test.com")

            create_session(db, user_a.id, "piano", score=90)
            create_session(db, user_b.id, "drums", score=50)
        finally:
            db.close()

        resp = client.get("/api/ai-coach/summary", headers=auth_header(token_a))
        data = resp.json()
        assert data["total_sessions"] == 1


class TestAICoachRecommendation:
    def test_empty_user_recommendation(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/ai-coach/recommendation", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "start_practice"
        assert "route" in data

    def test_recommendation_with_data(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db, "recuser", "rec@test.com")
            token = get_token(client, "rec@test.com")

            for i in range(5):
                create_session(db, user.id, "vocal_guru", score=40 + i)
        finally:
            db.close()

        resp = client.get("/api/ai-coach/recommendation", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "type" in data
        assert "title" in data
        assert "route" in data


class TestAICoachPlan:
    def test_plan_default_duration(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/plan?duration_minutes=10", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["duration_minutes"] == 10
        assert data["total_steps"] > 0
        assert len(data["steps"]) > 0

    def test_plan_clamps_duration(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/plan?duration_minutes=1", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["duration_minutes"] >= 5

    def test_plan_with_high_duration(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/plan?duration_minutes=60", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["duration_minutes"] <= 30


class TestAICoachMessage:
    def test_empty_message_rejected(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": ""}, headers=auth_header(token))
        assert resp.status_code == 400

    def test_long_message_rejected(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": "x" * 501}, headers=auth_header(token))
        assert resp.status_code == 400

    def test_valid_message_returns_response(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": "What should I practice?"}, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "type" in data
        assert "response" in data
        assert len(data["response"]) > 0

    def test_practice_plan_message(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": "Give me a 10 minute practice plan"}, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "plan"
        assert "plan" in data

    def test_rhythm_question(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": "How can I improve my rhythm?"}, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data

    def test_pitch_question(self):
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.post("/api/ai-coach/message", json={"message": "How should I improve my pitch?"}, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
