"""Progress Engine — VISWAH 3.0 Gamification Intelligence Layer.

Analyzes real user activity to produce:
- XP calculation (no duplicates)
- Level progression
- Achievement System 2.0
- Streak 2.0 with calendar
- Skill tree scores
- Music identity profile
- Daily missions 2.0

All values grounded in actual practice_sessions, achievements, progress, and user_courses data.
No fake statistics — insufficient data yields "Not enough practice data yet".
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

# ── XP Sources ────────────────────────────────────────────────────

XP_VALUES = {
    "practice_session": 10,
    "high_score": 25,
    "complete_lesson": 50,
    "complete_quiz": 20,
    "daily_mission": 30,
    "streak_7": 100,
    "streak_30": 250,
    "streak_100": 1000,
    "achievement_unlock": 50,
}

# ── Level Thresholds ──────────────────────────────────────────────

LEVEL_THRESHOLDS = [
    (0, "Music Explorer"),
    (100, "Aspiring Musician"),
    (300, "Student Musician"),
    (600, "Beginner Musician"),
    (1000, "Practicing Musician"),
    (1500, "Skilled Musician"),
    (2200, "Dedicated Musician"),
    (3000, "Advanced Musician"),
    (4000, "Advanced Performer"),
    (5500, "Music Specialist"),
    (7500, "Expert Musician"),
    (10000, "Music Master"),
    (15000, "Grand Master"),
    (25000, "Legendary Musician"),
]

# ── Achievement Definitions 2.0 ───────────────────────────────────

ACHIEVEMENT_DEFINITIONS = {
    # FIRST STEPS
    "first_note_played": {
        "title": "First Note Played",
        "description": "Played your very first note in the Piano",
        "icon": "🎵",
        "category": "first_steps",
        "xp_reward": 25,
    },
    "first_practice": {
        "title": "First Practice Completed",
        "description": "Completed your first practice session",
        "icon": "🎯",
        "category": "first_steps",
        "xp_reward": 25,
    },
    "first_raga_learned": {
        "title": "First Raga Learned",
        "description": "Explored your first Indian classical raga",
        "icon": "🎶",
        "category": "first_steps",
        "xp_reward": 50,
    },
    "first_lesson": {
        "title": "First Lesson Completed",
        "description": "Finished your first lesson",
        "icon": "📖",
        "category": "first_steps",
        "xp_reward": 50,
    },
    "first_quiz": {
        "title": "First Quiz Passed",
        "description": "Completed your first quiz successfully",
        "icon": "📝",
        "category": "first_steps",
        "xp_reward": 30,
    },
    "first_enrollment": {
        "title": "First Course Enrolled",
        "description": "Enrolled in your first course",
        "icon": "📚",
        "category": "first_steps",
        "xp_reward": 20,
    },
    "first_vocal_analysis": {
        "title": "First Vocal Analysis",
        "description": "Analyzed your voice for the first time",
        "icon": "🎤",
        "category": "first_steps",
        "xp_reward": 25,
    },
    # CONSISTENCY
    "streak_7": {
        "title": "7 Day Streak",
        "description": "Practiced 7 days in a row",
        "icon": "🔥",
        "category": "consistency",
        "xp_reward": 100,
    },
    "streak_30": {
        "title": "30 Day Streak",
        "description": "Practiced 30 days in a row",
        "icon": "🔥",
        "category": "consistency",
        "xp_reward": 250,
    },
    "streak_100": {
        "title": "100 Day Streak",
        "description": "Practiced 100 days in a row — legendary!",
        "icon": "💎",
        "category": "consistency",
        "xp_reward": 1000,
    },
    "practice_regular": {
        "title": "Regular Practitioner",
        "description": "Completed 10 practice sessions",
        "icon": "📅",
        "category": "consistency",
        "xp_reward": 50,
    },
    "consistency_champion": {
        "title": "Consistency Champion",
        "description": "Completed 20 practice sessions",
        "icon": "🏆",
        "category": "consistency",
        "xp_reward": 100,
    },
    "practice_master": {
        "title": "Practice Master",
        "description": "Completed 50 practice sessions",
        "icon": "👑",
        "category": "consistency",
        "xp_reward": 200,
    },
    # INSTRUMENTS
    "first_piano": {
        "title": "Piano Explorer",
        "description": "Played your first piano session",
        "icon": "🎹",
        "category": "instruments",
        "xp_reward": 25,
    },
    "piano_enthusiast": {
        "title": "Piano Enthusiast",
        "description": "Completed 10 piano sessions",
        "icon": "🎹",
        "category": "instruments",
        "xp_reward": 75,
    },
    "first_drum": {
        "title": "Drum Beginner",
        "description": "Played your first drum session",
        "icon": "🥁",
        "category": "instruments",
        "xp_reward": 25,
    },
    "drum_enthusiast": {
        "title": "Drum Enthusiast",
        "description": "Completed 10 drum sessions",
        "icon": "🥁",
        "category": "instruments",
        "xp_reward": 75,
    },
    "first_metronome": {
        "title": "Rhythm Seeker",
        "description": "Used the metronome for the first time",
        "icon": "⏱",
        "category": "instruments",
        "xp_reward": 25,
    },
    "first_raga": {
        "title": "Raga Beginner",
        "description": "Started learning ragas",
        "icon": "🎵",
        "category": "instruments",
        "xp_reward": 25,
    },
    "raga_explorer": {
        "title": "Raga Explorer",
        "description": "Completed 10 raga sessions",
        "icon": "🎵",
        "category": "instruments",
        "xp_reward": 75,
    },
    # VOCAL
    "vocal_enthusiast": {
        "title": "Vocal Enthusiast",
        "description": "Completed 5 vocal guru sessions",
        "icon": "🎤",
        "category": "vocal",
        "xp_reward": 50,
    },
    "voice_tracker": {
        "title": "Pitch Improver",
        "description": "Completed 3 speech analysis sessions",
        "icon": "🗣",
        "category": "vocal",
        "xp_reward": 40,
    },
    # WORLD MUSIC
    "world_explorer": {
        "title": "World Explorer",
        "description": "Explored 3 world music traditions",
        "icon": "🌍",
        "category": "world_music",
        "xp_reward": 50,
    },
    "tradition_collector": {
        "title": "Tradition Collector",
        "description": "Explored 6 world music traditions",
        "icon": "🌍",
        "category": "world_music",
        "xp_reward": 100,
    },
    # EAR TRAINING (Music Lab)
    "first_ear_training": {
        "title": "First Ear Training",
        "description": "Completed your first ear training exercise",
        "icon": "👂",
        "category": "ear_training",
        "xp_reward": 25,
    },
    "ear_training_regular": {
        "title": "Ear Training Regular",
        "description": "Completed 10 ear training exercises",
        "icon": "👂",
        "category": "ear_training",
        "xp_reward": 75,
    },
    "ear_training_master": {
        "title": "Ear Training Master",
        "description": "Completed 50 ear training exercises",
        "icon": "👂",
        "category": "ear_training",
        "xp_reward": 200,
    },
    # MASTERY
    "score_champion": {
        "title": "Score Champion",
        "description": "Maintained 90%+ average across 5+ scored sessions",
        "icon": "⭐",
        "category": "mastery",
        "xp_reward": 150,
    },
    "perfect_performance": {
        "title": "Perfect Performance",
        "description": "Achieved 100% score on any exercise",
        "icon": "💯",
        "category": "mastery",
        "xp_reward": 100,
    },
    "music_master": {
        "title": "Music Master",
        "description": "Reached level 10",
        "icon": "👑",
        "category": "mastery",
        "xp_reward": 500,
    },
}

# ── Daily Mission Templates ───────────────────────────────────────

MISSION_TEMPLATES = [
    {
        "id": "piano_practice",
        "title": "Practice Piano",
        "description": "Play a 10-minute piano session",
        "xp_reward": 30,
        "route": "/piano",
        "activity": "piano",
    },
    {
        "id": "vocal_practice",
        "title": "Vocal Training",
        "description": "Complete a vocal guru session",
        "xp_reward": 30,
        "route": "/vocal-guru",
        "activity": "vocal_guru",
    },
    {
        "id": "ear_training",
        "title": "Ear Training",
        "description": "Complete one ear training exercise",
        "xp_reward": 30,
        "route": "/music-lab",
        "activity": "note_recognition",
    },
    {
        "id": "rhythm_work",
        "title": "Rhythm Practice",
        "description": "Practice with the metronome or drums",
        "xp_reward": 30,
        "route": "/metronome",
        "activity": "metronome",
    },
    {
        "id": "raga_exploration",
        "title": "Raga Exploration",
        "description": "Learn about a new raga",
        "xp_reward": 30,
        "route": "/ragas",
        "activity": "raga",
    },
    {
        "id": "world_music",
        "title": "World Music Discovery",
        "description": "Explore a world music tradition",
        "xp_reward": 30,
        "route": "/world-music",
        "activity": None,
    },
    {
        "id": "speech_analysis",
        "title": "Pitch Analysis",
        "description": "Analyze your vocal pitch",
        "xp_reward": 30,
        "route": "/speech-analysis",
        "activity": "speech_analysis",
    },
    {
        "id": "lesson_study",
        "title": "Study a Lesson",
        "description": "Complete a lesson from any course",
        "xp_reward": 30,
        "route": "/courses",
        "activity": "lesson",
    },
    {
        "id": "drum_practice",
        "title": "Drum Practice",
        "description": "Play a drum session",
        "xp_reward": 30,
        "route": "/drums",
        "activity": "drums",
    },
    {
        "id": "music_lab_all",
        "title": "Full Music Lab",
        "description": "Try 3 different Music Lab exercises",
        "xp_reward": 50,
        "route": "/music-lab",
        "activity": None,
    },
]

# ── Skill Definitions ─────────────────────────────────────────────

SKILL_DEFINITIONS = {
    "pitch": {
        "label": "Pitch & Voice",
        "icon": "🎤",
        "activities": ["vocal_guru", "speech_analysis"],
    },
    "rhythm": {
        "label": "Rhythm & Timing",
        "icon": "🥁",
        "activities": ["drums", "metronome"],
    },
    "melody": {
        "label": "Melody & Notes",
        "icon": "🎹",
        "activities": ["piano", "raga"],
    },
    "theory": {
        "label": "Music Theory",
        "icon": "📖",
        "activities": ["lesson", "quiz"],
    },
    "consistency": {
        "label": "Practice Consistency",
        "icon": "🔥",
        "activities": [],
    },
    "instruments": {
        "label": "Instrument Skills",
        "icon": "🎵",
        "activities": ["piano", "drums"],
    },
    "world_music": {
        "label": "World Music",
        "icon": "🌍",
        "activities": [],
    },
    "creativity": {
        "label": "Creativity",
        "icon": "✨",
        "activities": ["lyrics"],
    },
    "ear_training": {
        "label": "Ear Training",
        "icon": "👂",
        "activities": ["note_recognition", "interval_training", "rhythm_training", "melody_recognition", "musical_memory", "world_music_listening"],
    },
    "vocal_technique": {
        "label": "Vocal Technique",
        "icon": "🎶",
        "activities": ["vocal_guru"],
    },
}

# ── XP Calculation ────────────────────────────────────────────────


def compute_xp(db: Session, user_id: int) -> dict:
    """Compute total XP from all real user activity. No duplicates."""
    total_xp = 0
    breakdown = {}

    # Practice sessions: +10 XP each
    session_count = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id
    ).scalar() or 0
    practice_xp = session_count * XP_VALUES["practice_session"]
    total_xp += practice_xp
    breakdown["practice_sessions"] = {"count": session_count, "xp": practice_xp}

    # High scores (>90): +25 XP each
    high_scores = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.score.isnot(None),
        PracticeSession.score >= 90,
    ).scalar() or 0
    high_score_xp = high_scores * XP_VALUES["high_score"]
    total_xp += high_score_xp
    breakdown["high_scores"] = {"count": high_scores, "xp": high_score_xp}

    # Completed lessons: +50 XP each
    lessons_completed = db.query(func.count(Progress.id)).filter(
        Progress.user_id == user_id,
        Progress.completed == True,
    ).scalar() or 0
    lesson_xp = lessons_completed * XP_VALUES["complete_lesson"]
    total_xp += lesson_xp
    breakdown["lessons_completed"] = {"count": lessons_completed, "xp": lesson_xp}

    # Quizzes (practice sessions with activity=quiz): +20 XP each
    quizzes = db.query(func.count(PracticeSession.id)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.activity == "quiz",
    ).scalar() or 0
    quiz_xp = quizzes * XP_VALUES["complete_quiz"]
    total_xp += quiz_xp
    breakdown["quizzes_completed"] = {"count": quizzes, "xp": quiz_xp}

    # Achievements: +50 XP each
    achievement_count = db.query(func.count(Achievement.id)).filter(
        Achievement.user_id == user_id,
    ).scalar() or 0
    achievement_xp = achievement_count * XP_VALUES["achievement_unlock"]
    total_xp += achievement_xp
    breakdown["achievements"] = {"count": achievement_count, "xp": achievement_xp}

    # Streak bonuses
    streak_data = compute_streak_v2(db, user_id)
    streak_bonus = 0
    if streak_data["current_streak"] >= 100:
        streak_bonus += XP_VALUES["streak_100"]
    elif streak_data["current_streak"] >= 30:
        streak_bonus += XP_VALUES["streak_30"]
    elif streak_data["current_streak"] >= 7:
        streak_bonus += XP_VALUES["streak_7"]

    # Add longest streak bonuses too
    if streak_data["longest_streak"] >= 100:
        streak_bonus += XP_VALUES["streak_100"]
    elif streak_data["longest_streak"] >= 30:
        streak_bonus += XP_VALUES["streak_30"]
    elif streak_data["longest_streak"] >= 7:
        streak_bonus += XP_VALUES["streak_7"]

    total_xp += streak_bonus
    breakdown["streak_bonus"] = {"xp": streak_bonus}

    return {"total_xp": total_xp, "breakdown": breakdown}


# ── Level Calculation ─────────────────────────────────────────────


def compute_level(total_xp: int) -> dict:
    """Convert XP to level and title."""
    level = 1
    title = LEVEL_THRESHOLDS[0][1]
    xp_for_current = 0
    xp_for_next = LEVEL_THRESHOLDS[0][0]

    for i, (threshold, t) in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            level = i + 1
            title = t
            xp_for_current = threshold
            if i + 1 < len(LEVEL_THRESHOLDS):
                xp_for_next = LEVEL_THRESHOLDS[i + 1][0]
            else:
                xp_for_next = threshold + 5000

    xp_in_level = total_xp - xp_for_current
    xp_needed = xp_for_next - xp_for_current
    progress_pct = min(100, int((xp_in_level / max(xp_needed, 1)) * 100))

    return {
        "level": level,
        "title": title,
        "xp_in_level": xp_in_level,
        "xp_for_next": xp_needed,
        "progress_percent": progress_pct,
        "total_xp": total_xp,
    }


# ── Streak 2.0 ───────────────────────────────────────────────────


def compute_streak_v2(db: Session, user_id: int) -> dict:
    """Compute streak with calendar data."""
    now = datetime.now(UTC)
    today = now.date()

    sessions = db.query(PracticeSession.created_at).filter(
        PracticeSession.user_id == user_id,
    ).order_by(PracticeSession.created_at.desc()).all()

    if not sessions:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "total_practice_days": 0,
            "weekly_consistency": 0,
            "monthly_consistency": 0,
            "calendar": [],
        }

    # Unique practice days
    practice_days = set()
    for (created_at,) in sessions:
        practice_days.add(created_at.date())

    sorted_days = sorted(practice_days, reverse=True)

    # Current streak
    current_streak = 0
    check_date = today
    for day in sorted_days:
        if day == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        elif day == check_date - timedelta(days=1):
            # Allow yesterday as start if today hasn't been practiced yet
            if current_streak == 0:
                check_date = day
                current_streak = 1
                check_date -= timedelta(days=1)
            else:
                break
        else:
            break

    # Longest streak
    longest_streak = 0
    streak = 1
    for i in range(1, len(sorted_days)):
        if (sorted_days[i - 1] - sorted_days[i]).days == 1:
            streak += 1
        else:
            longest_streak = max(longest_streak, streak)
            streak = 1
    longest_streak = max(longest_streak, streak, current_streak)

    # Weekly consistency (last 7 days)
    week_start = today - timedelta(days=6)
    week_days = sum(1 for d in practice_days if week_start <= d <= today)
    weekly_consistency = round((week_days / 7) * 100)

    # Monthly consistency (last 30 days)
    month_start = today - timedelta(days=29)
    month_days = sum(1 for d in practice_days if month_start <= d <= today)
    monthly_consistency = round((month_days / 30) * 100)

    # Calendar (last 30 days)
    calendar = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        calendar.append({
            "date": d.isoformat(),
            "practiced": d in practice_days,
            "is_today": d == today,
        })

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "total_practice_days": len(practice_days),
        "weekly_consistency": weekly_consistency,
        "monthly_consistency": monthly_consistency,
        "calendar": calendar,
    }


# ── Skill Tree ───────────────────────────────────────────────────


def compute_skill_tree(db: Session, user_id: int) -> list[dict]:
    """Compute skill scores from real practice data."""
    now = datetime.now(UTC)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    all_sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id,
    ).all()

    def _is_recent(created_at, cutoff):
        """Handle both naive and aware datetimes."""
        if created_at is None:
            return False
        if created_at.tzinfo is None:
            cutoff_naive = cutoff.replace(tzinfo=None)
            return created_at >= cutoff_naive
        return created_at >= cutoff

    recent_sessions = [s for s in all_sessions if _is_recent(s.created_at, thirty_days_ago)]
    week_sessions = [s for s in all_sessions if _is_recent(s.created_at, seven_days_ago)]

    skills = []

    for skill_id, defn in SKILL_DEFINITIONS.items():
        if skill_id == "consistency":
            # Derived from streak
            streak = compute_streak_v2(db, user_id)
            score = min(100, streak["monthly_consistency"])
            trend = "improving" if streak["weekly_consistency"] > streak["monthly_consistency"] else "stable"
            if streak["current_streak"] == 0 and streak["total_practice_days"] > 0:
                trend = "needs_focus"
            skills.append({
                "id": skill_id,
                "label": defn["label"],
                "icon": defn["icon"],
                "score": score,
                "trend": trend,
                "sessions": streak["total_practice_days"],
            })
            continue

        if skill_id == "world_music":
            # Count world music activities
            wm_count = sum(1 for s in all_sessions if "world" in (s.activity or ""))
            recent_wm = sum(1 for s in recent_sessions if "world" in (s.activity or ""))
            score = min(100, wm_count * 10)
            trend = "improving" if recent_wm > 0 else ("stable" if wm_count > 0 else "needs_focus")
            skills.append({
                "id": skill_id,
                "label": defn["label"],
                "icon": defn["icon"],
                "score": score,
                "trend": trend,
                "sessions": wm_count,
            })
            continue

        if skill_id == "creativity":
            lyr_count = sum(1 for s in all_sessions if s.activity == "lyrics")
            score = min(100, lyr_count * 15)
            trend = "improving" if lyr_count > 0 else "needs_focus"
            skills.append({
                "id": skill_id,
                "label": defn["label"],
                "icon": defn["icon"],
                "score": score,
                "trend": trend,
                "sessions": lyr_count,
            })
            continue

        # Activity-based skills
        matching = [s for s in all_sessions if s.activity in defn["activities"]]
        recent_matching = [s for s in recent_sessions if s.activity in defn["activities"]]
        week_matching = [s for s in week_sessions if s.activity in defn["activities"]]

        scored = [s for s in matching if s.score is not None]
        avg_score = (sum(s.score for s in scored) / len(scored)) if scored else 0

        session_count = len(matching)
        score = 0
        if session_count > 0:
            # Score = weighted: 50% avg_score + 30% session frequency + 20% recent activity
            freq_score = min(100, session_count * 5)
            recent_score = min(100, len(recent_matching) * 10)
            score = min(100, int(avg_score * 0.5 + freq_score * 0.3 + recent_score * 0.2))

        trend = "stable"
        if len(recent_matching) > len(matching) * 0.4:
            trend = "improving"
        elif len(week_matching) == 0 and session_count > 0:
            trend = "needs_focus"

        skills.append({
            "id": skill_id,
            "label": defn["label"],
            "icon": defn["icon"],
            "score": score,
            "trend": trend,
            "sessions": session_count,
        })

    return skills


# ── Music Identity Profile ────────────────────────────────────────


def compute_music_identity(db: Session, user_id: int) -> dict:
    """Build learner identity from real activity."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    xp_data = compute_xp(db, user_id)
    level_data = compute_level(xp_data["total_xp"])
    skills = compute_skill_tree(db, user_id)
    streak = compute_streak_v2(db, user_id)
    sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id
    ).all()

    # Primary style from most practiced activity
    activity_counts = {}
    for s in sessions:
        act = s.activity or "unknown"
        activity_counts[act] = activity_counts.get(act, 0) + 1

    ACTIVITY_TO_STYLE = {
        "vocal_guru": "Vocal",
        "speech_analysis": "Vocal",
        "piano": "Piano",
        "drums": "Percussion",
        "metronome": "Rhythm",
        "raga": "Indian Classical",
        "sargam": "Indian Classical",
        "lesson": "Theory",
        "note_recognition": "Ear Training",
        "interval_training": "Ear Training",
        "rhythm_training": "Ear Training",
        "melody_recognition": "Ear Training",
        "musical_memory": "Ear Training",
        "world_music_listening": "World Music",
    }

    style_counts = {}
    for act, count in activity_counts.items():
        style = ACTIVITY_TO_STYLE.get(act, "General")
        style_counts[style] = style_counts.get(style, 0) + count

    sorted_styles = sorted(style_counts.items(), key=lambda x: x[1], reverse=True)
    primary_style = sorted_styles[0][0] if sorted_styles else "Getting Started"

    # Strengths and improving
    sorted_skills = sorted(skills, key=lambda s: s["score"], reverse=True)
    strengths = [s["label"] for s in sorted_skills if s["score"] >= 40][:2]
    improving = [s["label"] for s in sorted_skills if s["trend"] == "improving"][:2]
    needs_focus = [s["label"] for s in sorted_skills if s["trend"] == "needs_focus"][:2]

    # Practice personality
    total_days = streak["total_practice_days"]
    if total_days == 0:
        personality = "Newcomer"
    elif streak["longest_streak"] >= 30:
        personality = "Dedicated Practitioner"
    elif streak["longest_streak"] >= 7:
        personality = "Consistent Learner"
    elif total_days >= 10:
        personality = "Curious Explorer"
    else:
        personality = "Getting Started"

    return {
        "name": user.username,
        "level": level_data["level"],
        "level_title": level_data["title"],
        "total_xp": xp_data["total_xp"],
        "primary_style": primary_style,
        "strengths": strengths if strengths else ["Not enough data yet"],
        "improving": improving if improving else ["Not enough data yet"],
        "needs_focus": needs_focus if needs_focus else [],
        "practice_personality": personality,
        "total_sessions": len(sessions),
        "current_streak": streak["current_streak"],
        "longest_streak": streak["longest_streak"],
    }


