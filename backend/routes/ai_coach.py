from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from services.rate_limiter import rate_limit

from database import get_db
from models.models import PracticeSession, Progress, User
from models.schemas import (
    CoachingMessageRequest,
    CoachingMessageResponse,
    CoachingRecommendation,
    CoachingSummaryResponse,
    PracticePlan,
    PracticePlanStep,
    SkillHealthItem,
)
from routes.auth import get_current_user
from services.coaching_engine import (
    build_skill_profile,
    generate_coaching_response,
    generate_coaching_summary,
    generate_practice_plan,
    generate_recommendation,
)


router = APIRouter(prefix="/api/ai-coach", tags=["AI Coach"])


def _fetch_practice_data(user_id: int, db: Session) -> dict:
    """Fetch all practice data needed for coaching analysis."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total sessions and minutes
    total_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    total_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    # Current streak
    current_streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has_session = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has_session:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Longest streak
    longest_streak = 0
    all_session_dates = db.query(PracticeSession.created_at).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.created_at.asc()).all()

    if all_session_dates:
        streak_dates = set()
        for s in all_session_dates:
            streak_dates.add(s[0].date())
        sorted_dates = sorted(streak_dates)
        temp_streak = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)

    # Score statistics
    scored_sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.score.isnot(None),
    ).order_by(PracticeSession.created_at.desc()).all()

    average_score = None
    best_score = None
    recent_score = None

    if scored_sessions:
        scores = [s.score for s in scored_sessions if s.score is not None]
        if scores:
            average_score = round(sum(scores) / len(scores), 1)
            best_score = round(max(scores), 1)
            recent_score = round(scores[0], 1)

    # Recent sessions (last 10)
    recent_raw = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.created_at.desc()).limit(10).all()

    recent_sessions = []
    for s in recent_raw:
        recent_sessions.append({
            "id": s.id,
            "activity": s.activity,
            "activity_id": s.activity_id,
            "duration_seconds": s.duration_seconds,
            "score": s.score,
            "completed": s.completed,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    # Topic statistics
    topic_stats = []
    topics_with_scores = db.query(
        PracticeSession.activity,
        PracticeSession.activity_id,
        func.count(PracticeSession.id).label("cnt"),
        func.avg(PracticeSession.score).label("avg_score"),
        func.max(PracticeSession.score).label("best_score"),
        func.sum(PracticeSession.duration_seconds).label("total_secs"),
    ).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.activity_id.isnot(None),
        PracticeSession.activity_id != "",
    ).group_by(PracticeSession.activity, PracticeSession.activity_id).all()

    for topic_row in topics_with_scores:
        activity_type = topic_row[0]
        topic_name = topic_row[1]
        session_count = topic_row[2]
        avg_score = round(float(topic_row[3]), 1) if topic_row[3] else None
        best = round(float(topic_row[4]), 1) if topic_row[4] else None
        total_m = int((topic_row[5] or 0) // 60)

        # Get first and latest score
        first_session = db.query(PracticeSession.score).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.activity == activity_type,
            PracticeSession.activity_id == topic_name,
            PracticeSession.score.isnot(None),
        ).order_by(PracticeSession.created_at.asc()).first()

        latest_session = db.query(PracticeSession.score).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.activity == activity_type,
            PracticeSession.activity_id == topic_name,
            PracticeSession.score.isnot(None),
        ).order_by(PracticeSession.created_at.desc()).first()

        first_score = float(first_session[0]) if first_session and first_session[0] is not None else None
        latest_score = float(latest_session[0]) if latest_session and latest_session[0] is not None else None

        trend = "insufficient_data"
        improvement = None

        all_topic_scores = [float(row[0]) for row in db.query(PracticeSession.score).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.activity == activity_type,
            PracticeSession.activity_id == topic_name,
            PracticeSession.score.isnot(None),
        ).order_by(PracticeSession.created_at.asc()).all()]

        scored_count = len(all_topic_scores)

        if scored_count >= 3 and first_score is not None and latest_score is not None:
            mid = scored_count // 2
            first_half_avg = sum(all_topic_scores[:mid + 1]) / (mid + 1)
            second_half_avg = sum(all_topic_scores[mid + 1:]) / max(1, scored_count - mid - 1)
            diff = second_half_avg - first_half_avg
            if diff > 3:
                trend = "improving"
            elif diff < -3:
                trend = "declining"
            else:
                trend = "stable"
            improvement = round(latest_score - first_score, 1)
        elif scored_count >= 2 and first_score is not None and latest_score is not None:
            improvement = round(latest_score - first_score, 1)
            if improvement > 3:
                trend = "improving"
            elif improvement < -3:
                trend = "declining"
            else:
                trend = "stable"

        topic_stats.append({
            "topic": f"{activity_type}:{topic_name}",
            "sessions": session_count,
            "average_score": avg_score,
            "best_score": best,
            "latest_score": latest_score,
            "total_minutes": total_m,
            "trend": trend,
            "improvement_points": improvement,
        })

    # Activity statistics
    activity_rows = db.query(
        PracticeSession.activity,
        func.count(PracticeSession.id),
    ).filter(
        PracticeSession.user_id == user_id
    ).group_by(PracticeSession.activity).all()

    activity_stats = {a[0]: a[1] for a in activity_rows}

    return {
        "summary": {
            "total_sessions": total_sessions,
            "total_minutes": int(total_secs // 60),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "average_score": average_score,
            "best_score": best_score,
            "recent_score": recent_score,
            "recent_sessions": recent_sessions,
            "topic_statistics": topic_stats,
            "activity_statistics": activity_stats,
        },
        "stats": {
            "total_sessions": total_sessions,
            "total_minutes": int(total_secs // 60),
            "streak_days": current_streak,
            "today_minutes": 0,
            "activities_breakdown": activity_stats,
        },
        "history": recent_sessions,
    }


@router.get("/summary", response_model=CoachingSummaryResponse)
def get_coaching_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the coaching summary with skill health, focus area, and today's plan."""
    practice_data = _fetch_practice_data(current_user.id, db)
    skill_profile = build_skill_profile(practice_data)
    summary = generate_coaching_summary(skill_profile)

    # Convert to response model
    skill_health = {}
    for k, v in summary["skill_health"].items():
        skill_health[k] = SkillHealthItem(**v)

    today_plan = [PracticePlanStep(**s) for s in summary["today_plan"]]

    return CoachingSummaryResponse(
        greeting=summary["greeting"],
        current_focus=summary["current_focus"],
        observation=summary["observation"],
        skill_health=skill_health,
        today_plan=today_plan,
        coaching_state=summary["coaching_state"],
        strongest_skill=summary["strongest_skill"],
        weakest_skill=summary["weakest_skill"],
        total_sessions=summary["total_sessions"],
        current_streak=summary["current_streak"],
        average_score=summary["average_score"],
        recent_score=summary["recent_score"],
    )


