import json
import logging
import os
from datetime import UTC, datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Activity definitions with skill categories
ACTIVITIES = {
    "vocal_guru": {"label": "Vocal Guru", "icon": "🎤", "skill": "pitch", "route": "/vocal-guru"},
    "speech_analysis": {"label": "Speech Analysis", "icon": "🗣", "skill": "pitch", "route": "/speech-analysis"},
    "piano": {"label": "Piano", "icon": "🎹", "skill": "melody", "route": "/piano"},
    "drums": {"label": "Drums", "icon": "🥁", "skill": "rhythm", "route": "/drums"},
    "metronome": {"label": "Metronome", "icon": "⏱", "skill": "rhythm", "route": "/metronome"},
    "raga": {"label": "Raga Learning", "icon": "🎵", "skill": "melody", "route": "/ragas"},
    "note_recognition": {"label": "Note Recognition", "icon": "👂", "skill": "ear_training", "route": "/music-lab/notes"},
    "interval_training": {"label": "Interval Training", "icon": "🎵", "skill": "ear_training", "route": "/music-lab/intervals"},
    "rhythm_training": {"label": "Rhythm Training", "icon": "🥁", "skill": "ear_training", "route": "/music-lab/rhythm"},
    "melody_recognition": {"label": "Melody Recognition", "icon": "🎼", "skill": "ear_training", "route": "/music-lab/melody"},
    "musical_memory": {"label": "Musical Memory", "icon": "🧠", "skill": "ear_training", "route": "/music-lab/memory"},
    "world_music_listening": {"label": "World Music Listening", "icon": "🌍", "skill": "ear_training", "route": "/music-lab/world"},
}

SKILL_CATEGORIES = {
    "pitch": {"label": "Pitch & Voice", "activities": ["vocal_guru", "speech_analysis"]},
    "melody": {"label": "Melody & Notes", "activities": ["piano", "raga"]},
    "rhythm": {"label": "Rhythm & Timing", "activities": ["drums", "metronome"]},
    "ear_training": {"label": "Ear Training", "activities": ["note_recognition", "interval_training", "rhythm_training", "melody_recognition", "musical_memory", "world_music_listening"]},
}

COACHING_STATES = {
    "BEGINNER": "beginner",
    "BUILDING_CONSISTENCY": "building_consistency",
    "IMPROVING": "improving",
    "NEEDS_FOCUS": "needs_focus",
    "STRONG_PROGRESS": "strong_progress",
    "RETURNING_AFTER_GAP": "returning_after_gap",
}

# Piano exercises from Piano.jsx
PIANO_EXERCISES = [
    {"id": "c_major_scale", "title": "C Major Scale", "difficulty": "Beginner", "route": "/piano"},
    {"id": "five_finger_pattern", "title": "Five Finger Pattern", "difficulty": "Beginner", "route": "/piano"},
    {"id": "simple_melody", "title": "Simple Melody", "difficulty": "Beginner", "route": "/piano"},
    {"id": "chord_progression", "title": "Chord Progression", "difficulty": "Intermediate", "route": "/piano"},
    {"id": "arpeggio_exercise", "title": "Arpeggio Exercise", "difficulty": "Intermediate", "route": "/piano"},
    {"id": "melody_challenge", "title": "Melody Challenge", "difficulty": "Advanced", "route": "/piano"},
]

# Drums exercises from Drums.jsx
DRUMS_EXERCISES = [
    {"id": "basic_beat", "title": "Basic Beat", "difficulty": "Beginner", "route": "/drums"},
    {"id": "rock_groove", "title": "Rock Groove", "difficulty": "Beginner", "route": "/drums"},
    {"id": "hi_hat_patterns", "title": "Hi-Hat Patterns", "difficulty": "Intermediate", "route": "/drums"},
    {"id": "fill_essentials", "title": "Fill Essentials", "difficulty": "Intermediate", "route": "/drums"},
    {"id": "coordination_drill", "title": "Coordination Drill", "difficulty": "Advanced", "route": "/drums"},
    {"id": "advanced_groove", "title": "Advanced Groove", "difficulty": "Advanced", "route": "/drums"},
]

