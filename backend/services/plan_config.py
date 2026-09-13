"""Centralized plan configuration for VISWAH monetization.

All pricing, feature entitlements, and usage limits are defined here.
Frontend and backend both read from this single source of truth.
"""

# Plan IDs
FREE = "free"
STUDENT = "student"
PREMIUM = "premium"
PRO = "pro"

ALL_PLANS = [FREE, STUDENT, PREMIUM, PRO]

PLANS = {
    FREE: {
        "id": FREE,
        "name": "Free",
        "price_inr": 0,
        "billing_period": "monthly",
        "display_order": 0,
        "badge_label": "Free",
        "target_learner": "Try VISWAH before upgrading",
        "feature_entitlements": [
            "basic_courses",
            "basic_lessons",
            "basic_piano",
            "basic_drums",
            "basic_vocal_guru",
            "basic_music_lab",
            "basic_world_music",
            "basic_ai_coach",
            "basic_progress",
            "basic_achievements",
            "basic_community",
            "basic_practice",
        ],
        "usage_limits": {
            "ai_coach_daily": 5,
            "ai_lessons_daily": 2,
            "music_lab_daily": 10,
            "practice_sessions_daily": 10,
        },
    },
    STUDENT: {
        "id": STUDENT,
        "name": "Student",
        "price_inr": 99,
        "billing_period": "monthly",
        "display_order": 1,
        "badge_label": "Best for Students",
        "target_learner": "College students & beginner learners",
        "feature_entitlements": [
            "basic_courses",
            "basic_lessons",
            "basic_piano",
            "basic_drums",
            "basic_vocal_guru",
            "basic_music_lab",
            "basic_world_music",
            "basic_ai_coach",
            "basic_progress",
            "basic_achievements",
            "basic_community",
            "basic_practice",
            "full_course_access",
            "more_ai_coach",
            "full_music_lab",
            "full_practice_studio",
            "full_progress_analytics",
            "advanced_achievements",
            "advanced_missions",
            "world_music_expanded",
            "community_challenges",
            "priority_content",
        ],
        "usage_limits": {
            "ai_coach_daily": 30,
            "ai_lessons_daily": 10,
            "music_lab_daily": 50,
            "practice_sessions_daily": 50,
        },
    },
    PREMIUM: {
        "id": PREMIUM,
        "name": "Premium",
        "price_inr": 299,
        "billing_period": "monthly",
        "display_order": 2,
        "badge_label": "Most Popular",
        "target_learner": "Serious music learners",
        "feature_entitlements": [
            "basic_courses",
            "basic_lessons",
            "basic_piano",
            "basic_drums",
            "basic_vocal_guru",
            "basic_music_lab",
            "basic_world_music",
            "basic_ai_coach",
            "basic_progress",
            "basic_achievements",
            "basic_community",
            "basic_practice",
            "full_course_access",
            "more_ai_coach",
            "full_music_lab",
            "full_practice_studio",
            "full_progress_analytics",
            "advanced_achievements",
            "advanced_missions",
            "world_music_expanded",
            "community_challenges",
            "priority_content",
            "highest_ai_coach",
            "advanced_music_lab",
            "advanced_vocal_guru",
            "advanced_analytics",
            "advanced_skill_tracking",
            "advanced_world_music",
            "advanced_practice_insights",
            "premium_learning_paths",
            "premium_challenges",
            "detailed_progress_history",
        ],
        "usage_limits": {
            "ai_coach_daily": 100,
            "ai_lessons_daily": 30,
            "music_lab_daily": 200,
            "practice_sessions_daily": 200,
        },
    },
    PRO: {
        "id": PRO,
        "name": "Pro",
        "price_inr": 699,
        "billing_period": "monthly",
        "display_order": 3,
        "badge_label": "For Professionals",
        "target_learner": "Advanced musicians & creators",
        "feature_entitlements": [
            "basic_courses",
            "basic_lessons",
            "basic_piano",
            "basic_drums",
            "basic_vocal_guru",
            "basic_music_lab",
            "basic_world_music",
            "basic_ai_coach",
            "basic_progress",
            "basic_achievements",
            "basic_community",
            "basic_practice",
            "full_course_access",
            "more_ai_coach",
            "full_music_lab",
            "full_practice_studio",
            "full_progress_analytics",
            "advanced_achievements",
            "advanced_missions",
            "world_music_expanded",
            "community_challenges",
            "priority_content",
            "highest_ai_coach",
            "advanced_music_lab",
            "advanced_vocal_guru",
            "advanced_analytics",
            "advanced_skill_tracking",
            "advanced_world_music",
            "advanced_practice_insights",
            "premium_learning_paths",
            "premium_challenges",
            "detailed_progress_history",
            "creator_tools",
            "advanced_performance_tracking",
            "extended_music_lab",
            "advanced_learning_insights",
            "priority_new_features",
            "pro_badge",
        ],
        "usage_limits": {
            "ai_coach_daily": 500,
            "ai_lessons_daily": 100,
            "music_lab_daily": 1000,
            "practice_sessions_daily": 1000,
        },
    },
}


def get_plan(plan_id: str) -> dict | None:
    return PLANS.get(plan_id)


def get_plan_or_default(plan_id: str) -> dict:
    return PLANS.get(plan_id, PLANS[FREE])


def get_all_plans() -> list[dict]:
    return [PLANS[p] for p in ALL_PLANS]


def get_entitlements(plan_id: str) -> list[str]:
    return get_plan_or_default(plan_id)["feature_entitlements"]


def get_usage_limit(plan_id: str, limit_key: str) -> int:
    plan = get_plan_or_default(plan_id)
    return plan["usage_limits"].get(limit_key, 0)


def has_entitlement(plan_id: str, feature: str) -> bool:
    return feature in get_entitlements(plan_id)


def format_price_inr(price: int) -> str:
    if price == 0:
        return "Free"
    return f"\u20b9{price:,}/month"


def get_plan_level(plan_id: str) -> int:
    """Return numeric level for plan comparison. Higher = more features."""
    levels = {FREE: 0, STUDENT: 1, PREMIUM: 2, PRO: 3}
    return levels.get(plan_id, 0)