# ── Daily Missions 2.0 ──────────────────────────────────────────


def generate_daily_missions(db: Session, user_id: int) -> list[dict]:
    """Generate daily missions based on user activity and weaknesses."""
    now = datetime.now(UTC)
    today = now.date()

    # Deterministic selection using date as seed
    seed_str = f"{user_id}:{today.isoformat()}"
    seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)

    # Get recent activity to avoid repeating
    recent = db.query(PracticeSession.activity).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.created_at >= now - timedelta(days=3),
    ).all()
    recent_activities = {r[0] for r in recent}

    # Get skills to find weak areas
    skills = compute_skill_tree(db, user_id)
    weak_skills = [s for s in skills if s["trend"] == "needs_focus" or s["score"] < 30]

    # Select missions: 2 from templates, 1 skill-focused
    missions = []

    # Skill-focused mission (if weak areas exist)
    if weak_skills:
        weak = weak_skills[seed_hash % len(weak_skills)]
        skill_missions = {
            "pitch": {"title": "Pitch Training", "description": "Work on your pitch accuracy", "route": "/speech-analysis"},
            "rhythm": {"title": "Rhythm Practice", "description": "Improve your timing", "route": "/metronome"},
            "melody": {"title": "Melody Practice", "description": "Practice scales and melodies", "route": "/piano"},
            "ear_training": {"title": "Ear Training", "description": "Train your musical ear", "route": "/music-lab"},
            "instruments": {"title": "Instrument Practice", "description": "Play your instrument", "route": "/piano"},
            "world_music": {"title": "World Music", "description": "Explore a new tradition", "route": "/world-music"},
            "vocal_technique": {"title": "Vocal Practice", "description": "Train your voice", "route": "/vocal-guru"},
        }
        m = skill_missions.get(weak["id"], {"title": "Practice", "description": "Keep practicing", "route": "/practice"})
        missions.append({
            "id": f"skill_{weak['id']}",
            "title": m["title"],
            "description": m["description"],
            "xp_reward": 40,
            "route": m["route"],
            "completed": False,
            "category": "skill_focus",
        })

    # Template missions (avoid recently practiced)
    available = [t for t in MISSION_TEMPLATES if t["activity"] not in recent_activities or len(missions) < 2]
    if not available:
        available = MISSION_TEMPLATES

    for i in range(2):
        idx = (seed_hash + i * 7) % len(available)
        t = available[idx]
        # Check if already completed today (handle naive datetimes from SQLite)
        today_start = datetime(today.year, today.month, today.day)
        completed_today = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == user_id,
            PracticeSession.activity == t["activity"],
            PracticeSession.created_at >= today_start,
        ).first() if t["activity"] else None

        missions.append({
            "id": t["id"],
            "title": t["title"],
            "description": t["description"],
            "xp_reward": t["xp_reward"],
            "route": t["route"],
            "completed": completed_today is not None,
            "category": "daily",
        })

    return missions[:3]


