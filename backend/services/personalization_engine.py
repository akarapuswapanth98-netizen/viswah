"""Personalization Engine — Central intelligence for VISWAH 3.0.

Analyzes existing learner data to produce structured insights:
- Skill map across 10 skill dimensions
- Learner state classification (reuses AI Coach states)
- Personalized recommendations
- Daily missions
- Streak and consistency metrics

All calculations are deterministic and grounded in real data.
No fake values are ever produced.
"""

import hashlib
import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.models import (
    Achievement,
    Course,
    Lesson,
    PracticeSession,
    Progress,
    User,
    UserCourse,
)

# ── Skill definitions ──────────────────────────────────────────────

SKILL_DEFINITIONS = {
    "pitch": {
        "id": "pitch",
        "label": "Pitch & Voice",
        "icon": "🎤",
        "activities": ["vocal_guru", "speech_analysis"],
        "description": "Accuracy and control of vocal pitch",
    },
    "rhythm": {
        "id": "rhythm",
        "label": "Rhythm & Timing",
        "icon": "🥁",
        "activities": ["drums", "metronome"],
        "description": "Sense of beat, timing, and rhythmic accuracy",
    },
    "melody": {
        "id": "melody",
        "label": "Melody & Notes",
        "icon": "🎹",
        "activities": ["piano", "raga"],
        "description": "Note accuracy, melodic phrasing, and scale knowledge",
    },
    "theory": {
        "id": "theory",
        "label": "Music Theory",
        "icon": "📖",
        "activities": ["lesson", "quiz"],
        "description": "Understanding of music concepts and terminology",
    },
    "consistency": {
        "id": "consistency",
        "label": "Practice Consistency",
        "icon": "🔥",
        "activities": [],  # Derived from streak and frequency
        "description": "How regularly you practice",
    },
    "instruments": {
        "id": "instruments",
        "label": "Instrument Skills",
        "icon": "🎵",
        "activities": ["piano", "drums"],
        "description": "Proficiency across multiple instruments",
    },
    "world_music": {
        "id": "world_music",
        "label": "World Music Knowledge",
        "icon": "🌍",
        "activities": [],  # No DB tracking
        "description": "Understanding of global musical traditions",
    },
    "creativity": {
        "id": "creativity",
        "label": "Creativity",
        "icon": "✨",
        "activities": [],  # No DB tracking
        "description": "Songwriting and creative expression",
    },
    "ear_training": {
        "id": "ear_training",
        "label": "Ear Training",
        "icon": "👂",
        "activities": ["speech_analysis", "note_recognition", "interval_training", "rhythm_training", "melody_recognition", "musical_memory", "world_music_listening"],
        "description": "Ability to recognize notes, intervals, rhythms, and melodies",
    },
    "vocal_technique": {
        "id": "vocal_technique",
        "label": "Vocal Technique",
        "icon": "🎶",
        "activities": ["vocal_guru"],
        "description": "Breathing, control, and vocal exercises",
    },
}

# Minimum sessions needed for a measurable skill
MIN_SESSIONS_FOR_SKILL = 1
MIN_SESSIONS_FOR_TREND = 3

# Minimum sessions for consistency scoring
MIN_SESSIONS_FOR_CONSISTENCY = 3

# Activities that produce scores
SCORED_ACTIVITIES = {"vocal_guru", "speech_analysis", "piano", "drums", "metronome", "raga", "lesson", "quiz", "note_recognition", "interval_training", "rhythm_training", "melody_recognition", "musical_memory", "world_music_listening"}


# ── Core analysis functions ─────────────────────────────────────────


