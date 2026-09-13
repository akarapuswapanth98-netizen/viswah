from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Session

from database import Base, SessionLocal

router = APIRouter(prefix="/api/contact", tags=["Contact"])


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)


@router.post("/")
def send_message(contact: ContactCreate):
    db = SessionLocal()
    try:
        msg = Message(
            name=contact.name,
            email=contact.email,
            subject=contact.subject,
            message=contact.message,
        )
        db.add(msg)
        db.commit()
        return {"status": "sent", "message": "Message sent successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
