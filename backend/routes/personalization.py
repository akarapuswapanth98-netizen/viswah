from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.models import User
from routes.auth import get_current_user
from services.personalization_engine import compute_personalization_summary, compute_streak_data

router = APIRouter(prefix="/api/personalization", tags=["Personalization"])


@router.get("/summary")
def get_personalization_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete personalization summary including skill map, recommendations, mission."""
    return compute_personalization_summary(db, current_user.id)


@router.get("/skill-map")
def get_skill_map(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the learner's skill map."""
    summary = compute_personalization_summary(db, current_user.id)
    return {
        "skill_map": summary["skill_map"],
        "strongest_skill": summary["strongest_skill"],
        "weakest_skill": summary["weakest_skill"],
        "recently_improved": summary["recently_improved"],
        "needs_attention": summary["needs_attention"],
        "insufficient_data_skills": summary["insufficient_data_skills"],
    }


@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get personalized recommendations."""
    summary = compute_personalization_summary(db, current_user.id)
    return {"recommendations": summary["recommendations"]}


@router.get("/mission")
def get_daily_mission(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get today's personalized mission."""
    summary = compute_personalization_summary(db, current_user.id)
    return {"mission": summary["daily_mission"]}


@router.get("/streak")
def get_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get streak and consistency data."""
    return compute_streak_data(db, current_user.id)