def compute_skill_score(
    db: Session,
    user_id: int,
    skill_id: str,
    activity_stats: dict,
    topic_statistics: list,
) -> dict:
    """Compute a single skill score from practice data.

    Returns a dict with score, trend, sessions, and metadata.
    score is None if insufficient data.
    """
    skill_def = SKILL_DEFINITIONS.get(skill_id)
    if not skill_def:
        return _insufficient_skill(skill_id)

    activities = skill_def["activities"]

    # Skills with no DB tracking
    if not activities:
        if skill_id == "consistency":
            return _compute_consistency_score(db, user_id, activity_stats)
        return _insufficient_skill(skill_id)

    # Count sessions across relevant activities
    total_sessions = 0
    all_scores = []
    all_trends = []

    for act in activities:
        act_count = activity_stats.get(act, 0)
        total_sessions += act_count

        for topic in topic_statistics:
            topic_name = topic.get("topic", "")
            if topic_name.startswith(f"{act}:"):
                if topic.get("average_score") is not None:
                    all_scores.append(topic["average_score"])
                trend = topic.get("trend", "insufficient_data")
                if trend != "insufficient_data":
                    all_trends.append(trend)

    if total_sessions < MIN_SESSIONS_FOR_SKILL:
        return {
            "id": skill_id,
            "label": skill_def["label"],
            "icon": skill_def["icon"],
            "score": None,
            "trend": "insufficient_data",
            "sessions": total_sessions,
            "description": skill_def["description"],
            "insufficient_data_message": _get_insufficient_message(skill_id, total_sessions),
        }

    # Compute average score
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else None

    # Compute trend
    improving = sum(1 for t in all_trends if t == "improving")
    declining = sum(1 for t in all_trends if t == "declining")
    if improving > declining:
        trend = "improving"
    elif declining > improving:
        trend = "declining"
    elif all_trends:
        trend = "stable"
    else:
        trend = "insufficient_data"

    return {
        "id": skill_id,
        "label": skill_def["label"],
        "icon": skill_def["icon"],
        "score": avg_score,
        "trend": trend,
        "sessions": total_sessions,
        "description": skill_def["description"],
        "insufficient_data_message": None,
    }


def _compute_consistency_score(db: Session, user_id: int, activity_stats: dict) -> dict:
    """Compute consistency score from streak and practice frequency."""
    total_sessions = sum(v for k, v in activity_stats.items() if k != "_recent")
    skill_def = SKILL_DEFINITIONS["consistency"]

    if total_sessions < MIN_SESSIONS_FOR_CONSISTENCY:
        return {
            "id": "consistency",
            "label": skill_def["label"],
            "icon": skill_def["icon"],
            "score": None,
            "trend": "insufficient_data",
            "sessions": total_sessions,
            "description": skill_def["description"],
            "insufficient_data_message": f"Complete {MIN_SESSIONS_FOR_CONSISTENCY} practice sessions to see your consistency score.",
        }

    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Current streak
    streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Sessions this week
    week_start = today_start - timedelta(days=today_start.weekday())
    sessions_this_week = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= week_start,
    ).scalar() or 0

    # Unique practice days (last 30 days)
    thirty_days_ago = today_start - timedelta(days=30)
    recent_dates = db.query(func.date(PracticeSession.created_at)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= thirty_days_ago,
    ).distinct().count() or 0

    # Score: 0-100 based on streak and frequency
    streak_score = min(40, streak * 8)  # Max 40 from streak
    frequency_score = min(40, sessions_this_week * 10)  # Max 40 from weekly frequency
    coverage_score = min(20, recent_dates * 2)  # Max 20 from 30-day coverage

    score = streak_score + frequency_score + coverage_score
    score = min(100, max(0, score))

    # Trend: compare this week vs last week
    last_week_start = week_start - timedelta(days=7)
    last_week_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= last_week_start,
        PracticeSession.created_at < week_start,
    ).scalar() or 0

    if sessions_this_week > last_week_sessions:
        trend = "improving"
    elif sessions_this_week < last_week_sessions:
        trend = "declining"
    else:
        trend = "stable"

    return {
        "id": "consistency",
        "label": skill_def["label"],
        "icon": skill_def["icon"],
        "score": round(score, 1),
        "trend": trend,
        "sessions": total_sessions,
        "description": skill_def["description"],
        "insufficient_data_message": None,
    }


def _insufficient_skill(skill_id: str) -> dict:
    """Return an insufficient-data skill entry."""
    skill_def = SKILL_DEFINITIONS.get(skill_id, {})
    return {
        "id": skill_id,
        "label": skill_def.get("label", skill_id),
        "icon": skill_def.get("icon", "🎵"),
        "score": None,
        "trend": "insufficient_data",
        "sessions": 0,
        "description": skill_def.get("description", ""),
        "insufficient_data_message": _get_insufficient_message(skill_id, 0),
    }