# Music Lab exercises
MUSIC_LAB_EXERCISES = [
    {"id": "note_recognition", "title": "Note Recognition", "difficulty": "Beginner", "route": "/music-lab/notes"},
    {"id": "interval_training", "title": "Interval Training", "difficulty": "Intermediate", "route": "/music-lab/intervals"},
    {"id": "rhythm_training", "title": "Rhythm Training", "difficulty": "Beginner", "route": "/music-lab/rhythm"},
    {"id": "melody_recognition", "title": "Melody Recognition", "difficulty": "Intermediate", "route": "/music-lab/melody"},
    {"id": "musical_memory", "title": "Musical Memory", "difficulty": "Intermediate", "route": "/music-lab/memory"},
    {"id": "world_music_listening", "title": "World Music Listening", "difficulty": "Advanced", "route": "/music-lab/world"},
]


def build_skill_profile(practice_data: dict) -> dict:
    """Build a comprehensive skill profile from practice data.

    Args:
        practice_data: Dict containing summary, stats, history from practice APIs

    Returns:
        Skill profile with per-skill metrics, coaching state, and signals
    """
    summary = practice_data.get("summary", {})
    stats = practice_data.get("stats", {})
    history = practice_data.get("history", [])

    total_sessions = summary.get("total_sessions", 0)
    total_minutes = summary.get("total_minutes", 0)
    current_streak = summary.get("current_streak", 0)
    best_score = summary.get("best_score")
    average_score = summary.get("average_score")
    recent_score = summary.get("recent_score")
    recent_sessions = summary.get("recent_sessions", [])
    topic_statistics = summary.get("topic_statistics", [])
    activity_statistics = summary.get("activity_statistics", {})

    # Per-skill analysis
    skill_scores = {}
    for skill_name, skill_def in SKILL_CATEGORIES.items():
        activity_ids = skill_def["activities"]
        skill_sessions = 0
        skill_scores_list = []
        skill_trends = []

        for act_id in activity_ids:
            act_count = activity_statistics.get(act_id, 0)
            skill_sessions += act_count

            for topic in topic_statistics:
                topic_name = topic.get("topic", "")
                if topic_name.startswith(f"{act_id}:"):
                    if topic.get("average_score") is not None:
                        skill_scores_list.append(topic["average_score"])
                    trend = topic.get("trend", "insufficient_data")
                    if trend != "insufficient_data":
                        skill_trends.append(trend)

        avg = round(sum(skill_scores_list) / len(skill_scores_list), 1) if skill_scores_list else None
        improving_count = sum(1 for t in skill_trends if t == "improving")
        declining_count = sum(1 for t in skill_trends if t == "declining")

        if improving_count > declining_count:
            overall_trend = "improving"
        elif declining_count > improving_count:
            overall_trend = "declining"
        elif skill_trends:
            overall_trend = "stable"
        else:
            overall_trend = "insufficient_data"

        skill_scores[skill_name] = {
            "label": skill_def["label"],
            "sessions": skill_sessions,
            "average_score": avg,
            "trend": overall_trend,
            "activities": activity_ids,
        }

    # Determine coaching state
    coaching_state = _determine_coaching_state(
        total_sessions=total_sessions,
        current_streak=current_streak,
        average_score=average_score,
        recent_score=recent_score,
        recent_sessions=recent_sessions,
    )

    # Find strongest and weakest skills
    scored_skills = {k: v for k, v in skill_scores.items() if v["average_score"] is not None}
    strongest_skill = max(scored_skills, key=lambda k: scored_skills[k]["average_score"]) if scored_skills else None
    weakest_skill = min(scored_skills, key=lambda k: scored_skills[k]["average_score"]) if scored_skills else None

    # Recently practiced activities (last 7 days)
    recent_cutoff = datetime.now(UTC) - timedelta(days=7)
    recently_practiced = set()
    for session in recent_sessions:
        created = session.get("created_at", "")
        if created:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                if dt >= recent_cutoff:
                    recently_practiced.add(session.get("activity", ""))
            except (ValueError, TypeError):
                pass

    # Neglected skills (not practiced in 7+ days but have history)
    all实践活动 = set(activity_statistics.keys())
    neglected = all实践活动 - recently_practiced

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_minutes,
        "current_streak": current_streak,
        "average_score": average_score,
        "best_score": best_score,
        "recent_score": recent_score,
        "coaching_state": coaching_state,
        "skill_scores": skill_scores,
        "strongest_skill": strongest_skill,
        "weakest_skill": weakest_skill,
        "recently_practiced": list(recently_practiced),
        "neglected_activities": list(neglected),
        "activity_statistics": activity_statistics,
        "topic_statistics": topic_statistics,
        "recent_sessions": recent_sessions,
    }