# ── Progress Summary ──────────────────────────────────────────────


def compute_progress_summary(db: Session, user_id: int) -> dict:
    """Master function — returns complete gamification data."""
    xp_data = compute_xp(db, user_id)
    level_data = compute_level(xp_data["total_xp"])
    streak = compute_streak_v2(db, user_id)
    skills = compute_skill_tree(db, user_id)
    identity = compute_music_identity(db, user_id)
    missions = generate_daily_missions(db, user_id)

    # Achievements with unlock status
    unlocked = {a.achievement_type for a in db.query(Achievement).filter(
        Achievement.user_id == user_id
    ).all()}

    achievements = []
    for ach_id, defn in ACHIEVEMENT_DEFINITIONS.items():
        achievements.append({
            "id": ach_id,
            "title": defn["title"],
            "description": defn["description"],
            "icon": defn["icon"],
            "category": defn["category"],
            "xp_reward": defn["xp_reward"],
            "unlocked": ach_id in unlocked,
        })

    return {
        "level": level_data["level"],
        "level_title": level_data["title"],
        "xp": xp_data["total_xp"],
        "xp_breakdown": xp_data["breakdown"],
        "xp_in_level": level_data["xp_in_level"],
        "xp_for_next": level_data["xp_for_next"],
        "xp_progress_percent": level_data["progress_percent"],
        "rank": level_data["title"],
        "streak": streak,
        "skills": skills,
        "identity": identity,
        "missions": missions,
        "achievements": achievements,
    }