def _get_insufficient_message(skill_id: str, current_sessions: int) -> str:
    """Generate a helpful message for skills with insufficient data."""
    messages = {
        "pitch": "Practice Vocal Guru or Speech Analysis to unlock your pitch score.",
        "rhythm": "Practice Drums or Metronome to unlock your rhythm score.",
        "melody": "Practice Piano or Raga Learning to unlock your melody score.",
        "theory": "Complete lessons or quizzes to unlock your theory score.",
        "consistency": "Complete a few practice sessions to see your consistency score.",
        "instruments": "Practice Piano or Drums to unlock your instrument skills.",
        "world_music": "Explore World Music traditions to unlock this skill.",
        "creativity": "Use the Lyrics Creator to unlock your creativity score.",
        "ear_training": "Practice Speech Analysis to unlock your ear training score.",
        "vocal_technique": "Practice Vocal Guru to unlock your vocal technique score.",
    }
    base = messages.get(skill_id, "Start practicing to unlock this skill.")
    if current_sessions > 0:
        return f"Almost there! {base}"
    return base


# ── Learner state ───────────────────────────────────────────────────


def classify_learner_state(
    total_sessions: int,
    current_streak: int,
    average_score: float | None,
    recent_score: float | None,
) -> str:
    """Classify learner state using the existing AI Coach state system.

    States: beginner, building_consistency, improving, needs_focus,
            strong_progress, returning_after_gap
    """
    if total_sessions == 0:
        return "beginner"
    if current_streak == 0 and total_sessions > 3:
        return "returning_after_gap"
    if total_sessions < 5:
        return "building_consistency"
    if recent_score is not None and recent_score >= 80:
        return "strong_progress"
    if average_score is not None and average_score >= 70:
        return "improving"
    if recent_score is not None and recent_score < 60:
        return "needs_focus"
    return "building_consistency"


# ── Recommendations ─────────────────────────────────────────────────


