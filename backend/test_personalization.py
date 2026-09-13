"""Tests for Personalization Engine and API routes."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from conftest import TestSessionLocal
from main import app
from models.models import Achievement, PracticeSession, Progress, User, UserCourse, Course, Lesson
from routes.auth import get_password_hash


def create_user(db, email="test@example.com", username="testuser"):
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash("password123"),
        level="beginner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(client, email="test@example.com"):
    resp = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    return resp.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def create_session(db, user_id, activity, activity_id=None, score=None, duration_seconds=300, days_ago=0):
    session = PracticeSession(
        user_id=user_id,
        activity=activity,
        activity_id=activity_id,
        duration_seconds=duration_seconds,
        score=score,
        completed=True,
        created_at=datetime.now(UTC) - timedelta(days=days_ago),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def seed_courses(db):
    """Seed courses and lessons for testing."""
    course = Course(
        title="Music Fundamentals",
        description="Learn the basics",
        stage=1,
        instrument="piano",
        difficulty="beginner",
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    lesson = Lesson(
        course_id=course.id,
        title="Introduction to Music",
        content="Content here",
        order=1,
        lesson_type="theory",
        duration_minutes=10,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return course, lesson


# ── Personalization Engine Unit Tests ──


class TestPersonalizationEngine:
    def test_skill_map_empty_data(self):
        """New user with no data gets skill map with insufficient_data for all skills."""
        from services.personalization_engine import compute_skill_score, SKILL_DEFINITIONS

        db = TestSessionLocal()
        try:
            for skill_id in SKILL_DEFINITIONS:
                result = compute_skill_score(db, 999, skill_id, {}, [])
                assert result["id"] == skill_id
                assert result["score"] is None
                assert result["trend"] == "insufficient_data"
                assert result["insufficient_data_message"] is not None
        finally:
            db.close()

    def test_skill_map_with_practice_data(self):
        """User with practice sessions gets measurable skill scores."""
        from services.personalization_engine import compute_skill_score

        db = TestSessionLocal()
        try:
            user = create_user(db)
            create_session(db, user.id, "vocal_guru", "pitch_exercise", score=75, days_ago=2)
            create_session(db, user.id, "vocal_guru", "pitch_exercise", score=80, days_ago=1)
            create_session(db, user.id, "vocal_guru", "pitch_exercise", score=85, days_ago=0)

            activity_stats = {"vocal_guru": 3}
            topic_stats = [{
                "topic": "vocal_guru:pitch_exercise",
                "sessions": 3,
                "average_score": 80.0,
                "trend": "improving",
            }]

            result = compute_skill_score(db, user.id, "pitch", activity_stats, topic_stats)
            assert result["id"] == "pitch"
            assert result["score"] == 80.0
            assert result["trend"] == "improving"
            assert result["sessions"] == 3
            assert result["insufficient_data_message"] is None
        finally:
            db.close()

    def test_coaching_state_beginner(self):
        """User with 0 sessions is classified as beginner."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(0, 0, None, None) == "beginner"

    def test_coaching_state_building_consistency(self):
        """User with <5 sessions is building consistency."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(3, 2, 60.0, 65.0) == "building_consistency"

    def test_coaching_state_improving(self):
        """User with avg >= 70 and recent < 80 is improving."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(10, 5, 75.0, 75.0) == "improving"

    def test_coaching_state_strong_progress(self):
        """User with recent >= 80 is strong_progress."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(10, 5, 75.0, 85.0) == "strong_progress"

    def test_coaching_state_needs_focus(self):
        """User with recent < 60 needs focus."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(10, 5, 65.0, 50.0) == "needs_focus"

    def test_coaching_state_returning_after_gap(self):
        """User with streak=0 and sessions > 3 is returning."""
        from services.personalization_engine import classify_learner_state
        assert classify_learner_state(5, 0, 65.0, 60.0) == "returning_after_gap"

    def test_insufficient_data_message(self):
        """Insufficient data message is helpful."""
        from services.personalization_engine import _get_insufficient_message
        msg = _get_insufficient_message("pitch", 0)
        assert "Vocal Guru" in msg or "Speech Analysis" in msg
        assert len(msg) > 10


