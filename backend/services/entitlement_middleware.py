"""FastAPI dependency helpers for subscription entitlement checks.

All premium feature checks go through this module.
Backend is the source of truth — frontend gating is UX only.
"""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import User
from routes.auth import get_current_user
from services.entitlement_engine import (
    can_access,
    can_use,
    check_usage_or_denied,
    get_user_plan_id,
    increment_usage,
)
from services.plan_config import has_entitlement


def require_entitlement(feature: str):
    """Return a dependency that checks if the current user has a specific feature entitlement.

    Usage in routes:
        @router.post("/something")
        def do_something(
            _entitled: None = Depends(require_entitlement("full_course_access")),
            current_user: User = Depends(get_current_user),
            db: Session = Depends(get_db),
        ):
            ...
    """
    def _check(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if not can_access(db, current_user.id, feature):
            plan_id = get_user_plan_id(db, current_user.id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "feature_not_available",
                    "feature": feature,
                    "current_plan": plan_id,
                    "upgrade_available": plan_id != "pro",
                },
            )
        return None
    return _check


def check_usage_limit(usage_type: str):
    """Return a dependency that checks and increments usage for rate-limited features.

    If the limit is reached, returns 429 with structured response.
    If allowed, increments usage and returns None.

    Usage in routes:
        @router.post("/something")
        def do_something(
            _usage: None = Depends(check_usage_limit("ai_coach_daily")),
            current_user: User = Depends(get_current_user),
            db: Session = Depends(get_db),
        ):
            ...
    """
    def _check(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        result = check_usage_or_denied(db, current_user.id, usage_type)
        if result["limit_reached"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "limit_reached": True,
                    "usage": result["current_usage"],
                    "limit": result["daily_limit"],
                    "upgrade_available": result["upgrade_available"],
                    "feature": usage_type,
                },
            )
        return None
    return _check


def get_user_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> str:
    """Dependency that returns the current user's plan ID."""
    return get_user_plan_id(db, current_user.id)