def generate_recommendations(
    db: Session,
    user_id: int,
    skill_map: list,
    learner_state: str,
    activity_stats: dict,
    recent_sessions: list,
    enrolled_courses: list,
    progress_list: list,
) -> list:
    """Generate personalized recommendations based on learner data.

    Returns a list of recommendation dicts, each with:
    id, type, title, description, reason, route, icon, priority
    """
    recs = []

    # 1. Continue partially completed course
    for ec in enrolled_courses:
        if ec.get("progress_pct", 0) < 100 and ec.get("completed_lessons", 0) < ec.get("total_lessons", 0):
            lessons = db.query(Lesson).filter(Lesson.course_id == ec["id"]).order_by(Lesson.order).all()
            for lesson in lessons:
                done = any(p.get("lesson_id") == lesson.id and p.get("completed") for p in progress_list)
                if not done:
                    recs.append({
                        "id": f"continue_lesson_{lesson.id}",
                        "type": "lesson",
                        "title": lesson.title,
                        "description": f"Continue {ec['title']}",
                        "reason": f"You're {ec.get('progress_pct', 0)}% through this course. Keep going!",
                        "route": f"/lessons/{lesson.id}",
                        "icon": "📖",
                        "priority": 1,
                        "difficulty": ec.get("difficulty", "beginner"),
                        "estimated_duration": f"{lesson.duration_minutes or 10} min",
                    })
                    break
            if len(recs) >= 2:
                break

    # 2. Practice weakest skill
    weakest = next((s for s in skill_map if s["id"] != "consistency" and s.get("score") is not None and s["score"] < 60), None)
    if weakest:
        skill_def = SKILL_DEFINITIONS.get(weakest["id"], {})
        activities = skill_def.get("activities", [])
        if activities:
            primary_act = activities[0]
            route_map = {
                "vocal_guru": "/vocal-guru",
                "speech_analysis": "/speech-analysis",
                "piano": "/piano",
                "drums": "/drums",
                "metronome": "/metronome",
                "raga": "/ragas",
                "lesson": "/courses",
                "quiz": "/courses",
            }
            route = route_map.get(primary_act, "/practice")
            recs.append({
                "id": f"practice_{weakest['id']}",
                "type": "practice",
                "title": f"Practice {weakest['label']}",
                "description": f"Your {weakest['label'].lower()} score is {weakest['score']}%",
                "reason": "Focusing on your weakest skill will have the biggest impact.",
                "route": route,
                "icon": weakest.get("icon", "🎵"),
                "priority": 2,
                "difficulty": "adaptive",
                "estimated_duration": "8 min",
            })

    # 3. Try an untried activity
    all_activities = ["vocal_guru", "speech_analysis", "piano", "drums", "metronome", "raga"]
    practiced = set(k for k, v in activity_stats.items() if k != "_recent" and v > 0)
    untried = [a for a in all_activities if a not in practiced]
    if untried and len(recs) < 4:
        next_act = untried[0]
        route_map = {
            "vocal_guru": "/vocal-guru",
            "speech_analysis": "/speech-analysis",
            "piano": "/piano",
            "drums": "/drums",
            "metronome": "/metronome",
            "raga": "/ragas",
        }
        labels = {
            "vocal_guru": "Vocal Guru",
            "speech_analysis": "Speech Analysis",
            "piano": "Piano",
            "drums": "Drums",
            "metronome": "Metronome",
            "raga": "Raga Learning",
        }
        recs.append({
            "id": f"try_{next_act}",
            "type": "explore",
            "title": f"Try {labels.get(next_act, next_act)}",
            "description": f"You haven't practiced {labels.get(next_act, next_act)} yet.",
            "reason": "A well-rounded musician practices across multiple skill areas.",
            "route": route_map.get(next_act, "/practice"),
            "icon": "✨",
            "priority": 3,
            "difficulty": "all levels",
            "estimated_duration": "5 min",
        })

    # 4. Maintain streak
    if learner_state == "returning_after_gap":
        recs.append({
            "id": "return_practice",
            "type": "practice",
            "title": "Welcome Back Session",
            "description": "A short session to reconnect with your practice routine.",
            "reason": "Starting with a familiar activity helps rebuild your habit.",
            "route": "/vocal-guru",
            "icon": "🔥",
            "priority": 1,
            "difficulty": "all levels",
            "estimated_duration": "5 min",
        })

    # 5. Review weak quiz scores
    if progress_list:
        weak_quizzes = [p for p in progress_list if p.get("completed") and p.get("score") is not None and 0 < p["score"] < 70]
        if weak_quizzes and len(recs) < 5:
            p = weak_quizzes[0]
            recs.append({
                "id": f"review_lesson_{p.get('lesson_id')}",
                "type": "review",
                "title": f"Review: {p.get('lesson_title', 'Lesson')}",
                "description": f"Your score was {p['score']}%. Reviewing will strengthen retention.",
                "reason": "Revisiting material you've struggled with improves long-term learning.",
                "route": f"/lessons/{p.get('lesson_id')}",
                "icon": "📝",
                "priority": 3,
                "difficulty": "adaptive",
                "estimated_duration": "10 min",
            })

    # Sort by priority
    recs.sort(key=lambda r: r.get("priority", 5))
    return recs[:5]


# ── Daily Mission ───────────────────────────────────────────────────