def _determine_coaching_state(total_sessions, current_streak, average_score, recent_score, recent_sessions):
    """Classify the student's current coaching state."""
    if total_sessions == 0:
        return COACHING_STATES["BEGINNER"]

    if current_streak == 0 and total_sessions > 3:
        return COACHING_STATES["RETURNING_AFTER_GAP"]

    if total_sessions < 5:
        return COACHING_STATES["BUILDING_CONSISTENCY"]

    if recent_score is not None and recent_score >= 80:
        return COACHING_STATES["STRONG_PROGRESS"]

    if average_score is not None and average_score >= 70:
        return COACHING_STATES["IMPROVING"]

    if recent_score is not None and recent_score < 60:
        return COACHING_STATES["NEEDS_FOCUS"]

    return COACHING_STATES["BUILDING_CONSISTENCY"]


def generate_coaching_summary(skill_profile: dict) -> dict:
    """Generate a structured coaching summary from the skill profile.

    Returns a dict with greeting, current_focus, observation, recommendation,
    and a today_plan.
    """
    state = skill_profile["coaching_state"]
    total = skill_profile["total_sessions"]
    streak = skill_profile["current_streak"]
    avg = skill_profile["average_score"]
    recent = skill_profile["recent_score"]
    strongest = skill_profile["strongest_skill"]
    weakest = skill_profile["weakest_skill"]
    skills = skill_profile["skill_scores"]
    neglected = skill_profile["neglected_activities"]

    # Greeting
    if state == COACHING_STATES["BEGINNER"]:
        greeting = "Welcome to your music coach. Let's start building your skills."
    elif state == COACHING_STATES["RETURNING_AFTER_GAP"]:
        greeting = f"Welcome back! It's been a little while. Let's pick up where you left off."
    elif state == COACHING_STATES["STRONG_PROGRESS"]:
        greeting = "You're making excellent progress. Let's keep the momentum going."
    elif state == COACHING_STATES["NEEDS_FOCUS"]:
        greeting = "I see some areas that could use focused attention. Let's work on that."
    elif state == COACHING_STATES["IMPROVING"]:
        greeting = "Your skills are developing well. Let's continue building."
    else:
        greeting = "Let's keep building your practice consistency."

    # Current focus
    current_focus = _determine_current_focus(skill_profile)

    # Observation
    observation = _generate_observation(skill_profile)

    # Today's plan
    today_plan = _generate_today_plan(skill_profile)

    # Skill health for display
    skill_health = {}
    for skill_name, skill_data in skills.items():
        score = skill_data.get("average_score")
        if score is not None:
            skill_health[skill_name] = {
                "label": skill_data["label"],
                "score": score,
                "trend": skill_data["trend"],
            }
        else:
            skill_health[skill_name] = {
                "label": skill_data["label"],
                "score": 0,
                "trend": "insufficient_data",
            }

    return {
        "greeting": greeting,
        "current_focus": current_focus,
        "observation": observation,
        "skill_health": skill_health,
        "today_plan": today_plan,
        "coaching_state": state,
        "strongest_skill": strongest,
        "weakest_skill": weakest,
        "total_sessions": total,
        "current_streak": streak,
        "average_score": avg,
        "recent_score": recent,
    }


