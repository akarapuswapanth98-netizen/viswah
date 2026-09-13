"""Centralized entitlement engine for VISWAH.

All premium feature checks go through this module.
Never scatter 'if plan == premium' throughout the codebase.
"""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from models.models import Subscription, UsageRecord
from services.plan_config import (
    FREE,
    get_entitlements,
    get_plan_level,
    get_plan_or_default,
    get_usage_limit,
    has_entitlement,
)


def get_user_subscription(db: Session, user_id: int) -> Subscription | None:
    return db.query(Subscription).filter(Subscription.user_id == user_id).first()


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    sub = get_user_subscription(db, user_id)
    if not sub:
        sub = Subscription(
            user_id=user_id,
            plan_id=FREE,
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


def get_user_plan_id(db: Session, user_id: int) -> str:
    sub = get_user_subscription(db, user_id)
    if not sub:
        return FREE
    if sub.status in ("active", "trialing"):
        return sub.plan_id
    return FREE


def can_access(db: Session, user_id: int, feature: str) -> bool:
    plan_id = get_user_plan_id(db, user_id)
    return has_entitlement(plan_id, feature)


def get_current_usage(db: Session, user_id: int, usage_type: str) -> int:
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    record = (
        db.query(UsageRecord)
        .filter(
            UsageRecord.user_id == user_id,
            UsageRecord.usage_type == usage_type,
            UsageRecord.usage_date == today,
        )
        .first()
    )
    return record.count if record else 0


def increment_usage(db: Session, user_id: int, usage_type: str) -> int:
    """Atomically increment usage via INSERT ON CONFLICT. SQLite + PostgreSQL compatible."""
    from sqlalchemy import text as sa_text
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    # Atomic upsert: insert or increment
    db.execute(
        sa_text("""
            INSERT INTO usage_records (user_id, usage_type, usage_date, count, created_at)
            VALUES (:user_id, :usage_type, :usage_date, 1, :created_at)
            ON CONFLICT(user_id, usage_type, usage_date) DO UPDATE SET count = count + 1
        """),
        {"user_id": user_id, "usage_type": usage_type, "usage_date": today, "created_at": datetime.now(UTC)},
    )
    db.commit()
    return get_current_usage(db, user_id, usage_type)


def can_use(db: Session, user_id: int, usage_type: str) -> dict:
    plan_id = get_user_plan_id(db, user_id)
    limit = get_usage_limit(plan_id, usage_type)
    current = get_current_usage(db, user_id, usage_type)
    return {
        "allowed": current < limit,
        "current_usage": current,
        "daily_limit": limit,
        "plan_id": plan_id,
        "feature": usage_type,
    }


def check_usage_or_denied(db: Session, user_id: int, usage_type: str) -> dict:
    """Atomically check limit and increment. Prevents TOCTOU race with concurrent requests."""
    from sqlalchemy import text as sa_text
    plan_id = get_user_plan_id(db, user_id)
    limit = get_usage_limit(plan_id, usage_type)
    today = datetime.now(UTC).strftime("%Y-%m-%d")

    # Atomic: try to increment, then check if we exceeded limit
    db.execute(
        sa_text("""
            INSERT INTO usage_records (user_id, usage_type, usage_date, count, created_at)
            VALUES (:user_id, :usage_type, :usage_date, 1, :created_at)
            ON CONFLICT(user_id, usage_type, usage_date) DO UPDATE SET count = count + 1
        """),
        {"user_id": user_id, "usage_type": usage_type, "usage_date": today, "created_at": datetime.now(UTC)},
    )
    db.flush()

    new_count = get_current_usage(db, user_id, usage_type)

    if new_count > limit:
        # Exceeded — roll back the increment atomically
        db.execute(
            sa_text("UPDATE usage_records SET count = count - 1 WHERE user_id = :user_id AND usage_type = :usage_type AND usage_date = :usage_date"),
            {"user_id": user_id, "usage_type": usage_type, "usage_date": today},
        )
        db.commit()
        return {
            "limit_reached": True,
            "current_usage": new_count - 1,
            "daily_limit": limit,
            "upgrade_available": plan_id != "pro",
            "feature": usage_type,
        }

    db.commit()
    return {
        "limit_reached": False,
        "current_usage": new_count,
        "daily_limit": limit,
    }


def get_entitlements_for_user(db: Session, user_id: int) -> dict:
    plan_id = get_user_plan_id(db, user_id)
    plan = get_plan_or_default(plan_id)
    usage_status = {}
    for usage_type, limit in plan["usage_limits"].items():
        current = get_current_usage(db, user_id, usage_type)
        usage_status[usage_type] = {
            "current": current,
            "limit": limit,
            "remaining": max(0, limit - current),
        }
    return {
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "features": plan["feature_entitlements"],
        "usage": usage_status,
    }
