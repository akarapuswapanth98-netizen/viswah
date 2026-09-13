"""Tests for VISWAH Phase 12 — Leaderboard, Journey Map, Challenge Completion, Gamification Profile."""

import pytest
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from main import app
from database import Base, get_db
from models.models import Achievement, Course, Lesson, PracticeSession, Progress, User, UserCourse

from conftest import TEST_ENGINE, TestSessionLocal, override_get_db


def _create_user(db, username="testuser", email="test@example.com"):
    user = User(username=username, email=email, hashed_password="hashed")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_session(db, user_id, activity="piano", score=80.0, completed=True, days_ago=0, duration_seconds=300):
    session = PracticeSession(
        user_id=user_id,
        activity=activity,
        activity_id="test",
        duration_seconds=duration_seconds,
        score=score,
        completed=completed,
        created_at=datetime.now(UTC) - timedelta(days=days_ago),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _auth_header(user):
    from routes.auth import create_access_token
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


# ── Leaderboard Tests ─────────────────────────────────────────────


class TestLeaderboard:
    def test_empty_leaderboard(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "weekly_xp")
        assert lb["total_users"] >= 1
        assert lb["entries"][0]["is_current_user"] is True
        assert lb["entries"][0]["score"] == 0
        db.close()

    def test_leaderboard_weekly_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(5):
            _create_session(db, user.id, days_ago=0)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "weekly_xp")
        assert lb["leaderboard_type"] == "weekly_xp"
        assert lb["current_user_score"] > 0
        db.close()

    def test_leaderboard_monthly_practice(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, duration_seconds=600)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "monthly_practice")
        assert lb["leaderboard_type"] == "monthly_practice"
        assert lb["current_user_score"] >= 10  # 600s = 10 minutes
        db.close()

    def test_leaderboard_music_lab_score(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, activity="note_recognition", score=85.0)
        _create_session(db, user.id, activity="interval_training", score=90.0)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "music_lab_score")
        assert lb["leaderboard_type"] == "music_lab_score"
        assert lb["current_user_score"] == 87.5
        db.close()

    def test_leaderboard_consistency(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        _create_session(db, user.id, days_ago=1)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "consistency")
        assert lb["leaderboard_type"] == "consistency"
        assert lb["current_user_score"] >= 2
        db.close()

    def test_leaderboard_ranking(self):
        db = TestSessionLocal()
        user_a = _create_user(db, "userA", "a@test.com")
        user_b = _create_user(db, "userB", "b@test.com")
        for _ in range(10):
            _create_session(db, user_a.id, days_ago=0)
        _create_session(db, user_b.id, days_ago=0)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user_a.id, "weekly_xp")
        assert lb["entries"][0]["username"] == "userA"
        assert lb["entries"][0]["rank"] == 1
        db.close()

    def test_leaderboard_user_isolation(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_leaderboard
        lb = compute_leaderboard(db, user.id, "weekly_xp")
        entry = next(e for e in lb["entries"] if e["is_current_user"])
        assert entry["user_id"] == user.id
        db.close()

    def test_leaderboard_invalid_type_defaults(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/leaderboard?type=invalid_type", headers=_auth_header(user))
        assert resp.status_code == 200
        assert resp.json()["leaderboard_type"] == "weekly_xp"
        db.close()

    def test_leaderboard_route(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/leaderboard", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert "entries" in data
        assert "total_users" in data
        db.close()

    def test_leaderboard_route_type_param(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/leaderboard?type=consistency", headers=_auth_header(user))
        assert resp.status_code == 200
        assert resp.json()["leaderboard_type"] == "consistency"
        db.close()

    def test_leaderboard_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/progress/leaderboard")
        assert resp.status_code == 401


# ── Journey Map Tests ─────────────────────────────────────────────


class TestJourneyMap:
    def test_empty_user_beginner_stage(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        assert journey["current_stage"] == "beginner"
        assert journey["total_xp"] == 0
        assert len(journey["stages"]) == 6
        db.close()

    def test_journey_has_all_stages(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        stage_ids = [s["id"] for s in journey["stages"]]
        assert "beginner" in stage_ids
        assert "foundation" in stage_ids
        assert "skill_building" in stage_ids
        assert "specialization" in stage_ids
        assert "mastery" in stage_ids
        assert "maestro" in stage_ids
        db.close()

    def test_journey_first_practice_milestone(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id)
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        assert journey["milestones_met"]["first_practice"] is True
        db.close()

    def test_journey_piano_milestone(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, activity="piano")
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        assert journey["milestones_met"]["first_note"] is True
        db.close()

    def test_journey_progression_with_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(25):
            _create_session(db, user.id, score=95.0, days_ago=0)
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        assert journey["total_xp"] > 200
        beginner_stage = next(s for s in journey["stages"] if s["id"] == "beginner")
        assert beginner_stage["completed"] is True
        db.close()

    def test_journey_current_stage_progress(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_journey_map
        journey = compute_journey_map(db, user.id)
        current = next(s for s in journey["stages"] if s["current"])
        assert current["progress_percent"] >= 0
        db.close()

    def test_journey_route(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/journey", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert "stages" in data
        assert "current_stage" in data
        assert "milestones_met" in data
        db.close()

    def test_journey_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/progress/journey")
        assert resp.status_code == 401


# ── Challenge Completion Tests ────────────────────────────────────


class TestChallengeCompletion:
    def test_complete_existing_challenge(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import generate_daily_missions, complete_challenge
        missions = generate_daily_missions(db, user.id)
        assert len(missions) > 0
        mission_id = missions[0]["id"]
        result = complete_challenge(db, user.id, mission_id)
        assert result["success"] is True
        assert result["xp_earned"] > 0
        db.close()

    def test_complete_nonexistent_challenge(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import complete_challenge
        result = complete_challenge(db, user.id, "nonexistent_id")
        assert result["success"] is False
        assert "not found" in result["error"]
        db.close()

    def test_challenge_complete_route(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import generate_daily_missions
        missions = generate_daily_missions(db, user.id)
        mission_id = missions[0]["id"]
        client = TestClient(app)
        resp = client.post(
            f"/api/progress/challenge/{mission_id}/complete",
            headers=_auth_header(user),
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        db.close()

    def test_challenge_complete_invalid_returns_404(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.post(
            "/api/progress/challenge/nonexistent/complete",
            headers=_auth_header(user),
        )
        assert resp.status_code == 404
        db.close()

    def test_challenge_complete_requires_auth(self):
        client = TestClient(app)
        resp = client.post("/api/progress/challenge/some_id/complete")
        assert resp.status_code == 401


# ── Gamification Profile Tests ────────────────────────────────────


class TestGamificationProfile:
    def test_profile_has_all_sections(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/gamification-profile", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "journey" in data
        assert "leaderboard" in data
        db.close()

    def test_profile_summary_data(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/gamification-profile", headers=_auth_header(user))
        data = resp.json()
        assert "level" in data["summary"]
        assert "xp" in data["summary"]
        assert "streak" in data["summary"]
        assert "achievements" in data["summary"]
        db.close()

    def test_profile_leaderboard_rank(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/gamification-profile", headers=_auth_header(user))
        data = resp.json()
        assert "rank" in data["leaderboard"]
        assert "total_users" in data["leaderboard"]
        db.close()

    def test_profile_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/progress/gamification-profile")
        assert resp.status_code == 401

    def test_profile_with_activity(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(5):
            _create_session(db, user.id, activity="piano", score=85.0)
        client = TestClient(app)
        resp = client.get("/api/progress/gamification-profile", headers=_auth_header(user))
        data = resp.json()
        assert data["summary"]["xp"] > 0
        assert data["journey"]["total_xp"] > 0
        db.close()