def _determine_current_focus(skill_profile: dict) -> str:
    """Determine the primary focus area for today."""
    weakest = skill_profile["weakest_skill"]
    if weakest:
        skill_data = skill_profile["skill_scores"].get(weakest)
        if skill_data and skill_data.get("average_score") is not None:
            if skill_data["average_score"] < 60:
                return skill_data["label"]
            if skill_data["trend"] == "declining":
                return skill_data["label"]

    if skill_profile["neglected_activities"]:
        neg = skill_profile["neglected_activities"][0]
        act_info = ACTIVITIES.get(neg, {})
        return act_info.get("label", neg)

    if skill_profile["total_sessions"] == 0:
        return "Getting Started"

    return "Balanced Practice"


def _generate_observation(skill_profile: dict) -> str:
    """Generate a data-grounded observation about the student's progress."""
    state = skill_profile["coaching_state"]
    avg = skill_profile["average_score"]
    recent = skill_profile["recent_score"]
    streak = skill_profile["current_streak"]
    strongest = skill_profile["strongest_skill"]
    weakest = skill_profile["weakest_skill"]

    parts = []

    if state == COACHING_STATES["BEGINNER"]:
        parts.append("You're just getting started — every session counts.")
    else:
        if streak > 0:
            parts.append(f"You're on a {streak}-day streak.")
        if avg is not None:
            parts.append(f"Your average score is {avg}%.")
        if strongest:
            skill_data = skill_profile["skill_scores"].get(strongest, {})
            label = skill_data.get("label", strongest)
            if skill_data.get("average_score", 0) >= 75:
                parts.append(f"Your {label} skills are solid.")
        if weakest:
            skill_data = skill_profile["skill_scores"].get(weakest, {})
            label = skill_data.get("label", weakest)
            if skill_data.get("average_score", 0) is not None and skill_data["average_score"] < 60:
                parts.append(f"{label} needs more attention.")

    return " ".join(parts) if parts else "Keep practicing to build your profile."


def _generate_today_plan(skill_profile: dict) -> list:
    """Generate a structured practice plan for today using existing activities."""
    state = skill_profile["coaching_state"]
    plan = []

    if state == COACHING_STATES["BEGINNER"]:
        plan.append({"step": 1, "activity": "Warm Up", "duration": "2 min", "description": "Get comfortable with the interface", "route": "/piano", "activity_id": "c_major_scale"})
        plan.append({"step": 2, "activity": "Try Vocal Guru", "duration": "3 min", "description": "Basic pitch exercise", "route": "/vocal-guru", "activity_id": None})
        plan.append({"step": 3, "activity": "Rhythm Basics", "duration": "3 min", "description": "Simple beat with metronome", "route": "/metronome", "activity_id": None})
        plan.append({"step": 4, "activity": "Review", "duration": "2 min", "description": "Check your results", "route": "/practice-history", "activity_id": None})
        return plan

    weakest = skill_profile["weakest_skill"]
    strongest = skill_profile["strongest_skill"]

    plan.append({"step": 1, "activity": "Warm Up", "duration": "2 min", "description": "Start with something comfortable", "route": "/piano", "activity_id": "c_major_scale"})

    if weakest:
        skill_data = skill_profile["skill_scores"].get(weakest, {})
        activities = skill_data.get("activities", [])
        if activities:
            primary_act = activities[0]
            act_info = ACTIVITIES.get(primary_act, {})
            route = act_info.get("route", "/practice")
            plan.append({"step": 2, "activity": act_info.get("label", primary_act), "duration": "5 min", "description": f"Focus on {skill_data.get('label', weakest)}", "route": route, "activity_id": None})

    if strongest and strongest != weakest:
        skill_data = skill_profile["skill_scores"].get(strongest, {})
        activities = skill_data.get("activities", [])
        if activities:
            primary_act = activities[0]
            act_info = ACTIVITIES.get(primary_act, {})
            route = act_info.get("route", "/practice")
            plan.append({"step": 3, "activity": act_info.get("label", primary_act), "duration": "3 min", "description": "Build on your strength", "route": route, "activity_id": None})

    plan.append({"step": len(plan) + 1, "activity": "Review Results", "duration": "2 min", "description": "Compare with your previous session", "route": "/practice-history", "activity_id": None})

    return plan


