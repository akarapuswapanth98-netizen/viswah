from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.models import (
    Achievement,
    Course,
    Lesson,
    PracticeSession,
    Progress,
    User,
    UserCourse,
)
from models.schemas import DashboardResponse
from routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    enrolled_courses = []
    user_courses = db.query(UserCourse).filter(UserCourse.user_id == current_user.id).all()
    for uc in user_courses:
        course = db.query(Course).filter(Course.id == uc.course_id).first()
        if not course:
            continue
        lessons = db.query(Lesson).filter(Lesson.course_id == course.id).all()
        completed_count = 0
        for lesson in lessons:
            p = db.query(Progress).filter(
                Progress.user_id == current_user.id,
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

    progress_records = db.query(Progress).filter(Progress.user_id == current_user.id).all()
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

    total_practice_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == current_user.id
    ).scalar() or 0
    today_secs = db.query(func.sum(PracticeSession.duration_seconds)).filter(
        PracticeSession.user_id == current_user.id,
        PracticeSession.created_at >= today_start,
    ).scalar() or 0
    streak = 0
    check_date = today_start
    for _ in range(365):
        day_end = check_date + timedelta(days=1)
        has = db.query(PracticeSession.id).filter(
            PracticeSession.user_id == current_user.id,
            PracticeSession.created_at >= check_date,
            PracticeSession.created_at < day_end,
        ).first()
        if has:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    practice_stats = {
        "total_sessions": db.query(func.count(PracticeSession.id)).filter(PracticeSession.user_id == current_user.id).scalar() or 0,
        "total_minutes": int(total_practice_secs // 60),
        "streak_days": streak,
        "today_minutes": int(today_secs // 60),
        "favorite_activity": None,
        "weekly_minutes": [0, 0, 0, 0, 0, 0, 0],
        "activities_breakdown": {},
    }

    achievements = []
    for a in db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.achieved_at.desc()).limit(10).all():
        achievements.append({
            "type": a.achievement_type,
            "achieved_at": a.achieved_at.isoformat() if a.achieved_at else None,
        })

    recommendations = _build_recommendations(current_user.id, enrolled_courses, progress_list, practice_stats, db)

    recent = []
    recent_progress = db.query(Progress).filter(Progress.user_id == current_user.id).order_by(Progress.completed_at.desc().nullslast()).limit(5).all()
    for p in recent_progress:
        lesson = db.query(Lesson).filter(Lesson.id == p.lesson_id).first()
        recent.append({
            "type": "lesson",
            "title": lesson.title if lesson else "Unknown",
            "completed": p.completed,
            "score": p.score,
            "date": p.completed_at.isoformat() if p.completed_at else None,
        })
    recent_practice = db.query(PracticeSession).filter(PracticeSession.user_id == current_user.id).order_by(PracticeSession.created_at.desc()).limit(5).all()
    for ps in recent_practice:
        recent.append({
            "type": "practice",
            "activity": ps.activity,
            "duration_seconds": ps.duration_seconds,
            "score": ps.score,
            "date": ps.created_at.isoformat() if ps.created_at else None,
        })
    recent.sort(key=lambda x: x.get("date") or "", reverse=True)
    recent = recent[:8]

    return DashboardResponse(
        enrolled_courses=enrolled_courses,
        progress=progress_list,
        practice_stats=practice_stats,
        achievements=achievements,
        recommendations=recommendations,
        recent_activity=recent,
    )


def _build_recommendations(user_id, enrolled_courses, progress_list, practice_stats, db):
    recs = []

    for ec in enrolled_courses:
        if ec["progress_pct"] < 100 and ec["completed_lessons"] < ec["total_lessons"]:
            lessons = db.query(Lesson).filter(Lesson.course_id == ec["id"]).order_by(Lesson.order).all()
            for lesson in lessons:
                done = any(p["lesson_id"] == lesson.id and p["completed"] for p in progress_list)
                if not done:
                    recs.append({
                        "type": "continue_lesson",
                        "title": lesson.title,
                        "course": ec["title"],
                        "course_id": ec["id"],
                        "lesson_id": lesson.id,
                        "reason": f"Continue {ec['title']} — next lesson",
                    })
                    break
            if len(recs) >= 2:
                break

    if practice_stats["today_minutes"] == 0 and practice_stats["total_sessions"] > 0:
        recs.append({
            "type": "practice_reminder",
            "title": "Start your daily practice",
            "reason": "You haven't practiced today. Even 5 minutes helps!",
        })

    if practice_stats["total_sessions"] == 0 and not enrolled_courses:
        all_courses = db.query(Course).all()
        if all_courses:
            c = all_courses[0]
            recs.append({
                "type": "start_course",
                "title": c.title,
                "course_id": c.id,
                "reason": "Start your first course to begin learning",
            })

    unquizzed = []
    for p in progress_list:
        if p["completed"] and (p["score"] is None or p["score"] == 0):
            unquizzed.append(p)
    if unquizzed:
        recs.append({
            "type": "take_quiz",
            "title": unquizzed[0]["lesson_title"],
            "lesson_id": unquizzed[0]["lesson_id"],
            "reason": "You completed this lesson — try the quiz to test your knowledge",
        })

    if practice_stats["total_minutes"] < 30 and practice_stats["total_sessions"] > 0:
        recs.append({
            "type": "try_tool",
            "title": "Try the Metronome",
            "path": "/metronome",
            "reason": "Build your timing skills with rhythm practice",
        })

    return recs[:5]
