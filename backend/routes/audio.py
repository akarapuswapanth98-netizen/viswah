import os
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session

from database import Base, SessionLocal
from routes.auth import get_current_user

router = APIRouter(prefix="/api/audio", tags=["Audio"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "audio")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class Recording(Base):
    __tablename__ = "recordings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String(200), nullable=False)
    original_name = Column(String(200), nullable=False)
    file_size = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class RecordingResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int
    duration_seconds: int | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.post("/upload")
async def upload_audio(
    file: UploadFile = File(...),
    notes: str = "",
    user=Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    ext = os.path.splitext(file.filename or "recording.wav")[1]
    unique_name = f"{user['id']}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    db = SessionLocal()
    try:
        rec = Recording(
            user_id=user["id"],
            filename=unique_name,
            original_name=file.filename or "recording",
            file_size=len(content),
            notes=notes or None,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return {
            "id": rec.id,
            "filename": rec.filename,
            "original_name": rec.original_name,
            "file_size": rec.file_size,
            "created_at": rec.created_at.isoformat(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/recordings")
def get_recordings(user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        recs = (
            db.query(Recording)
            .filter(Recording.user_id == user["id"])
            .order_by(Recording.created_at.desc())
            .all()
        )
        return [
            {
                "id": r.id,
                "filename": r.filename,
                "original_name": r.original_name,
                "file_size": r.file_size,
                "duration_seconds": r.duration_seconds,
                "notes": r.notes,
                "created_at": r.created_at.isoformat(),
            }
            for r in recs
        ]
    finally:
        db.close()


@router.delete("/{rec_id}")
def delete_recording(rec_id: int, user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        rec = db.query(Recording).filter(Recording.id == rec_id, Recording.user_id == user["id"]).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Recording not found")
        filepath = os.path.join(UPLOAD_DIR, rec.filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        db.delete(rec)
        db.commit()
        return {"status": "deleted"}
    finally:
        db.close()