def generate_recommendation(skill_profile: dict) -> dict:
    """Generate a single targeted recommendation based on skill profile."""
    state = skill_profile["coaching_state"]
    weakest = skill_profile["weakest_skill"]
    neglected = skill_profile["neglected_activities"]
    total = skill_profile["total_sessions"]
    recent = skill_profile["recent_score"]

    if total == 0:
        return {
            "type": "start_practice",
            "title": "Start Your First Practice",
            "description": "Begin with a simple piano exercise to get familiar with the interface.",
            "route": "/piano",
            "activity_id": "c_major_scale",
            "icon": "🎹",
            "reason": "Everyone starts somewhere. A quick piano warm-up is a great first step.",
        }

    if state == COACHING_STATES["RETURNING_AFTER_GAP"]:
        return {
            "type": "return_practice",
            "title": "Welcome Back Session",
            "description": "A short session to reconnect with your practice routine.",
            "route": "/vocal-guru",
            "activity_id": None,
            "icon": "🎤",
            "reason": "Starting with a familiar activity helps rebuild your practice habit.",
        }

    if weakest:
        skill_data = skill_profile["skill_scores"].get(weakest, {})
        activities = skill_data.get("activities", [])
        if activities:
            primary_act = activities[0]
            act_info = ACTIVITIES.get(primary_act, {})
            avg = skill_data.get("average_score")
            if avg is not None and avg < 60:
                return {
                    "type": "improve_skill",
                    "title": f"Focus on {skill_data.get('label', weakest)}",
                    "description": f"Your {skill_data.get('label', weakest).lower()} score is {avg}%. Let's bring it up.",
                    "route": act_info.get("route", "/practice"),
                    "activity_id": None,
                    "icon": act_info.get("icon", "🎵"),
                    "reason": f"A score of {avg}% suggests this skill area needs focused practice.",
                }

    if neglected:
        primary_neg = neglected[0]
        act_info = ACTIVITIES.get(primary_neg, {})
        return {
            "type": "try_activity",
            "title": f"Try {act_info.get('label', primary_neg)}",
            "description": f"You haven't practiced {act_info.get('label', primary_neg).lower()} recently.",
            "route": act_info.get("route", "/practice"),
            "activity_id": None,
            "icon": act_info.get("icon", "🎵"),
            "reason": "A well-rounded musician practices across multiple skill areas.",
        }

    if recent is not None and recent >= 80:
        return {
            "type": "challenge",
            "title": "Ready for a Challenge",
            "description": "Your recent scores are strong. Try something more difficult.",
            "route": "/piano",
            "activity_id": "melody_challenge",
            "icon": "🎹",
            "reason": "High scores indicate you're ready to push your limits.",
        }

    return {
        "type": "maintain_streak",
        "title": "Keep Your Streak Going",
        "description": "A quick practice session to maintain your momentum.",
        "route": "/practice",
        "activity_id": None,
        "icon": "🔥",
        "reason": "Consistency is the key to musical growth.",
    }