# ── Leaderboard ───────────────────────────────────────────────────


def compute_leaderboard(db: Session, user_id: int, leaderboard_type: str = "weekly_xp", limit: int = 50) -> dict:
    """Compute leaderboard from real user activity. Only public info exposed."""
    now = datetime.now(UTC)
    today = now.date()

    all_users = db.query(User).all()
    entries = []

    for user in all_users:
        uid = user.id

        if leaderboard_type == "weekly_xp":
            # XP earned in last 7 days
            seven_days_ago = now - timedelta(days=7)
            recent_sessions = db.query(PracticeSession).filter(
                PracticeSession.user_id == uid,
                PracticeSession.created_at >= seven_days_ago.replace(tzinfo=None) if seven_days_ago.tzinfo else seven_days_ago,
            ).all()
            recent_lessons = db.query(Progress).filter(
                Progress.user_id == uid,
                Progress.completed == True,
                Progress.completed_at >= seven_days_ago.replace(tzinfo=None) if seven_days_ago.tzinfo else seven_days_ago,
            ).all() if hasattr(Progress, 'completed_at') else []
            recent_achievements = db.query(Achievement).filter(
                Achievement.user_id == uid,
                Achievement.achieved_at >= seven_days_ago.replace(tzinfo=None) if seven_days_ago.tzinfo else seven_days_ago,
            ).all()

            week_xp = (
                len(recent_sessions) * XP_VALUES["practice_session"]
                + len(recent_achievements) * XP_VALUES["achievement_unlock"]
                + len(recent_lessons) * XP_VALUES["complete_lesson"]
            )

            # High score bonus
            high_scores = sum(1 for s in recent_sessions if s.score is not None and s.score >= 90)
            week_xp += high_scores * XP_VALUES["high_score"]

            entries.append({
                "user_id": uid,
                "username": user.username,
                "score": week_xp,
                "metric": "XP",
            })

        elif leaderboard_type == "monthly_practice":
            # Practice minutes in last 30 days
            thirty_days_ago = now - timedelta(days=30)
            thirty_naive = thirty_days_ago.replace(tzinfo=None) if thirty_days_ago.tzinfo else thirty_days_ago
            sessions = db.query(PracticeSession).filter(
                PracticeSession.user_id == uid,
                PracticeSession.created_at >= thirty_naive,
            ).all()
            total_minutes = sum(s.duration_seconds for s in sessions) // 60

            entries.append({
                "user_id": uid,
                "username": user.username,
                "score": total_minutes,
                "metric": "minutes",
            })

        elif leaderboard_type == "music_lab_score":
            # Average score on music lab exercises
            lab_activities = [
                "note_recognition", "interval_training", "rhythm_training",
                "melody_recognition", "musical_memory", "world_music_listening",
            ]
            lab_sessions = db.query(PracticeSession).filter(
                PracticeSession.user_id == uid,
                PracticeSession.activity.in_(lab_activities),
                PracticeSession.score.isnot(None),
            ).all()
            avg_score = (sum(s.score for s in lab_sessions) / len(lab_sessions)) if lab_sessions else 0

            entries.append({
                "user_id": uid,
                "username": user.username,
                "score": round(avg_score, 1),
                "metric": "avg score",
            })

        elif leaderboard_type == "consistency":
            # Practice days in last 30 days
            streak_data = compute_streak_v2(db, uid)
            entries.append({
                "user_id": uid,
                "username": user.username,
                "score": streak_data["total_practice_days"],
                "metric": "days",
            })

    # Sort descending
    entries.sort(key=lambda e: e["score"], reverse=True)

    # Add rank
    for i, entry in enumerate(entries):
        entry["rank"] = i + 1
        entry["is_current_user"] = entry["user_id"] == user_id

    # Find current user position
    current_user_entry = next((e for e in entries if e["is_current_user"]), None)

    return {
        "leaderboard_type": leaderboard_type,
        "entries": entries[:limit],
        "total_users": len(entries),
        "current_user_rank": current_user_entry["rank"] if current_user_entry else None,
        "current_user_score": current_user_entry["score"] if current_user_entry else 0,
    }


