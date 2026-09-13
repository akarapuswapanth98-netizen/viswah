from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.models import Achievement, PracticeSession, Progress, User, UserCourse
from models.schemas import (
    AchievementResponse,
    PracticeHistoryItem,
    PracticeSessionCreate,
    PracticeSessionResponse,
    PracticeStatsResponse,
    PracticeSummaryResponse,
    TopicStats,
)
from routes.auth import get_current_user
from services.entitlement_engine import check_usage_or_denied

router = APIRouter(prefix="/api/practice", tags=["Practice"])

# Music Lab activities that have their own usage limit
MUSIC_LAB_ACTIVITIES = [
    "note_recognition", "interval_training", "rhythm_training",
    "melody_recognition", "musical_memory", "world_music_listening",
]


@router.post("/sessions", response_model=PracticeSessionResponse, status_code=201)
def create_practice_session(
    session_data: PracticeSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_music_lab = session_data.activity in MUSIC_LAB_ACTIVITIES

    # Atomically check + increment quotas BEFORE creating session.
    # If creation fails, we roll back the increments.
    practice_result = check_usage_or_denied(db, current_user.id, "practice_sessions_daily")
    if practice_result["limit_reached"]:
        raise HTTPException(
            status_code=429,
            detail={
                "limit_reached": True,
                "usage": practice_result["current_usage"],
                "limit": practice_result["daily_limit"],
                "upgrade_available": practice_result["upgrade_available"],
                "feature": "practice_sessions_daily",
            },
        )

    music_result = None
    if is_music_lab:
        music_result = check_usage_or_denied(db, current_user.id, "music_lab_daily")
        if music_result["limit_reached"]:
            # Roll back practice increment
            from sqlalchemy import text as sa_text
            from datetime import UTC as _UTC, datetime as _dt
            today = _dt.now(_UTC).strftime("%Y-%m-%d")
            db.execute(
                sa_text("UPDATE usage_records SET count = count - 1 WHERE user_id = :uid AND usage_type = :ut AND usage_date = :ud"),
                {"uid": current_user.id, "ut": "practice_sessions_daily", "ud": today},
            )
            db.commit()
            raise HTTPException(
                status_code=429,
                detail={
                    "limit_reached": True,
                    "usage": music_result["current_usage"],
                    "limit": music_result["daily_limit"],
                    "upgrade_available": music_result["upgrade_available"],
                    "feature": "music_lab_daily",
                },
            )

    # Create session — on failure, roll back increments
    try:
        new_session = PracticeSession(
            user_id=current_user.id,
            activity=session_data.activity,
            activity_id=session_data.activity_id,
            duration_seconds=session_data.duration_seconds,
            score=session_data.score,
            completed=session_data.completed,
            metadata_json=session_data.metadata_json,
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
    except Exception:
        # Roll back quota increments
        from sqlalchemy import text as sa_text
        from datetime import UTC as _UTC2, datetime as _dt2
        today = _dt2.now(_UTC2).strftime("%Y-%m-%d")
        db.rollback()
        db.execute(
            sa_text("UPDATE usage_records SET count = count - 1 WHERE user_id = :uid AND usage_type = :ut AND usage_date = :ud"),
            {"uid": current_user.id, "ut": "practice_sessions_daily", "ud": today},
        )
        if is_music_lab:
            db.execute(
                sa_text("UPDATE usage_records SET count = count - 1 WHERE user_id = :uid AND usage_type = :ut AND usage_date = :ud"),
                {"uid": current_user.id, "ut": "music_lab_daily", "ud": today},
            )
        db.commit()
        raise

    _check_and_award_achievements(current_user.id, db)

    return new_session


@router.get("/sessions", response_model=list[PracticeSessionResponse])
def get_practice_sessions(
    activity: str | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PracticeSession).filter(PracticeSession.user_id == current_user.id)
    if activity:
        query = query.filter(PracticeSession.activity == activity)
    return query.order_by(PracticeSession.created_at.desc()).limit(limit).all()


@router.get("/stats", response_model=PracticeStatsResponse)
def get_practice_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == current_user.id
    ).scalar() or 0

    total_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == current_user.id
    ).scalar() or 0

    today_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == current_user.id,
        PracticeSession.created_at >= today_start,
    ).scalar() or 0

    fav = db.query(
        PracticeSession.activity,
        func.count(PracticeSession.id).label("cnt"),
    ).filter(
        PracticeSession.user_id == current_user.id
    ).group_by(PracticeSession.activity).order_by(func.count(PracticeSession.id).desc()).first()

    weekly = []
    for i in range(7):
        day_start = today_start - timedelta(days=6 - i)
        day_end = day_start + timedelta(days=1)
        day_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.created_at >= day_start,
            PracticeSession.created_at < day_end,
        ).scalar() or 0
        weekly.append(int(day_secs // 60))

    streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has_session = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has_session:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    activities = db.query(
        PracticeSession.activity,
        func.count(PracticeSession.id),
    ).filter(
        PracticeSession.user_id == current_user.id
    ).group_by(PracticeSession.activity).all()

    return PracticeStatsResponse(
        total_sessions=total,
        total_minutes=int(total_secs // 60),
        streak_days=streak,
        today_minutes=int(today_secs // 60),
        favorite_activity=fav[0] if fav else None,
        weekly_minutes=weekly,
        activities_breakdown={a[0]: a[1] for a in activities},
    )


@router.get("/achievements", response_model=list[AchievementResponse])
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.achieved_at.desc()).all()


@router.get("/history", response_model=list[PracticeHistoryItem])
def get_practice_history(
    activity: str | None = None,
    topic: str | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get authenticated user's practice history with optional filtering"""
    query = db.query(PracticeSession).filter(PracticeSession.user_id == current_user.id)
    if activity:
        query = query.filter(PracticeSession.activity == activity)
    if topic:
        query = query.filter(PracticeSession.activity_id == topic)
    return query.order_by(PracticeSession.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/summary", response_model=PracticeSummaryResponse)
def get_practice_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive practice summary with topic statistics and improvement"""
    user_id = current_user.id
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
    all_sessions = db.query(PracticeSession.created_at).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.created_at.asc()).all()

    if all_sessions:
        streak_dates = set()
        for s in all_sessions:
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

    # Score statistics (only sessions with scores)
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

    recent_sessions = [
        PracticeHistoryItem.model_validate(s) for s in recent_raw
    ]

    # Topic statistics (group by activity + activity_id for proper isolation)
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

        # Get first and latest score for this topic (scoped to activity)
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

        # Calculate trend and improvement only with sufficient data
        trend = "insufficient_data"
        improvement = None

        # Get actual scored sessions for this topic (scoped to activity)
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

        topic_stats.append(TopicStats(
            topic=f"{activity_type}:{topic_name}",
            sessions=session_count,
            average_score=avg_score,
            best_score=best,
            latest_score=latest_score,
            total_minutes=total_m,
            trend=trend,
            improvement_points=improvement,
        ))

    # Activity statistics
    activity_rows = db.query(
        PracticeSession.activity,
        func.count(PracticeSession.id),
    ).filter(
        PracticeSession.user_id == user_id
    ).group_by(PracticeSession.activity).all()

    activity_stats = {a[0]: a[1] for a in activity_rows}

    return PracticeSummaryResponse(
        total_sessions=total_sessions,
        total_minutes=int(total_secs // 60),
        current_streak=current_streak,
        longest_streak=longest_streak,
        average_score=average_score,
        best_score=best_score,
        recent_score=recent_score,
        recent_sessions=recent_sessions,
        topic_statistics=topic_stats,
        activity_statistics=activity_stats,
    )


def _check_and_award_achievements(user_id: int, db: Session):
    existing = {a.achievement_type for a in db.query(Achievement).filter(Achievement.user_id == user_id).all()}
    to_add = []

    session_count = db.query(func.count(PracticeSession.id)).filter(PracticeSession.user_id == user_id).scalar() or 0
    if session_count == 1 and "first_practice" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_practice"))

    lesson_done = db.query(Progress).filter(Progress.user_id == user_id, Progress.completed == True).count()
    if lesson_done == 1 and "first_lesson" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_lesson"))

    quiz_done = db.query(Progress).filter(Progress.user_id == user_id, Progress.score > 0).count()
    if quiz_done == 1 and "first_quiz" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_quiz"))

    enrolled = db.query(UserCourse).filter(UserCourse.user_id == user_id).count()
    if enrolled == 1 and "first_enrollment" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_enrollment"))

    if session_count >= 10 and "practice_regular" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="practice_regular"))

    vocal_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "vocal_guru"
    ).scalar() or 0
    if vocal_sessions >= 5 and "vocal_enthusiast" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="vocal_enthusiast"))

    speech_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "speech_analysis"
    ).scalar() or 0
    if speech_sessions >= 3 and "voice_tracker" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="voice_tracker"))

    piano_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "piano"
    ).scalar() or 0
    if piano_sessions >= 1 and "first_piano" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_piano"))
    if piano_sessions >= 10 and "piano_enthusiast" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="piano_enthusiast"))

    drum_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "drums"
    ).scalar() or 0
    if drum_sessions >= 1 and "first_drum" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_drum"))
    if drum_sessions >= 10 and "drum_enthusiast" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="drum_enthusiast"))

    raga_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "raga"
    ).scalar() or 0
    if raga_sessions >= 1 and "first_raga" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_raga"))
    if raga_sessions >= 10 and "raga_explorer" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="raga_explorer"))

    metronome_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id, PracticeSession.activity == "metronome"
    ).scalar() or 0
    if metronome_sessions >= 1 and "first_metronome" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_metronome"))

    if session_count >= 20 and "consistency_champion" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="consistency_champion"))
    if session_count >= 50 and "practice_master" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="practice_master"))

    all_sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id, PracticeSession.score.isnot(None)
    ).all()
    if len(all_sessions) >= 5:
        avg_score = sum(s.score for s in all_sessions) / len(all_sessions)
        if avg_score >= 90 and "score_champion" not in existing:
            to_add.append(Achievement(user_id=user_id, achievement_type="score_champion"))

    # Music Lab achievements
    music_lab_activities = [
        "note_recognition", "interval_training", "rhythm_training",
        "melody_recognition", "musical_memory", "world_music_listening",
    ]
    music_lab_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.activity.in_(music_lab_activities),
    ).scalar() or 0

    if music_lab_sessions >= 1 and "first_ear_training" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="first_ear_training"))
    if music_lab_sessions >= 10 and "ear_training_regular" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="ear_training_regular"))
    if music_lab_sessions >= 50 and "ear_training_master" not in existing:
        to_add.append(Achievement(user_id=user_id, achievement_type="ear_training_master"))

    for a in to_add:
        db.add(a)
    if to_add:
        db.commit()