@router.get("/personalization-context")
def get_personalization_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get personalization context for AI Coach — feeds skill map, mission, and recommendations."""
    from services.personalization_engine import compute_personalization_summary
    return compute_personalization_summary(db, current_user.id)


@router.get("/recommendation", response_model=CoachingRecommendation)
def get_coaching_recommendation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single targeted recommendation based on practice data."""
    practice_data = _fetch_practice_data(current_user.id, db)
    skill_profile = build_skill_profile(practice_data)
    rec = generate_recommendation(skill_profile)
    return CoachingRecommendation(**rec)


@router.post("/plan", response_model=PracticePlan)
def get_practice_plan(
    duration_minutes: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a structured practice plan for a given duration."""
    duration_minutes = max(5, min(30, duration_minutes))
    practice_data = _fetch_practice_data(current_user.id, db)
    skill_profile = build_skill_profile(practice_data)
    plan = generate_practice_plan(skill_profile, duration_minutes)

    steps = [PracticePlanStep(**s) for s in plan["steps"]]
    return PracticePlan(
        duration_minutes=plan["duration_minutes"],
        total_steps=plan["total_steps"],
        steps=steps,
        coaching_state=plan["coaching_state"],
    )


@router.post("/message", response_model=CoachingMessageResponse, dependencies=[Depends(rate_limit("ai_coach"))])
def send_coaching_message(
    request: CoachingMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the coach and get a data-grounded response."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(request.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long (max 500 characters)")

    # Check quota only after validation — rejected requests must not consume quota
    from services.entitlement_engine import check_usage_or_denied
    quota = check_usage_or_denied(db, current_user.id, "ai_coach_daily")
    if quota["limit_reached"]:
        raise HTTPException(
            status_code=429,
            detail={
                "limit_reached": True,
                "usage": quota["current_usage"],
                "limit": quota["daily_limit"],
                "upgrade_available": quota["upgrade_available"],
                "feature": "ai_coach_daily",
            },
        )

    practice_data = _fetch_practice_data(current_user.id, db)
    skill_profile = build_skill_profile(practice_data)
    result = generate_coaching_response(skill_profile, request.message)

    return CoachingMessageResponse(
        type=result.get("type", "observation"),
        response=result.get("response", ""),
        recommendation=result.get("recommendation"),
        plan=result.get("plan"),
    )