# ── Journey Map ───────────────────────────────────────────────────

JOURNEY_STAGES = [
    {
        "id": "beginner",
        "title": "Beginner",
        "description": "Your music journey starts here",
        "icon": "🌱",
        "xp_required": 0,
        "milestones": ["Complete first practice", "Play first note", "Enroll in a course"],
    },
    {
        "id": "foundation",
        "title": "Foundation",
        "description": "Building your musical basics",
        "icon": "🎵",
        "xp_required": 200,
        "milestones": ["Complete 5 lessons", "Learn 1 raga", "Try Piano and Drums"],
    },
    {
        "id": "skill_building",
        "title": "Skill Building",
        "description": "Developing your musical abilities",
        "icon": "🎸",
        "xp_required": 1000,
        "milestones": ["Reach 7-day streak", "Score 90%+ on exercises", "Explore world music"],
    },
    {
        "id": "specialization",
        "title": "Specialization",
        "description": "Finding your musical identity",
        "icon": "🎭",
        "xp_required": 3000,
        "milestones": ["Master an instrument", "Complete 50 sessions", "Train your ear"],
    },
    {
        "id": "mastery",
        "title": "Mastery",
        "description": "Becoming a versatile musician",
        "icon": "👑",
        "xp_required": 8000,
        "milestones": ["Reach level 10", "30-day streak", "Help others learn"],
    },
    {
        "id": "maestro",
        "title": "VISWAH Maestro",
        "description": "A true global musician",
        "icon": "🏆",
        "xp_required": 20000,
        "milestones": ["Master all instruments", "100-day streak", "Complete all traditions"],
    },
]


