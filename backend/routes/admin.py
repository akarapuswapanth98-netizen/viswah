from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from database import SessionLocal
from models.models import Course, Lesson
from routes.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class AdminCourseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=1000)
    stage: int = Field(..., ge=1, le=5)
    instrument: str
    difficulty: str = "beginner"
    image_url: str | None = None


class AdminCourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    stage: int | None = None
    instrument: str | None = None
    difficulty: str | None = None
    image_url: str | None = None


@router.get("/stats")
def get_stats(admin=Depends(require_admin)):
    db = SessionLocal()
    try:
        return {
            "total_courses": db.query(Course).count(),
            "total_lessons": db.query(Lesson).count(),
        }
    finally:
        db.close()


@router.post("/courses")
def create_course(data: AdminCourseCreate, admin=Depends(require_admin)):
    db = SessionLocal()
    try:
        course = Course(
            title=data.title,
            description=data.description,
            stage=data.stage,
            instrument=data.instrument,
            difficulty=data.difficulty,
            image_url=data.image_url,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return {"id": course.id, "title": course.title, "status": "created"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/courses/{course_id}")
def update_course(course_id: int, data: AdminCourseUpdate, admin=Depends(require_admin)):
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(course, k, v)
        db.commit()
        return {"id": course.id, "status": "updated"}
    finally:
        db.close()


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, admin=Depends(require_admin)):
    db = SessionLocal()
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        db.delete(course)
        db.commit()
        return {"status": "deleted"}
    finally:
        db.close()
