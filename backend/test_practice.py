"""Backend tests for Practice History and Summary endpoints."""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from conftest import TestSessionLocal
from main import app
from models.models import PracticeSession, User
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


def create_user(db, email="test@example.com", username="testuser"):
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash("password123"),
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


def create_session(db, user_id, activity="vocal_guru", activity_id="pitch",
                   score=None, duration=300, completed=True, days_ago=0):
    session = PracticeSession(
        user_id=user_id,
        activity=activity,
        activity_id=activity_id,
        duration_seconds=duration,
        score=score,
        completed=completed,
        created_at=datetime.now(UTC) - timedelta(days=days_ago),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ===================== AUTHORIZATION TESTS =====================

class TestAuthorization:
    def test_history_requires_auth(self, client):
        resp = client.get("/api/practice/history")
        assert resp.status_code == 401

    def test_summary_requires_auth(self, client):
        resp = client.get("/api/practice/summary")
        assert resp.status_code == 401

    def test_user_a_cannot_see_user_b_sessions(self, client, db_session):
        user_a = create_user(db_session, "a@test.com", "usera")
        user_b = create_user(db_session, "b@test.com", "userb")

        create_session(db_session, user_a.id, activity_id="pitch", score=80)
        create_session(db_session, user_b.id, activity_id="breathing", score=60)

        token_a = get_token(client, "a@test.com")
        resp = client.get("/api/practice/history", headers=auth_header(token_a))
        data = resp.json()
        assert resp.status_code == 200
        assert len(data) == 1
        assert data[0]["activity_id"] == "pitch"

        token_b = get_token(client, "b@test.com")
        resp = client.get("/api/practice/history", headers=auth_header(token_b))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["activity_id"] == "breathing"


# ===================== HISTORY TESTS =====================

class TestHistory:
    def test_empty_history(self, client, db_session):
        user = create_user(db_session)
        token = get_token(client)
        resp = client.get("/api/practice/history", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_history_ordering_newest_first(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, days_ago=3, score=60)
        create_session(db_session, user.id, days_ago=1, score=70)
        create_session(db_session, user.id, days_ago=2, score=80)

        token = get_token(client)
        resp = client.get("/api/practice/history", headers=auth_header(token))
        data = resp.json()
        scores = [d["score"] for d in data]
        assert scores == [70, 80, 60]

    def test_activity_filter(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity="vocal_guru", activity_id="pitch")
        create_session(db_session, user.id, activity="speech_analysis", activity_id="pitch")

        token = get_token(client)
        resp = client.get("/api/practice/history?activity=vocal_guru", headers=auth_header(token))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["activity"] == "vocal_guru"

    def test_topic_filter(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch")
        create_session(db_session, user.id, activity_id="breathing")

        token = get_token(client)
        resp = client.get("/api/practice/history?topic=pitch", headers=auth_header(token))
        data = resp.json()
        assert len(data) == 1
        assert data[0]["activity_id"] == "pitch"

    def test_limit(self, client, db_session):
        user = create_user(db_session)
        for i in range(5):
            create_session(db_session, user.id, score=i * 10)

        token = get_token(client)
        resp = client.get("/api/practice/history?limit=3", headers=auth_header(token))
        assert len(resp.json()) == 3

    def test_offset(self, client, db_session):
        user = create_user(db_session)
        for i in range(5):
            create_session(db_session, user.id, score=i * 10, days_ago=4 - i)

        token = get_token(client)
        resp = client.get("/api/practice/history?offset=2", headers=auth_header(token))
        data = resp.json()
        assert len(data) == 3
        # Should skip the 2 most recent
        scores = [d["score"] for d in data]
        assert scores == [20, 10, 0]


# ===================== SUMMARY TESTS =====================

class TestSummary:
    def test_empty_summary(self, client, db_session):
        user = create_user(db_session)
        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert resp.status_code == 200
        assert data["total_sessions"] == 0
        assert data["total_minutes"] == 0
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0
        assert data["average_score"] is None
        assert data["best_score"] is None
        assert data["recent_score"] is None
        assert data["recent_sessions"] == []
        assert data["topic_statistics"] == []

    def test_single_session_stats(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, score=75, duration=300)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert data["total_sessions"] == 1
        assert data["total_minutes"] == 5
        assert data["average_score"] == 75.0
        assert data["best_score"] == 75.0
        assert data["recent_score"] == 75.0

    def test_average_ignores_null_scores(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, score=None)
        create_session(db_session, user.id, score=70)
        create_session(db_session, user.id, score=None)
        create_session(db_session, user.id, score=80)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert data["average_score"] == 75.0
        assert data["best_score"] == 80.0

    def test_recent_score_is_newest_scored(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, score=60, days_ago=3)
        create_session(db_session, user.id, score=None, days_ago=1)
        create_session(db_session, user.id, score=80, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert data["recent_score"] == 80.0

    def test_improvement_calculation(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch", score=60, days_ago=4)
        create_session(db_session, user.id, activity_id="pitch", score=75, days_ago=2)
        create_session(db_session, user.id, activity_id="pitch", score=80, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        topic = data["topic_statistics"][0]
        assert topic["improvement_points"] == 20.0  # 80 - 60
        assert topic["trend"] == "improving"

    def test_topic_isolation_by_activity(self, client, db_session):
        """Same activity_id in different activities should be separate topics."""
        user = create_user(db_session)
        create_session(db_session, user.id, activity="vocal_guru", activity_id="pitch", score=80)
        create_session(db_session, user.id, activity="speech_analysis", activity_id="pitch", score=60)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        topics = data["topic_statistics"]
        assert len(topics) == 2
        topic_names = [t["topic"] for t in topics]
        assert "vocal_guru:pitch" in topic_names
        assert "speech_analysis:pitch" in topic_names

    def test_trend_improving(self, client, db_session):
        user = create_user(db_session)
        # 4 sessions with clear improvement
        create_session(db_session, user.id, activity_id="pitch", score=50, days_ago=6)
        create_session(db_session, user.id, activity_id="pitch", score=60, days_ago=4)
        create_session(db_session, user.id, activity_id="pitch", score=70, days_ago=2)
        create_session(db_session, user.id, activity_id="pitch", score=80, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topic = resp.json()["topic_statistics"][0]
        assert topic["trend"] == "improving"

    def test_trend_stable(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch", score=70, days_ago=6)
        create_session(db_session, user.id, activity_id="pitch", score=71, days_ago=4)
        create_session(db_session, user.id, activity_id="pitch", score=72, days_ago=2)
        create_session(db_session, user.id, activity_id="pitch", score=70, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topic = resp.json()["topic_statistics"][0]
        assert topic["trend"] == "stable"

    def test_insufficient_data_for_trend(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch", score=70, days_ago=1)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topic = resp.json()["topic_statistics"][0]
        assert topic["trend"] == "insufficient_data"
        assert topic["improvement_points"] is None

    def test_two_sessions_provides_improvement(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch", score=60, days_ago=2)
        create_session(db_session, user.id, activity_id="pitch", score=75, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topic = resp.json()["topic_statistics"][0]
        assert topic["improvement_points"] == 15.0
        assert topic["trend"] == "improving"


# ===================== STREAK TESTS =====================

class TestStreaks:
    def test_current_streak_today(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["current_streak"] >= 1

    def test_current_streak_consecutive(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, days_ago=0)
        create_session(db_session, user.id, days_ago=1)
        create_session(db_session, user.id, days_ago=2)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["current_streak"] == 3

    def test_streak_breaks_at_gap(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, days_ago=0)
        create_session(db_session, user.id, days_ago=1)
        # Gap: no session 2 days ago
        create_session(db_session, user.id, days_ago=3)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["current_streak"] == 2

    def test_longest_streak(self, client, db_session):
        user = create_user(db_session)
        # First streak: 3 days
        create_session(db_session, user.id, days_ago=10)
        create_session(db_session, user.id, days_ago=9)
        create_session(db_session, user.id, days_ago=8)
        # Gap
        # Second streak: 2 days
        create_session(db_session, user.id, days_ago=5)
        create_session(db_session, user.id, days_ago=4)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["longest_streak"] == 3

    def test_same_day_sessions_count_as_one_streak_day(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, days_ago=0)
        create_session(db_session, user.id, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["current_streak"] == 1

    def test_no_sessions_zero_streak(self, client, db_session):
        user = create_user(db_session)
        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0


# ===================== EDGE CASE TESTS =====================

class TestEdgeCases:
    def test_mixed_null_scores_in_history(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, score=None)
        create_session(db_session, user.id, score=70)
        create_session(db_session, user.id, score=None)
        create_session(db_session, user.id, score=80)

        token = get_token(client)
        resp = client.get("/api/practice/history", headers=auth_header(token))
        data = resp.json()
        assert len(data) == 4
        null_scores = [d for d in data if d["score"] is None]
        assert len(null_scores) == 2

    def test_empty_activity_id_excluded_from_topics(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id=None, score=70)
        create_session(db_session, user.id, activity_id="", score=80)
        create_session(db_session, user.id, activity_id="pitch", score=90)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topics = resp.json()["topic_statistics"]
        assert len(topics) == 1
        assert topics[0]["topic"] == "vocal_guru:pitch"

    def test_multiple_activity_types_in_summary(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, activity="vocal_guru", activity_id="pitch", score=80)
        create_session(db_session, user.id, activity="speech_analysis", activity_id="pitch", score=60)
        create_session(db_session, user.id, activity="piano", activity_id=None, score=70)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        data = resp.json()
        assert data["activity_statistics"]["vocal_guru"] == 1
        assert data["activity_statistics"]["speech_analysis"] == 1
        assert data["activity_statistics"]["piano"] == 1

    def test_duration_totals(self, client, db_session):
        user = create_user(db_session)
        create_session(db_session, user.id, duration=120)  # 2 min
        create_session(db_session, user.id, duration=300)  # 5 min

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        assert resp.json()["total_minutes"] == 7

    def test_trend_with_mixed_null_scores(self, client, db_session):
        """Trend calculation should only use scored sessions."""
        user = create_user(db_session)
        create_session(db_session, user.id, activity_id="pitch", score=None, days_ago=6)
        create_session(db_session, user.id, activity_id="pitch", score=50, days_ago=5)
        create_session(db_session, user.id, activity_id="pitch", score=None, days_ago=4)
        create_session(db_session, user.id, activity_id="pitch", score=70, days_ago=3)
        create_session(db_session, user.id, activity_id="pitch", score=None, days_ago=2)
        create_session(db_session, user.id, activity_id="pitch", score=80, days_ago=0)

        token = get_token(client)
        resp = client.get("/api/practice/summary", headers=auth_header(token))
        topic = resp.json()["topic_statistics"][0]
        # 3 scored sessions: 50, 70, 80 → improving
        assert topic["trend"] == "improving"
        assert topic["improvement_points"] == 30.0  # 80 - 50