def compute_journey_map(db: Session, user_id: int) -> dict:
    """Compute the learner's journey progression through stages."""
    xp_data = compute_xp(db, user_id)
    total_xp = xp_data["total_xp"]
    level_data = compute_level(total_xp)
    streak = compute_streak_v2(db, user_id)
    skills = compute_skill_tree(db, user_id)

    sessions = db.query(PracticeSession).filter(
        PracticeSession.user_id == user_id,
    ).all()

    lessons_completed = db.query(func.count(Progress.id)).filter(
        Progress.user_id == user_id,
        Progress.completed == True,
    ).scalar() or 0

    enrollments = db.query(func.count(UserCourse.id)).filter(
        UserCourse.user_id == user_id,
    ).scalar() or 0

    # Compute milestone completion
    milestones_met = {
        "first_practice": len(sessions) > 0,
        "first_note": any(s.activity == "piano" for s in sessions),
        "first_enrollment": enrollments > 0,
        "five_lessons": lessons_completed >= 5,
        "learned_raga": any(s.activity in ("raga", "sargam") for s in sessions),
        "tried_instruments": len({s.activity for s in sessions if s.activity in ("piano", "drums")}) >= 2,
        "seven_day_streak": streak["longest_streak"] >= 7,
        "high_scores": any((s.score or 0) >= 90 for s in sessions),
        "world_music": any("world" in (s.activity or "") for s in sessions),
        "thirty_day_streak": streak["longest_streak"] >= 30,
        "fifty_sessions": len(sessions) >= 50,
        "ear_training": any(s.activity in ("note_recognition", "interval_training", "rhythm_training", "melody_recognition", "musical_memory") for s in sessions),
        "level_10": level_data["level"] >= 10,
        "hundred_day_streak": streak["longest_streak"] >= 100,
    }

    # Determine current stage
    current_stage_idx = 0
    for i, stage in enumerate(JOURNEY_STAGES):
        if total_xp >= stage["xp_required"]:
            current_stage_idx = i

    # Build stage progression
    stages = []
    for i, stage in enumerate(JOURNEY_STAGES):
        is_completed = total_xp >= stage["xp_required"]
        is_current = i == current_stage_idx
        is_locked = not is_completed and not is_current

        # Progress within stage
        if is_completed:
            progress_pct = 100
        elif is_current:
            prev_xp = JOURNEY_STAGES[i - 1]["xp_required"] if i > 0 else 0
            needed = stage["xp_required"] - prev_xp
            earned = total_xp - prev_xp
            progress_pct = min(100, int((earned / max(needed, 1)) * 100))
        else:
            progress_pct = 0

        stages.append({
            "id": stage["id"],
            "title": stage["title"],
            "description": stage["description"],
            "icon": stage["icon"],
            "xp_required": stage["xp_required"],
            "completed": is_completed,
            "current": is_current,
            "locked": is_locked,
            "progress_percent": progress_pct,
            "milestones": stage["milestones"],
        })

    return {
        "current_stage": JOURNEY_STAGES[current_stage_idx]["id"],
        "current_stage_title": JOURNEY_STAGES[current_stage_idx]["title"],
        "total_xp": total_xp,
        "level": level_data["level"],
        "stages": stages,
        "milestones_met": milestones_met,
    }