def generate_practice_plan(skill_profile: dict, duration_minutes: int = 10) -> dict:
    """Generate a structured practice plan for a given duration.

    Args:
        skill_profile: The student's skill profile
        duration_minutes: Target duration in minutes (5, 10, 15, 20)

    Returns:
        Structured practice plan with steps
    """
    state = skill_profile["coaching_state"]
    weakest = skill_profile["weakest_skill"]
    strongest = skill_profile["strongest_skill"]

    # Allocate time proportionally
    warmup_pct = 0.15
    focus_pct = 0.40
    strength_pct = 0.25
    review_pct = 0.20

    warmup_min = max(1, round(duration_minutes * warmup_pct))
    focus_min = max(2, round(duration_minutes * focus_pct))
    strength_min = max(1, round(duration_minutes * strength_pct))
    review_min = max(1, duration_minutes - warmup_min - focus_min - strength_min)

    steps = []

    # Step 1: Warm up
    steps.append({
        "step": 1,
        "activity": "Warm Up",
        "duration": f"{warmup_min} min",
        "description": "Gentle piano exercise to loosen up",
        "route": "/piano",
        "activity_id": "c_major_scale",
        "icon": "🎹",
        "category": "warmup",
    })

    # Step 2: Focus area (weakest skill)
    if weakest:
        skill_data = skill_profile["skill_scores"].get(weakest, {})
        activities = skill_data.get("activities", [])
        if activities:
            primary_act = activities[0]
            act_info = ACTIVITIES.get(primary_act, {})
            steps.append({
                "step": 2,
                "activity": act_info.get("label", primary_act),
                "duration": f"{focus_min} min",
                "description": f"Focused practice on {skill_data.get('label', weakest).lower()}",
                "route": act_info.get("route", "/practice"),
                "activity_id": None,
                "icon": act_info.get("icon", "🎵"),
                "category": "focus",
            })

    # Step 3: Strength area
    if strongest and strongest != weakest:
        skill_data = skill_profile["skill_scores"].get(strongest, {})
        activities = skill_data.get("activities", [])
        if activities:
            primary_act = activities[0]
            act_info = ACTIVITIES.get(primary_act, {})
            steps.append({
                "step": len(steps) + 1,
                "activity": act_info.get("label", primary_act),
                "duration": f"{strength_min} min",
                "description": "Build on your strength",
                "route": act_info.get("route", "/practice"),
                "activity_id": None,
                "icon": act_info.get("icon", "🎵"),
                "category": "strength",
            })

    # Step 4: Review
    steps.append({
        "step": len(steps) + 1,
        "activity": "Review Results",
        "duration": f"{review_min} min",
        "description": "Compare results with previous sessions",
        "route": "/practice-history",
        "activity_id": None,
        "icon": "📊",
        "category": "review",
    })

    return {
        "duration_minutes": duration_minutes,
        "total_steps": len(steps),
        "steps": steps,
        "coaching_state": state,
    }


