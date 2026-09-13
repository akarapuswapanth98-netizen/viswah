"""Gamification API Routes — VISWAH Phase 12.

Endpoints:
- GET /api/progress/summary — full gamification data
- GET /api/progress/skills — skill tree
- GET /api/progress/achievements — achievements with unlock status
- GET /api/progress/missions — daily missions
- GET /api/progress/identity — music identity profile
- GET /api/progress/leaderboard — leaderboard data
- GET /api/progress/journey — journey map
- POST /api/progress/challenge/{mission_id}/complete — complete a daily challenge
- GET /api/progress/gamification-profile — combined gamification profile
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.models import User
from routes.auth import get_current_user
from services.progress_engine import (
    ACHIEVEMENT_DEFINITIONS,
    compute_gamification_profile,
    compute_journey_map,
    compute_leaderboard,
    compute_music_identity,
    compute_progress_summary,
    compute_skill_tree,
    complete_challenge,
    generate_daily_missions,
)


def compute_achievements(db, user_id):
    """Get all achievements with unlock status."""
    from models.models import Achievement as AchModel
    unlocked = {a.achievement_type for a in db.query(AchModel).filter(
        AchModel.user_id == user_id
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
    return achievements


def compute_identity(db, user_id):
    return compute_music_identity(db, user_id)


router = APIRouter(prefix="/api/progress", tags=["Gamification"])


@router.get("/summary")
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_progress_summary(db, current_user.id)


@router.get("/skills")
def get_skill_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = compute_skill_tree(db, current_user.id)
    return {"skills": skills}


@router.get("/achievements")
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    achievements = compute_achievements(db, current_user.id)
    unlocked = sum(1 for a in achievements if a["unlocked"])
    return {
        "achievements": achievements,
        "total": len(achievements),
        "unlocked": unlocked,
    }


@router.get("/missions")
def get_daily_missions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    missions = generate_daily_missions(db, current_user.id)
    return {"missions": missions}


@router.get("/identity")
def get_music_identity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_identity(db, current_user.id)


@router.get("/leaderboard")
def get_leaderboard(
    type: str = "weekly_xp",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid_types = ["weekly_xp", "monthly_practice", "music_lab_score", "consistency"]
    if type not in valid_types:
        type = "weekly_xp"
    return compute_leaderboard(db, current_user.id, leaderboard_type=type)


@router.get("/journey")
def get_journey_map(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_journey_map(db, current_user.id)


class ChallengeCompleteRequest(BaseModel):
    pass


@router.post("/challenge/{mission_id}/complete")
def complete_daily_challenge(
    mission_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = complete_challenge(db, current_user.id, mission_id)
    if result.get("error"):
        from fastapi import HTTPException
        status = 400 if "already completed" in result["error"] else 404
        raise HTTPException(status_code=status, detail=result["error"])
    return result


@router.get("/gamification-profile")
def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return compute_gamification_profile(db, current_user.id)
