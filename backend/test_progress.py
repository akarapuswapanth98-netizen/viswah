"""Tests for VISWAH Phase 12 — Progress & Gamification Engine."""

import pytest
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from main import app
from database import Base, get_db
from models.models import Achievement, PracticeSession, Progress, User, UserCourse

from conftest import TEST_ENGINE, TestSessionLocal, override_get_db


def _create_user(db, username="testuser", email="test@example.com"):
    user = User(username=username, email=email, hashed_password="hashed")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_session(db, user_id, activity="piano", score=80.0, completed=True, days_ago=0):
    session = PracticeSession(
        user_id=user_id,
        activity=activity,
        activity_id="test",
        duration_seconds=300,
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


# ── XP Calculation Tests ─────────────────────────────────────────


class TestXPCalculation:
    def test_empty_user_zero_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["total_xp"] == 0
        assert xp["breakdown"]["practice_sessions"]["count"] == 0
        db.close()

    def test_practice_session_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id)
        _create_session(db, user.id)
        _create_session(db, user.id)
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["practice_sessions"]["xp"] == 30
        assert xp["total_xp"] >= 30
        db.close()

    def test_high_score_bonus(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, score=95.0)
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["high_scores"]["count"] == 1
        assert xp["breakdown"]["high_scores"]["xp"] == 25
        db.close()

    def test_high_score_below_threshold(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, score=85.0)
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["high_scores"]["count"] == 0
        db.close()

    def test_lesson_completion_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from models.models import Course, Lesson
        course = Course(title="Test", description="d", stage=1, instrument="piano", difficulty="beginner")
        db.add(course)
        db.commit()
        lesson = Lesson(course_id=course.id, title="L1", content="c", order=1, lesson_type="theory", duration_minutes=5)
        db.add(lesson)
        db.commit()
        progress = Progress(user_id=user.id, lesson_id=lesson.id, completed=True, score=90.0)
        db.add(progress)
        db.commit()
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["lessons_completed"]["xp"] == 50
        db.close()

    def test_achievement_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        db.add(Achievement(user_id=user.id, achievement_type="first_practice"))
        db.add(Achievement(user_id=user.id, achievement_type="first_lesson"))
        db.commit()
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["achievements"]["count"] == 2
        assert xp["breakdown"]["achievements"]["xp"] == 100
        db.close()

    def test_quiz_xp(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, activity="quiz", score=85.0)
        from services.progress_engine import compute_xp
        xp = compute_xp(db, user.id)
        assert xp["breakdown"]["quizzes_completed"]["xp"] == 20
        db.close()


# ── Level Calculation Tests ───────────────────────────────────────


class TestLevelCalculation:
    def test_level_1_at_zero_xp(self):
        from services.progress_engine import compute_level
        result = compute_level(0)
        assert result["level"] == 1
        assert result["title"] == "Music Explorer"

    def test_level_progression(self):
        from services.progress_engine import compute_level
        result = compute_level(1000)
        assert result["level"] >= 5

    def test_high_level(self):
        from services.progress_engine import compute_level
        result = compute_level(10000)
        assert result["level"] >= 10

    def test_progress_percent(self):
        from services.progress_engine import compute_level
        result = compute_level(500)
        assert 0 <= result["progress_percent"] <= 100


# ── Streak 2.0 Tests ─────────────────────────────────────────────


