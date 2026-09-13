from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.models import Course, Lesson, Progress, User, UserCourse
from models.schemas import (
    CourseResponse,
    EnrolledCourseResponse,
    EnrollmentResponse,
    InstrumentType,
    LessonResponse,
    ProgressPatch,
    ProgressResponse,
    ProgressUpdate,
)
from routes.auth import get_current_user
from services.entitlement_engine import can_access, get_user_plan_id

router = APIRouter(prefix="/api", tags=["Courses"])


@router.get("/courses")
def get_courses(
    stage: int | None = Query(default=None, ge=1, le=4),
    instrument: InstrumentType | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if stage:
        query = query.filter(Course.stage == stage)
    if instrument:
        query = query.filter(Course.instrument == instrument.value)
    courses = query.all()
    result = []
    for course in courses:
        lesson_count = db.query(Lesson).filter(Lesson.course_id == course.id).count()
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "stage": course.stage,
            "instrument": course.instrument,
            "difficulty": course.difficulty,
            "image_url": course.image_url,
            "lessons_count": lesson_count,
        })
    return result


@router.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson_count = db.query(Lesson).filter(Lesson.course_id == course_id).count()
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "stage": course.stage,
        "instrument": course.instrument,
        "difficulty": course.difficulty,
        "image_url": course.image_url,
        "lessons_count": lesson_count,
    }


def _check_premium_access(
    course: Course,
    db: Session,
    request,
):
    """Check if premium course content can be accessed. Returns None if allowed, raises HTTPException otherwise."""
    if course.stage < 3:
        return
    # Stage 3+ requires authentication + full_course_access
    auth_header: str | None = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required for premium content")
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required for premium content")
    from jose import JWTError, jwt as jose_jwt
    from routes.auth import SECRET_KEY, ALGORITHM
    try:
        payload = jose_jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") == "reset":
            raise HTTPException(status_code=401, detail="Invalid authentication")
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    if not can_access(db, user.id, "full_course_access"):
        plan_id = get_user_plan_id(db, user.id)
        raise HTTPException(
            status_code=403,
            detail={
                "error": "premium_content",
                "feature": "full_course_access",
                "current_plan": plan_id,
                "upgrade_available": plan_id != "pro",
                "message": "This lesson is available with Student plan or higher",
            },
        )


@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def get_course_lessons(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    _check_premium_access(course, db, request)
    return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, request: Request, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if course:
        _check_premium_access(course, db, request)
    return lesson


@router.post("/enroll/{course_id}", response_model=EnrollmentResponse, status_code=201)
def enroll_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Premium content gating: Stage 3-4 courses require full_course_access
    if course.stage >= 3:
        if not can_access(db, current_user.id, "full_course_access"):
            plan_id = get_user_plan_id(db, current_user.id)
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "premium_content",
                    "feature": "full_course_access",
                    "current_plan": plan_id,
                    "upgrade_available": plan_id != "pro",
                    "message": "This course is available with Student plan or higher",
                },
            )

    if db.query(UserCourse).filter(UserCourse.user_id == current_user.id, UserCourse.course_id == course_id).first():
        raise HTTPException(status_code=409, detail="Already enrolled")
    db.add(UserCourse(user_id=current_user.id, course_id=course_id))
    db.commit()
    return EnrollmentResponse(message="Successfully enrolled", course_id=course_id)


@router.get("/enrolled", response_model=list[EnrolledCourseResponse])
def get_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Course).join(UserCourse).filter(UserCourse.user_id == current_user.id).all()


@router.post("/progress", response_model=ProgressResponse)
def create_progress(
    progress: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).filter(Lesson.id == progress.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Fix #10: Check for existing progress
    existing = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.lesson_id == progress.lesson_id
    ).first()

    if existing:
        if existing.completed and not progress.completed:
            # Fix #15: Return info that lesson is already completed, don't silently ignore
            return existing

        if progress.completed:
            existing.completed = True
            existing.score = max(existing.score, progress.score)
            existing.time_spent_minutes = existing.time_spent_minutes + progress.time_spent_minutes
            if not existing.completed_at:
                existing.completed_at = datetime.now(UTC)
        else:
            existing.score = progress.score
            existing.time_spent_minutes = existing.time_spent_minutes + progress.time_spent_minutes
        db.commit()
        db.refresh(existing)
        return existing

    # Fix #16: Use try/except to handle race condition on concurrent creation
    new_progress = Progress(
        user_id=current_user.id,
        lesson_id=progress.lesson_id,
        completed=progress.completed,
        score=progress.score,
        time_spent_minutes=progress.time_spent_minutes,
        completed_at=datetime.now(UTC) if progress.completed else None
    )
    try:
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
    except IntegrityError:
        db.rollback()
        # Race condition: another request created this progress, fetch and update
        existing = db.query(Progress).filter(
            Progress.user_id == current_user.id,
            Progress.lesson_id == progress.lesson_id
        ).first()
        if existing:
            if progress.completed:
                existing.completed = True
                existing.score = max(existing.score, progress.score)
                existing.time_spent_minutes = existing.time_spent_minutes + progress.time_spent_minutes
                if not existing.completed_at:
                    existing.completed_at = datetime.now(UTC)
            else:
                existing.score = progress.score
                existing.time_spent_minutes = existing.time_spent_minutes + progress.time_spent_minutes
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=500, detail="Failed to create progress")
    return new_progress


@router.patch("/progress/{progress_id}", response_model=ProgressResponse)
def update_progress(
    progress_id: int,
    progress: ProgressPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Progress).filter(Progress.id == progress_id, Progress.user_id == current_user.id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Progress not found")

    if progress.completed is not None:
        existing.completed = progress.completed
        if progress.completed and not existing.completed_at:
            existing.completed_at = datetime.now(UTC)
        elif not progress.completed:
            existing.completed_at = None
    if progress.score is not None:
        existing.score = progress.score
    if progress.time_spent_minutes is not None:
        existing.time_spent_minutes = progress.time_spent_minutes

    db.commit()
    db.refresh(existing)
    return existing


@router.get("/progress", response_model=list[ProgressResponse])
def get_user_progress(
    lesson_id: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Progress).filter(Progress.user_id == current_user.id)
    if lesson_id:
        query = query.filter(Progress.lesson_id == lesson_id)
    return query.offset(skip).limit(limit).all()