# ── Personalization API Route Tests ──


class TestPersonalizationRoutes:
    def test_summary_unauthorized(self):
        """Summary requires authentication."""
        client = TestClient(app)
        resp = client.get("/api/personalization/summary")
        assert resp.status_code == 401

    def test_summary_empty_user(self):
        """Summary for new user shows insufficient data."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/summary", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["coaching_state"] == "beginner"
        assert data["total_sessions"] == 0
        assert data["skill_map"] is not None
        assert len(data["skill_map"]) == 10
        assert data["daily_mission"] is not None
        assert data["daily_mission"]["title"] is not None

    def test_skill_map_with_data(self):
        """Skill map reflects actual practice data."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            create_session(db, user.id, "piano", "c_major_scale", score=80, days_ago=2)
            create_session(db, user.id, "piano", "c_major_scale", score=85, days_ago=1)
            create_session(db, user.id, "drums", "basic_beat", score=70, days_ago=0)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/skill-map", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        skill_map = data["skill_map"]
        assert len(skill_map) == 10

        melody_skill = next(s for s in skill_map if s["id"] == "melody")
        assert melody_skill["score"] is not None
        assert melody_skill["sessions"] >= 2

        rhythm_skill = next(s for s in skill_map if s["id"] == "rhythm")
        assert rhythm_skill["score"] is not None

    def test_recommendations_empty_user(self):
        """New user gets start_practice recommendation."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/recommendations", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "recommendations" in data

    def test_mission_always_returns(self):
        """Daily mission always returns a mission."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/mission", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "mission" in data
        assert data["mission"]["title"] is not None
        assert data["mission"]["route"] is not None

    def test_streak_empty_user(self):
        """Streak for new user is all zeros."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/streak", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0
        assert data["total_sessions"] == 0
        assert data["total_minutes"] == 0

    def test_streak_with_sessions(self):
        """Streak computes correctly with practice sessions."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            create_session(db, user.id, "piano", days_ago=0)
            create_session(db, user.id, "piano", days_ago=1)
            create_session(db, user.id, "piano", days_ago=2)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/streak", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_streak"] == 3
        assert data["total_sessions"] == 3
        assert data["total_minutes"] > 0

    def test_user_isolation(self):
        """Users cannot see each other's personalization data."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user1 = create_user(db, "user1@test.com", "user1")
            user2 = create_user(db, "user2@test.com", "user2")
            create_session(db, user1.id, "piano", score=90, days_ago=0)
            token1 = get_token(client, "user1@test.com")
            token2 = get_token(client, "user2@test.com")
        finally:
            db.close()

        resp1 = client.get("/api/personalization/summary", headers=auth_header(token1))
        resp2 = client.get("/api/personalization/summary", headers=auth_header(token2))

        data1 = resp1.json()
        data2 = resp2.json()

        assert data1["total_sessions"] == 1
        assert data2["total_sessions"] == 0

    def test_summary_includes_recommendations(self):
        """Summary includes recommendations when data exists."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            create_session(db, user.id, "piano", "c_major_scale", score=50, days_ago=0)
            token = get_token(client)
        finally:
            db.close()

        resp = client.get("/api/personalization/summary", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        assert len(data["recommendations"]) > 0

    def test_mission_deterministic(self):
        """Same user gets same mission on same day."""
        client = TestClient(app)
        db = TestSessionLocal()
        try:
            user = create_user(db)
            token = get_token(client)
        finally:
            db.close()

        resp1 = client.get("/api/personalization/mission", headers=auth_header(token))
        resp2 = client.get("/api/personalization/mission", headers=auth_header(token))
        assert resp1.json()["mission"]["title"] == resp2.json()["mission"]["title"]