def generate_coaching_response(skill_profile: dict, user_message: str) -> dict:
    """Generate a coaching response to a user question.

    This is the deterministic fallback that works without an AI provider.
    It analyzes the question intent and responds with real data.
    """
    message_lower = user_message.lower()
    total = skill_profile["total_sessions"]
    avg = skill_profile["average_score"]
    recent = skill_profile["recent_score"]
    weakest = skill_profile["weakest_skill"]
    strongest = skill_profile["strongest_skill"]
    state = skill_profile["coaching_state"]

    # Intent detection
    if any(word in message_lower for word in ["what should i practice", "what to practice", "what do i do", "recommend"]):
        rec = generate_recommendation(skill_profile)
        return {
            "type": "recommendation",
            "response": f"Based on your practice data: {rec['title']}. {rec['description']}",
            "recommendation": rec,
        }

    if any(word in message_lower for word in ["improve", "getting better", "progress", "improving"]):
        if state == COACHING_STATES["STRONG_PROGRESS"]:
            return {"type": "observation", "response": f"Your scores are strong (average {avg}%). You're improving steadily. Try tackling more challenging exercises to keep growing."}
        elif state == COACHING_STATES["IMPROVING"]:
            return {"type": "observation", "response": f"You're making progress with an average score of {avg}%. Keep practicing consistently and you'll see continued improvement."}
        elif state == COACHING_STATES["NEEDS_FOCUS"]:
            return {"type": "observation", "response": f"Your recent score is {recent}%. Let's focus on foundational exercises to build a stronger base."}
        else:
            return {"type": "observation", "response": "Keep practicing to build your profile. Every session helps you improve."}

    if any(word in message_lower for word in ["struggling", "weak", "difficulty", "hard", "problem"]):
        if weakest:
            skill_data = skill_profile["skill_scores"].get(weakest, {})
            label = skill_data.get("label", weakest)
            score = skill_data.get("average_score")
            if score is not None:
                return {"type": "observation", "response": f"Your {label.lower()} skills show an average score of {score}%. This is an area to focus on. Regular practice with targeted exercises will help."}
        return {"type": "observation", "response": "Without more practice data, I can't identify specific struggles. Try practicing across different activities so I can better understand your skill areas."}

    if any(word in message_lower for word in ["rhythm", "beat", "timing", "drum"]):
        rhythm_data = skill_profile["skill_scores"].get("rhythm", {})
        score = rhythm_data.get("average_score")
        if score is not None:
            if score < 70:
                msg = f"Your rhythm skills average {score}%. Try the metronome or drums for focused rhythm practice."
            else:
                msg = f"Your rhythm skills average {score}%. Your rhythm is solid. Try more complex patterns to challenge yourself."
            return {"type": "observation", "response": msg}
        return {"type": "observation", "response": "I don't have enough rhythm practice data yet. Try the metronome or drums to start building your rhythm skills."}

    if any(word in message_lower for word in ["pitch", "vocal", "sing", "voice"]):
        pitch_data = skill_profile["skill_scores"].get("pitch", {})
        score = pitch_data.get("average_score")
        if score is not None:
            if score < 70:
                msg = f"Your pitch skills average {score}%. Vocal Guru and Speech Analysis can help improve this."
            else:
                msg = f"Your pitch skills average {score}%. Your pitch control is developing well."
            return {"type": "observation", "response": msg}
        return {"type": "observation", "response": "I don't have enough vocal practice data yet. Try Vocal Guru or Speech Analysis to start tracking your pitch skills."}

    if any(word in message_lower for word in ["today", "plan", "session", "minute", "time"]):
        plan = generate_practice_plan(skill_profile)
        steps_text = " → ".join([f"{s['activity']} ({s['duration']})" for s in plan["steps"]])
        return {"type": "plan", "response": f"Here's your {plan['duration_minutes']}-minute practice plan: {steps_text}", "plan": plan}

    if any(word in message_lower for word in ["raga", "melody", "scale"]):
        melody_data = skill_profile["skill_scores"].get("melody", {})
        score = melody_data.get("average_score")
        if score is not None:
            return {"type": "observation", "response": f"Your melody skills average {score}%. Try Raga Learning for Indian melodic frameworks, or Piano for note accuracy."}
        return {"type": "observation", "response": "I don't have enough melody practice data yet. Try Raga Learning or Piano to build your melodic skills."}

    # Default response
    if total == 0:
        return {"type": "observation", "response": "Welcome! Start with a practice session so I can learn your skill areas and provide personalized coaching."}

    if avg is not None and avg >= 70:
        msg = f"Based on your {total} practice sessions, you're making good progress. Ask me about specific skills, or request a practice plan."
    else:
        msg = f"Based on your {total} practice sessions, there are areas to focus on. Ask me about specific skills, or request a practice plan."

    return {"type": "observation", "response": msg}