def generate_daily_mission(
    db: Session,
    user_id: int,
    skill_map: list,
    learner_state: str,
    activity_stats: dict,
    recent_sessions: list,
    enrolled_courses: list,
) -> dict:
    """Generate a personalized daily mission.

    Returns a mission dict with title, description, route, etc.
    The mission is deterministic — same data produces same mission.
    """
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Check if user already practiced today
    today_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= today_start,
    ).scalar() or 0

    total_sessions = sum(v for k, v in activity_stats.items() if k != "_recent")

    # Use a daily seed so the same mission is returned all day
    seed = int(hashlib.md5(f"{user_id}_{today_start.date().isoformat()}".encode()).hexdigest()[:8], 16)

    # Beginner missions
    if total_sessions == 0 or learner_state == "beginner":
        missions = [
            {"title": "Your First Note", "description": "Play a simple melody on the virtual piano", "route": "/piano", "activity_id": "c_major_scale", "icon": "🎹", "estimated_duration": "5 min", "difficulty": "Beginner", "reason": "Everyone starts with the basics"},
            {"title": "Find Your Pitch", "description": "Try a Vocal Guru exercise to discover your voice", "route": "/vocal-guru", "activity_id": None, "icon": "🎤", "estimated_duration": "5 min", "difficulty": "Beginner", "reason": "Vocal exercises help you understand your range"},
            {"title": "Feel the Beat", "description": "Practice a simple rhythm with the metronome", "route": "/metronome", "activity_id": None, "icon": "⏱", "estimated_duration": "3 min", "difficulty": "Beginner", "reason": "Timing is the foundation of music"},
        ]
        return missions[seed % len(missions)]

    # Build missions based on learner state
    missions = []

    # Weakest skill mission
    weakest = next((s for s in skill_map if s["id"] != "consistency" and s.get("score") is not None), None)
    if weakest:
        skill_def = SKILL_DEFINITIONS.get(weakest["id"], {})
        activities = skill_def.get("activities", [])
        if activities:
            route_map = {
                "vocal_guru": "/vocal-guru",
                "speech_analysis": "/speech-analysis",
                "piano": "/piano",
                "drums": "/drums",
                "metronome": "/metronome",
                "raga": "/ragas",
            }
            act = activities[0]
            missions.append({
                "title": f"{weakest['label']} Focus",
                "description": f"Spend a few minutes improving your {weakest['label'].lower()}",
                "route": route_map.get(act, "/practice"),
                "activity_id": None,
                "icon": weakest.get("icon", "🎵"),
                "estimated_duration": "8 min",
                "difficulty": "Adaptive",
                "reason": f"Your {weakest['label'].lower()} score is {weakest['score']}%. Small focused sessions add up.",
            })

    # Course continuation mission
    for ec in enrolled_courses:
        if ec.get("progress_pct", 0) < 100:
            missions.append({
                "title": f"Continue {ec['title']}",
                "description": f"You're {ec.get('progress_pct', 0)}% through this course",
                "route": f"/courses/{ec['id']}",
                "activity_id": None,
                "icon": "📚",
                "estimated_duration": f"{ec.get('total_lessons', 1) - ec.get('completed_lessons', 0)} lessons left",
                "difficulty": ec.get("difficulty", "beginner"),
                "reason": "Finishing what you started builds momentum",
            })
            break

    # Streak mission
    if learner_state == "returning_after_gap":
        missions.append({
            "title": "Rebuild Your Streak",
            "description": "A quick 5-minute session to get back on track",
            "route": "/vocal-guru",
            "activity_id": None,
            "icon": "🔥",
            "estimated_duration": "5 min",
            "difficulty": "All levels",
            "reason": "Consistency matters more than intensity. Start small.",
        })

    # Exploration mission
    if total_sessions > 5:
        missions.append({
            "title": "Explore Something New",
            "description": "Try an activity you haven't practiced much",
            "route": "/practice",
            "activity_id": None,
            "icon": "✨",
            "estimated_duration": "5 min",
            "difficulty": "All levels",
            "reason": "Stepping outside your comfort zone accelerates growth",
        })

    if not missions:
        missions.append({
            "title": "Keep the Momentum",
            "description": "A focused practice session on your strongest skill",
            "route": "/practice",
            "activity_id": None,
            "icon": "🎵",
            "estimated_duration": "8 min",
            "difficulty": "Adaptive",
            "reason": "Building on strengths reinforces good habits",
        })

    # Pick a mission based on daily seed
    mission = missions[seed % len(missions)]
    mission["id"] = f"mission_{today_start.date().isoformat()}"
    mission["completion_criteria"] = "Complete the activity to finish today's mission"
    return mission


# ── Streak and consistency ─────────────────────────────────────────


