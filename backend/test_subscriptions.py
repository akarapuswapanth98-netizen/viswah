"""Tests for Phase 14 - Subscription, Entitlements, Payments."""

import pytest
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from database import Base, get_db
from main import app
from models.models import Subscription, PaymentTransaction, UsageRecord, User
from routes.auth import create_access_token
from services.plan_config import (
    FREE, STUDENT, PREMIUM, PRO,
    PLANS, get_plan, get_all_plans, get_plan_or_default,
    has_entitlement, get_usage_limit, get_plan_level, format_price_inr,
)
from services.entitlement_engine import (
    get_or_create_subscription, get_user_plan_id, can_access,
    get_current_usage, increment_usage, can_use, check_usage_or_denied,
    get_entitlements_for_user,
)

from conftest import TEST_ENGINE, TestSessionLocal, override_get_db

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def _create_user(db, username="testuser", email="test@example.com"):
    from routes.auth import pwd_context
    user = User(
        username=username,
        email=email,
        hashed_password=pwd_context.hash("password123"),
        level="beginner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth_header(user):
    token = create_access_token({"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


# ── Plan Configuration Tests ────────────────────────────────


class TestPlanConfiguration:
    def test_four_plans_exist(self):
        assert len(PLANS) == 4

    def test_free_plan_price(self):
        assert PLANS[FREE]["price_inr"] == 0

    def test_student_plan_price(self):
        assert PLANS[STUDENT]["price_inr"] == 99

    def test_premium_plan_price(self):
        assert PLANS[PREMIUM]["price_inr"] == 299

    def test_pro_plan_price(self):
        assert PLANS[PRO]["price_inr"] == 699

    def test_all_plans_have_entitlements(self):
        for plan_id, plan in PLANS.items():
            assert "feature_entitlements" in plan
            assert len(plan["feature_entitlements"]) > 0

    def test_all_plans_have_usage_limits(self):
        for plan_id, plan in PLANS.items():
            assert "usage_limits" in plan
            assert "ai_coach_daily" in plan["usage_limits"]

    def test_get_plan_returns_plan(self):
        plan = get_plan(STUDENT)
        assert plan is not None
        assert plan["name"] == "Student"

    def test_get_plan_returns_none_for_invalid(self):
        assert get_plan("nonexistent") is None

    def test_get_plan_or_default_returns_free_for_invalid(self):
        plan = get_plan_or_default("nonexistent")
        assert plan["id"] == FREE

    def test_has_entitlement(self):
        assert has_entitlement(FREE, "basic_courses")
        assert has_entitlement(PRO, "creator_tools")

    def test_free_does_not_have_premium_feature(self):
        assert not has_entitlement(FREE, "creator_tools")

    def test_usage_limits_increase_by_plan(self):
        free_limit = get_usage_limit(FREE, "ai_coach_daily")
        student_limit = get_usage_limit(STUDENT, "ai_coach_daily")
        premium_limit = get_usage_limit(PREMIUM, "ai_coach_daily")
        pro_limit = get_usage_limit(PRO, "ai_coach_daily")
        assert free_limit < student_limit < premium_limit < pro_limit

    def test_plan_level_ordering(self):
        assert get_plan_level(FREE) < get_plan_level(STUDENT) < get_plan_level(PREMIUM) < get_plan_level(PRO)

    def test_format_price_inr_free(self):
        assert format_price_inr(0) == "Free"

    def test_format_price_inr_paid(self):
        assert "99" in format_price_inr(99)

    def test_get_all_plans_returns_list(self):
        plans = get_all_plans()
        assert isinstance(plans, list)
        assert len(plans) == 4


# ── Entitlement Engine Tests ────────────────────────────────


class TestEntitlementEngine:
    def test_get_or_create_creates_free_subscription(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent1", "ent1@test.com")
            sub = get_or_create_subscription(db, user.id)
            assert sub.plan_id == FREE
            assert sub.status == "active"
        finally:
            db.close()

    def test_get_or_create_returns_existing(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent2", "ent2@test.com")
            sub1 = get_or_create_subscription(db, user.id)
            sub2 = get_or_create_subscription(db, user.id)
            assert sub1.id == sub2.id
        finally:
            db.close()

    def test_get_user_plan_id_default_free(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent3", "ent3@test.com")
            plan = get_user_plan_id(db, user.id)
            assert plan == FREE
        finally:
            db.close()

    def test_get_user_plan_id_active(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent4", "ent4@test.com")
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = PREMIUM
            sub.status = "active"
            db.commit()
            plan = get_user_plan_id(db, user.id)
            assert plan == PREMIUM
        finally:
            db.close()

    def test_get_user_plan_id_expired_returns_free(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent5", "ent5@test.com")
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.status = "expired"
            db.commit()
            plan = get_user_plan_id(db, user.id)
            assert plan == FREE
        finally:
            db.close()

    def test_can_access_entitled_feature(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent6", "ent6@test.com")
            assert can_access(db, user.id, "basic_courses")
        finally:
            db.close()

    def test_can_access_denied_feature(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent7", "ent7@test.com")
            assert not can_access(db, user.id, "creator_tools")
        finally:
            db.close()

    def test_increment_usage(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent8", "ent8@test.com")
            count = increment_usage(db, user.id, "ai_coach_daily")
            assert count == 1
            count = increment_usage(db, user.id, "ai_coach_daily")
            assert count == 2
        finally:
            db.close()

    def test_get_current_usage(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent9", "ent9@test.com")
            assert get_current_usage(db, user.id, "ai_coach_daily") == 0
            increment_usage(db, user.id, "ai_coach_daily")
            assert get_current_usage(db, user.id, "ai_coach_daily") == 1
        finally:
            db.close()

    def test_can_use_within_limit(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent10", "ent10@test.com")
            result = can_use(db, user.id, "ai_coach_daily")
            assert result["allowed"] is True
            assert result["daily_limit"] == 5
        finally:
            db.close()

    def test_check_usage_or_denied_allows(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent11", "ent11@test.com")
            result = check_usage_or_denied(db, user.id, "ai_coach_daily")
            assert result["limit_reached"] is False
        finally:
            db.close()

    def test_check_usage_or_denied_blocks_at_limit(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent12", "ent12@test.com")
            for _ in range(5):
                increment_usage(db, user.id, "ai_coach_daily")
            result = check_usage_or_denied(db, user.id, "ai_coach_daily")
            assert result["limit_reached"] is True
            assert result["daily_limit"] == 5
        finally:
            db.close()

    def test_get_entitlements_for_user(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ent13", "ent13@test.com")
            result = get_entitlements_for_user(db, user.id)
            assert result["plan_id"] == FREE
            assert "features" in result
            assert "usage" in result
        finally:
            db.close()


# ── Subscription API Tests ──────────────────────────────────


class TestSubscriptionAPI:
    def test_get_subscription_default(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api1", "api1@test.com")
            headers = _auth_header(user)
            resp = client.get("/api/subscription", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["plan_id"] == "free"
            assert data["status"] == "active"
        finally:
            db.close()

    def test_get_subscription_unauthorized(self):
        resp = client.get("/api/subscription")
        assert resp.status_code == 401

    def test_list_plans(self):
        resp = client.get("/api/subscription/plans")
        assert resp.status_code == 200
        plans = resp.json()
        assert len(plans) == 4
        prices = [p["price_inr"] for p in plans]
        assert 0 in prices
        assert 99 in prices
        assert 299 in prices
        assert 699 in prices

    def test_get_entitlements(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api2", "api2@test.com")
            headers = _auth_header(user)
            resp = client.get("/api/subscription/entitlements", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["plan_id"] == "free"
            assert "features" in data
        finally:
            db.close()

    def test_get_usage(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api3", "api3@test.com")
            headers = _auth_header(user)
            resp = client.get("/api/subscription/usage/ai_coach_daily", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["daily_limit"] == 5
            assert data["current_usage"] == 0
        finally:
            db.close()

    def test_checkout_invalid_plan(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api4", "api4@test.com")
            headers = _auth_header(user)
            resp = client.post("/api/subscription/checkout", json={"plan_id": "invalid"}, headers=headers)
            assert resp.status_code == 400
        finally:
            db.close()

    def test_checkout_free_plan(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api5", "api5@test.com")
            headers = _auth_header(user)
            resp = client.post("/api/subscription/checkout", json={"plan_id": "free"}, headers=headers)
            assert resp.status_code == 400
        finally:
            db.close()

    def test_checkout_dev_mode(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api6", "api6@test.com")
            headers = _auth_header(user)
            resp = client.post("/api/subscription/checkout", json={"plan_id": STUDENT}, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["provider"] == "dev"
            assert "order_id" in data
        finally:
            db.close()

    def test_verify_payment_dev_mode(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api7", "api7@test.com")
            headers = _auth_header(user)
            checkout = client.post("/api/subscription/checkout", json={"plan_id": PREMIUM}, headers=headers).json()
            resp = client.post("/api/subscription/verify", json={
                "provider": "dev",
                "order_id": checkout["order_id"],
                "plan_id": PREMIUM,
            }, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert data["subscription"]["plan_id"] == PREMIUM
        finally:
            db.close()

    def test_verify_invalid_order(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api8", "api8@test.com")
            headers = _auth_header(user)
            resp = client.post("/api/subscription/verify", json={
                "provider": "dev",
                "order_id": "invalid_order",
                "plan_id": STUDENT,
            }, headers=headers)
            assert resp.status_code == 400
        finally:
            db.close()

    def test_cancel_subscription(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api9", "api9@test.com")
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            db.commit()
            headers = _auth_header(user)
            resp = client.post("/api/subscription/cancel", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["cancel_at_period_end"] is True
        finally:
            db.close()

    def test_cancel_free_plan_fails(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api10", "api10@test.com")
            headers = _auth_header(user)
            resp = client.post("/api/subscription/cancel", headers=headers)
            assert resp.status_code == 400
        finally:
            db.close()

    def test_reactivate_subscription(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api11", "api11@test.com")
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.cancel_at_period_end = True
            db.commit()
            headers = _auth_header(user)
            resp = client.post("/api/subscription/reactivate", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["cancel_at_period_end"] is False
        finally:
            db.close()

    def test_reactivate_not_canceled_fails(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api12", "api12@test.com")
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.cancel_at_period_end = False
            db.commit()
            headers = _auth_header(user)
            resp = client.post("/api/subscription/reactivate", headers=headers)
            assert resp.status_code == 400
        finally:
            db.close()

    def test_billing_history(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api13", "api13@test.com")
            headers = _auth_header(user)
            resp = client.get("/api/subscription/history", headers=headers)
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)
        finally:
            db.close()

    def test_check_feature(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "api14", "api14@test.com")
            headers = _auth_header(user)
            resp = client.get("/api/subscription/check/basic_courses", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["allowed"] is True
        finally:
            db.close()

    def test_user_isolation(self):
        db = TestSessionLocal()
        try:
            user1 = _create_user(db, "iso1", "iso1@test.com")
            user2 = _create_user(db, "iso2", "iso2@test.com")
            sub1 = get_or_create_subscription(db, user1.id)
            sub1.plan_id = PRO
            db.commit()
            headers2 = _auth_header(user2)
            resp = client.get("/api/subscription", headers=headers2)
            assert resp.json()["plan_id"] == "free"
        finally:
            db.close()

    def test_checkout_then_verify_flow(self):
        db = TestSessionLocal()
        try:
            user = _create_user(db, "flow1", "flow1@test.com")
            headers = _auth_header(user)
            checkout = client.post("/api/subscription/checkout", json={"plan_id": STUDENT}, headers=headers).json()
            verify = client.post("/api/subscription/verify", json={
                "provider": "dev",
                "order_id": checkout["order_id"],
                "plan_id": STUDENT,
            }, headers=headers).json()
            assert verify["success"] is True
            sub = client.get("/api/subscription", headers=headers).json()
            assert sub["plan_id"] == STUDENT
            assert sub["status"] == "active"
        finally:
            db.close()


# ── Phase 14.1 Integration Tests ─────────────────────────────────


class TestAICoachEnforcement:
    """Test AI Coach usage enforcement."""

    def test_ai_coach_message_increments_usage(self):
        """Accepted request increments usage exactly once."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "aiuser1", "ai1@test.com")
            headers = _auth_header(user)

            # First message should succeed
            resp = client.post("/api/ai-coach/message", json={
                "message": "What should I practice?"
            }, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "response" in data

            # Check usage was incremented
            from services.entitlement_engine import get_current_usage
            usage = get_current_usage(db, user.id, "ai_coach_daily")
            assert usage == 1
        finally:
            db.close()

    def test_ai_coach_limit_reached_returns_429(self):
        """Limit reached returns 429 with structured response."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "ailimit", "ailimit@test.com")
            headers = _auth_header(user)

            # Exhaust free user limit (5 messages)
            for i in range(5):
                client.post("/api/ai-coach/message", json={
                    "message": f"Message {i}"
                }, headers=headers)

            # Next message should be rejected
            resp = client.post("/api/ai-coach/message", json={
                "message": "One more"
            }, headers=headers)
            assert resp.status_code == 429
            data = resp.json()
            assert data["detail"]["limit_reached"] is True
            assert data["detail"]["feature"] == "ai_coach_daily"
        finally:
            db.close()

    def test_ai_coach_rejected_request_does_not_increment(self):
        """Rejected request does not increment usage."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "aireject", "aireject@test.com")
            headers = _auth_header(user)

            # Exhaust limit
            for i in range(5):
                client.post("/api/ai-coach/message", json={
                    "message": f"Message {i}"
                }, headers=headers)

            # Get current usage
            from services.entitlement_engine import get_current_usage
            usage_before = get_current_usage(db, user.id, "ai_coach_daily")

            # Rejected request
            client.post("/api/ai-coach/message", json={
                "message": "Should fail"
            }, headers=headers)

            # Usage should not change
            usage_after = get_current_usage(db, user.id, "ai_coach_daily")
            assert usage_after == usage_before
        finally:
            db.close()

    def test_ai_coach_student_higher_limit(self):
        """Student plan has higher AI Coach limit."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "aistudent", "aistudent@test.com")
            headers = _auth_header(user)

            # Set user to student plan
            from services.entitlement_engine import get_or_create_subscription
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.status = "active"
            db.commit()

            # Student can send 30 messages
            for i in range(30):
                resp = client.post("/api/ai-coach/message", json={
                    "message": f"Message {i}"
                }, headers=headers)
                assert resp.status_code == 200

            # 31st should fail
            resp = client.post("/api/ai-coach/message", json={
                "message": "One more"
            }, headers=headers)
            assert resp.status_code == 429
        finally:
            db.close()


class TestPracticeEnforcement:
    """Test practice session usage enforcement."""

    def test_practice_session_increments_usage(self):
        """Accepted practice session increments usage."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "pracuser", "prac@test.com")
            headers = _auth_header(user)

            resp = client.post("/api/practice/sessions", json={
                "activity": "piano",
                "duration_seconds": 300,
                "completed": True,
            }, headers=headers)
            assert resp.status_code == 201

            from services.entitlement_engine import get_current_usage
            usage = get_current_usage(db, user.id, "practice_sessions_daily")
            assert usage == 1
        finally:
            db.close()

    def test_music_lab_session_increments_both_counters(self):
        """Music Lab session increments both practice and music lab counters."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "mluser", "ml@test.com")
            headers = _auth_header(user)

            resp = client.post("/api/practice/sessions", json={
                "activity": "note_recognition",
                "duration_seconds": 120,
                "completed": True,
            }, headers=headers)
            assert resp.status_code == 201

            from services.entitlement_engine import get_current_usage
            prac_usage = get_current_usage(db, user.id, "practice_sessions_daily")
            music_usage = get_current_usage(db, user.id, "music_lab_daily")
            assert prac_usage == 1
            assert music_usage == 1
        finally:
            db.close()

    def test_practice_limit_reached_returns_429(self):
        """Practice limit reached returns 429."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "praclimit", "praclimit@test.com")
            headers = _auth_header(user)

            # Exhaust free user limit (10 sessions)
            for i in range(10):
                client.post("/api/practice/sessions", json={
                    "activity": "piano",
                    "duration_seconds": 60,
                }, headers=headers)

            # Next should fail
            resp = client.post("/api/practice/sessions", json={
                "activity": "piano",
                "duration_seconds": 60,
            }, headers=headers)
            assert resp.status_code == 429
            assert resp.json()["detail"]["feature"] == "practice_sessions_daily"
        finally:
            db.close()

    def test_music_lab_limit_independent_of_practice(self):
        """Music Lab limit is separate from practice limit — verified via student plan."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "mlindep", "mlindep@test.com")
            headers = _auth_header(user)

            # Student plan: practice=50, music_lab=50 — but let's manually set
            # music lab usage to 49 and practice to 0 to prove independence
            from services.entitlement_engine import get_or_create_subscription, increment_usage
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.status = "active"
            db.commit()

            # Simulate 49 music lab usages
            for _ in range(49):
                increment_usage(db, user.id, "music_lab_daily")

            # Music lab should still work (1 left)
            resp = client.post("/api/practice/sessions", json={
                "activity": "rhythm_training",
                "duration_seconds": 60,
            }, headers=headers)
            assert resp.status_code == 201

            # Now music lab limit is exhausted (50/50)
            resp = client.post("/api/practice/sessions", json={
                "activity": "melody_recognition",
                "duration_seconds": 60,
            }, headers=headers)
            assert resp.status_code == 429
            assert resp.json()["detail"]["feature"] == "music_lab_daily"

            # Practice sessions should still work (only 1 used so far)
            resp = client.post("/api/practice/sessions", json={
                "activity": "piano",
                "duration_seconds": 60,
            }, headers=headers)
            assert resp.status_code == 201
        finally:
            db.close()


class TestCoursePremiumGating:
    """Test premium course access gating."""

    def test_free_user_cannot_enroll_stage3(self):
        """Free user cannot enroll in stage 3+ courses."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "coursefree", "coursefree@test.com")
            headers = _auth_header(user)

            # Create a stage 3 course
            from models.models import Course
            course = Course(
                title="Advanced Raga",
                description="Advanced raga course",
                stage=3,
                instrument="vocal",
                difficulty="advanced",
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            # Try to enroll
            resp = client.post(f"/api/enroll/{course.id}", headers=headers)
            assert resp.status_code == 403
            assert resp.json()["detail"]["error"] == "premium_content"
        finally:
            db.close()

    def test_student_can_enroll_stage3(self):
        """Student user can enroll in stage 3+ courses."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "coursestudent", "coursestudent@test.com")
            headers = _auth_header(user)

            # Set to student plan
            from services.entitlement_engine import get_or_create_subscription
            sub = get_or_create_subscription(db, user.id)
            sub.plan_id = STUDENT
            sub.status = "active"
            db.commit()

            # Create a stage 3 course
            from models.models import Course
            course = Course(
                title="Advanced Raga",
                description="Advanced raga course",
                stage=3,
                instrument="vocal",
                difficulty="advanced",
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            # Should succeed
            resp = client.post(f"/api/enroll/{course.id}", headers=headers)
            assert resp.status_code == 201
        finally:
            db.close()

    def test_free_user_can_enroll_stage1(self):
        """Free user can enroll in stage 1-2 courses."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "coursebasic", "coursebasic@test.com")
            headers = _auth_header(user)

            # Create a stage 1 course
            from models.models import Course
            course = Course(
                title="Basic Piano",
                description="Piano basics",
                stage=1,
                instrument="piano",
                difficulty="beginner",
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            # Should succeed
            resp = client.post(f"/api/enroll/{course.id}", headers=headers)
            assert resp.status_code == 201
        finally:
            db.close()


class TestSubscriptionEdgeCases:
    """Test subscription edge cases."""

    def test_expired_subscription_falls_back_to_free(self):
        """Expired subscription reverts to free entitlements."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "expired", "expired@test.com")

            # Set expired subscription
            from models.models import Subscription
            from datetime import UTC, datetime, timedelta
            sub = Subscription(
                user_id=user.id,
                plan_id=PREMIUM,
                status="expired",
                current_period_end=datetime.now(UTC) - timedelta(days=1),
            )
            db.add(sub)
            db.commit()

            # Should get free plan
            from services.entitlement_engine import get_user_plan_id
            plan_id = get_user_plan_id(db, user.id)
            assert plan_id == FREE
        finally:
            db.close()

    def test_canceled_retains_access_until_period_end(self):
        """Canceled subscription with cancel_at_period_end retains access."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "canceled", "canceled@test.com")

            # Set canceled subscription with future period end
            from models.models import Subscription
            from datetime import UTC, datetime, timedelta
            sub = Subscription(
                user_id=user.id,
                plan_id=PREMIUM,
                status="active",
                cancel_at_period_end=True,
                current_period_end=datetime.now(UTC) + timedelta(days=10),
            )
            db.add(sub)
            db.commit()

            # Should still have premium access
            from services.entitlement_engine import get_user_plan_id
            plan_id = get_user_plan_id(db, user.id)
            assert plan_id == PREMIUM
        finally:
            db.close()

    def test_user_isolation_cannot_access_other_usage(self):
        """User cannot access another user's usage data."""
        db = TestSessionLocal()
        try:
            user1 = _create_user(db, "user1", "user1@test.com")
            user2 = _create_user(db, "user2", "user2@test.com")
            headers1 = _auth_header(user1)

            # Create practice session for user1
            client.post("/api/practice/sessions", json={
                "activity": "piano",
                "duration_seconds": 60,
            }, headers=headers1)

            # User1's usage should be 1
            from services.entitlement_engine import get_current_usage
            usage1 = get_current_usage(db, user1.id, "practice_sessions_daily")
            usage2 = get_current_usage(db, user2.id, "practice_sessions_daily")
            assert usage1 == 1
            assert usage2 == 0
        finally:
            db.close()

    def test_usage_resets_daily(self):
        """Usage resets on new day (simulated)."""
        db = TestSessionLocal()
        try:
            user = _create_user(db, "dailyreset", "dailyreset@test.com")

            # Create usage record for yesterday
            from models.models import UsageRecord
            from datetime import UTC, datetime, timedelta
            yesterday = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")
            record = UsageRecord(
                user_id=user.id,
                usage_type="ai_coach_daily",
                usage_date=yesterday,
                count=100,
            )
            db.add(record)
            db.commit()

            # Today's usage should be 0
            from services.entitlement_engine import get_current_usage
            usage = get_current_usage(db, user.id, "ai_coach_daily")
            assert usage == 0
        finally:
            db.close()