# ── Challenge Completion ──────────────────────────────────────────


def complete_challenge(db: Session, user_id: int, mission_id: str) -> dict:
    """Mark a daily challenge as completed and award XP."""
    missions = generate_daily_missions(db, user_id)
    mission = next((m for m in missions if m["id"] == mission_id), None)

    if not mission:
        return {"error": "Challenge not found", "success": False}

    if mission["completed"]:
        return {"error": "Challenge already completed", "success": False, "mission": mission}

    # Record as a practice session to track completion
    session = PracticeSession(
        user_id=user_id,
        activity="daily_mission",
        activity_id=mission_id,
        duration_seconds=0,
        score=None,
        completed=True,
    )
    db.add(session)
    db.commit()

    return {
        "success": True,
        "xp_earned": mission["xp_reward"],
        "mission": {**mission, "completed": True},
    }


# ── Gamification Profile ──────────────────────────────────────────


def compute_gamification_profile(db: Session, user_id: int) -> dict:
    """Master gamification profile endpoint — all data in one call."""
    summary = compute_progress_summary(db, user_id)
    journey = compute_journey_map(db, user_id)
    leaderboard = compute_leaderboard(db, user_id, "weekly_xp")

    return {
        "summary": summary,
        "journey": journey,
        "leaderboard": {
            "rank": leaderboard["current_user_rank"],
            "total_users": leaderboard["total_users"],
            "weekly_xp": leaderboard["current_user_score"],
        },
    }