def compute_streak_data(db: Session, user_id: int) -> dict:
    """Compute comprehensive streak and consistency data."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    # Current streak
    current_streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Longest streak
    longest_streak = 0
    all_dates = db.query(PracticeSession.created_at).filter(
        PracticeSession.user_id == user_id
    ).order_by(PracticeSession.created_at.asc()).all()

    if all_dates:
        streak_dates = set(s[0].date() for s in all_dates)
        sorted_dates = sorted(streak_dates)
        temp = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                temp += 1
            else:
                longest_streak = max(longest_streak, temp)
                temp = 1
        longest_streak = max(longest_streak, temp)

    # Sessions this week
    week_start = today_start - timedelta(days=today_start.weekday())
    sessions_this_week = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= week_start,
    ).scalar() or 0

    # Practice days this week
    practice_days_this_week = db.query(func.count(func.distinct(func.date(PracticeSession.created_at)))).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= week_start,
    ).scalar() or 0

    # Total minutes
    total_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    # Today's minutes
    today_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= today_start,
    ).scalar() or 0

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_sessions": total_sessions,
        "total_minutes": int(total_secs // 60),
        "today_minutes": int(today_secs // 60),
        "sessions_this_week": sessions_this_week,
        "practice_days_this_week": practice_days_this_week,
        "days_in_week": 7,
    }


# ── Full personalization summary ───────────────────────────────────


def compute_personalization_summary(db: Session, user_id: int) -> dict:
    """Compute the complete personalization summary for a user.

    This is the main entry point that produces all personalization data.
    """
    # Fetch all learner data
    total_sessions = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    total_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0

    # Streak
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    current_streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Score statistics
    scored_sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.score.isnot(None),
    ).order_by(PracticeSession.created_at.desc()).all()

    average_score = None
    recent_score = None
    if scored_sessions:
        scores = [s.score for s in scored_sessions if s.score is not None]
        if scores:
            average_score = round(sum(scores) / len(scores), 1)
            recent_score = round(scores[0], 1)

    # Recent sessions
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

    # Compute skill map
    skill_map = []
    for skill_id in SKILL_DEFINITIONS:
        skill = compute_skill_score(db, user_id, skill_id, activity_stats, topic_stats)
        skill_map.append(skill)

    # Classify learner state
    learner_state = classify_learner_state(total_sessions, current_streak, average_score, recent_score)

    # Find strongest/weakest measurable skills
    measurable = [s for s in skill_map if s.get("score") is not None]
    strongest_skill = max(measurable, key=lambda s: s["score"]) if measurable else None
    weakest_skill = min(measurable, key=lambda s: s["score"]) if measurable else None

    # Recently improved
    recently_improved = [s["id"] for s in skill_map if s.get("trend") == "improving"]

    # Needs attention
    needs_attention = [s["id"] for s in skill_map if s.get("score") is not None and s["score"] < 60]

    # Insufficient data skills
    insufficient_data_skills = [s["id"] for s in skill_map if s.get("score") is None]

    # Streak data
    streak_data = compute_streak_data(db, user_id)

    # Enrolled courses
    enrolled_courses = []
    user_courses = db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
    for uc in user_courses:
        course = db.query(Course).filter(Course.id == uc.course_id).first()
        if not course:
            continue
        lessons = db.query(Lesson).filter(Lesson.course_id == course.id).all()
        completed_count = 0
        for lesson in lessons:
            p = db.query(Progress).filter(
                Progress.user_id == user_id,
                Progress.lesson_id == lesson.id,
                Progress.completed == True,
            ).first()
            if p:
                completed_count += 1
        total = len(lessons)
        enrolled_courses.append({
            "id": course.id,
            "title": course.title,
            "instrument": course.instrument,
            "difficulty": course.difficulty,
            "total_lessons": total,
            "completed_lessons": completed_count,
            "progress_pct": round((completed_count / total * 100) if total > 0 else 0),
            "enrolled_at": uc.enrolled_at.isoformat() if uc.enrolled_at else None,
        })

    # Progress list
    progress_records = db.query(Progress).filter(Progress.user_id == user_id).all()
    progress_list = []
    for p in progress_records:
        lesson = db.query(Lesson).filter(Lesson.id == p.lesson_id).first()
        progress_list.append({
            "id": p.id,
            "lesson_id": p.lesson_id,
            "lesson_title": lesson.title if lesson else "Unknown",
            "completed": p.completed,
            "score": p.score,
            "time_spent_minutes": p.time_spent_minutes,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        })

    # Generate recommendations
    recommendations = generate_recommendations(
        db, user_id, skill_map, learner_state, activity_stats,
        recent_sessions, enrolled_courses, progress_list,
    )

    # Generate daily mission
    daily_mission = generate_daily_mission(
        db, user_id, skill_map, learner_state, activity_stats,
        recent_sessions, enrolled_courses,
    )

    return {
        "coaching_state": learner_state,
        "skill_map": skill_map,
        "strongest_skill": strongest_skill["id"] if strongest_skill else None,
        "weakest_skill": weakest_skill["id"] if weakest_skill else None,
        "recently_improved": recently_improved,
        "needs_attention": needs_attention,
        "insufficient_data_skills": insufficient_data_skills,
        "total_sessions": total_sessions,
        "total_minutes": int(total_secs // 60),
        "average_score": average_score,
        "recent_score": recent_score,
        "current_streak": current_streak,
        "recommendations": recommendations,
        "daily_mission": daily_mission,
        "streak_data": streak_data,
    }