class TestStreakV2:
    def test_empty_user_zero_streak(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert streak["current_streak"] == 0
        assert streak["longest_streak"] == 0
        assert streak["total_practice_days"] == 0
        db.close()

    def test_single_day_streak(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert streak["current_streak"] >= 1
        db.close()

    def test_consecutive_days_streak(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        _create_session(db, user.id, days_ago=1)
        _create_session(db, user.id, days_ago=2)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert streak["current_streak"] >= 3
        db.close()

    def test_same_day_counts_once(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        _create_session(db, user.id, days_ago=0)
        _create_session(db, user.id, days_ago=0)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert streak["total_practice_days"] == 1
        db.close()

    def test_calendar_30_days(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert len(streak["calendar"]) == 30
        db.close()

    def test_weekly_consistency(self):
        db = TestSessionLocal()
        user = _create_user(db)
        _create_session(db, user.id, days_ago=0)
        from services.progress_engine import compute_streak_v2
        streak = compute_streak_v2(db, user.id)
        assert 0 <= streak["weekly_consistency"] <= 100
        db.close()


# ── Skill Tree Tests ──────────────────────────────────────────────


class TestSkillTree:
    def test_empty_user_all_skills_present(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_skill_tree
        skills = compute_skill_tree(db, user.id)
        assert len(skills) == 10
        db.close()

    def test_skill_has_required_fields(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_skill_tree
        skills = compute_skill_tree(db, user.id)
        for skill in skills:
            assert "id" in skill
            assert "label" in skill
            assert "icon" in skill
            assert "score" in skill
            assert "trend" in skill
        db.close()

    def test_piano_activity_increases_melody(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(5):
            _create_session(db, user.id, activity="piano", score=85.0)
        from services.progress_engine import compute_skill_tree
        skills = compute_skill_tree(db, user.id)
        melody = next(s for s in skills if s["id"] == "melody")
        assert melody["score"] > 0
        db.close()

    def test_vocal_activity_increases_pitch(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(3):
            _create_session(db, user.id, activity="vocal_guru", score=80.0)
        from services.progress_engine import compute_skill_tree
        skills = compute_skill_tree(db, user.id)
        pitch = next(s for s in skills if s["id"] == "pitch")
        assert pitch["score"] > 0
        db.close()


# ── Music Identity Tests ─────────────────────────────────────────


class TestMusicIdentity:
    def test_empty_user_identity(self):
        db = TestSessionLocal()
        user = _create_user(db)
        from services.progress_engine import compute_music_identity
        identity = compute_music_identity(db, user.id)
        assert identity["name"] == "testuser"
        assert identity["level"] == 1
        assert identity["total_sessions"] == 0
        db.close()

    def test_identity_with_activity(self):
        db = TestSessionLocal()
        user = _create_user(db)
        for _ in range(5):
            _create_session(db, user.id, activity="piano", score=85.0)
        from services.progress_engine import compute_music_identity
        identity = compute_music_identity(db, user.id)
        assert identity["total_sessions"] == 5
        assert identity["primary_style"] == "Piano"
        db.close()


# ── API Route Tests ───────────────────────────────────────────────


class TestProgressRoutes:
    def test_summary_requires_auth(self):
        client = TestClient(app)
        resp = client.get("/api/progress/summary")
        assert resp.status_code == 401

    def test_summary_empty_user(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/summary", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert "level" in data
        assert "xp" in data
        assert "skills" in data
        assert "achievements" in data
        assert "missions" in data
        assert "identity" in data
        db.close()

    def test_skills_returns_10(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/skills", headers=_auth_header(user))
        assert resp.status_code == 200
        assert len(resp.json()["skills"]) == 10
        db.close()

    def test_achievements_has_unlocked_count(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/achievements", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "unlocked" in data
        assert data["total"] > 0
        db.close()

    def test_missions_returns_list(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/missions", headers=_auth_header(user))
        assert resp.status_code == 200
        assert isinstance(resp.json()["missions"], list)
        db.close()

    def test_identity_returns_profile(self):
        db = TestSessionLocal()
        user = _create_user(db)
        client = TestClient(app)
        resp = client.get("/api/progress/identity", headers=_auth_header(user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "testuser"
        assert "level" in data
        db.close()

    def test_user_isolation(self):
        db = TestSessionLocal()
        user_a = _create_user(db, "userA", "a@test.com")
        user_b = _create_user(db, "userB", "b@test.com")
        _create_session(db, user_a.id, score=95.0)
        client = TestClient(app)
        resp_a = client.get("/api/progress/summary", headers=_auth_header(user_a))
        resp_b = client.get("/api/progress/summary", headers=_auth_header(user_b))
        assert resp_a.json()["xp"] > 0
        assert resp_b.json()["xp"] == 0
        db.close()


# ── Achievement System Tests ──────────────────────────────────────


class TestAchievementSystem:
    def test_all_achievement_categories(self):
        from services.progress_engine import ACHIEVEMENT_DEFINITIONS
        categories = {a["category"] for a in ACHIEVEMENT_DEFINITIONS.values()}
        assert "first_steps" in categories
        assert "consistency" in categories
        assert "instruments" in categories
        assert "vocal" in categories
        assert "mastery" in categories

    def test_achievements_have_xp_reward(self):
        from services.progress_engine import ACHIEVEMENT_DEFINITIONS
        for ach_id, defn in ACHIEVEMENT_DEFINITIONS.items():
            assert "xp_reward" in defn
            assert defn["xp_reward"] > 0

    def test_unlocked_achievement_shows_in_api(self):
        db = TestSessionLocal()
        user = _create_user(db)
        db.add(Achievement(user_id=user.id, achievement_type="first_practice"))
        db.commit()
        client = TestClient(app)
        resp = client.get("/api/progress/achievements", headers=_auth_header(user))
        data = resp.json()
        first_practice = next(a for a in data["achievements"] if a["id"] == "first_practice")
        assert first_practice["unlocked"] is True
        assert data["unlocked"] >= 1
        db.close()
