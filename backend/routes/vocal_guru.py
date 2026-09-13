# Vocal Guru Routes

import atexit
import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from models.schemas import ErrorResponse
from services.vocal_guru import (
    generate_greeting,
    generate_lesson_speech,
    generate_speech,
    get_all_gurus,
    get_available_topics,
    get_guru,
    get_lesson_content,
)

router = APIRouter(
    prefix="/api/vocal-guru",
    tags=["Vocal Guru"]
)

# Fix #3: Track and clean up generated temp audio files
_generated_audio_files: list[str] = []

def _cleanup_audio_files():
    for path in _generated_audio_files:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass
    _generated_audio_files.clear()

atexit.register(_cleanup_audio_files)


@router.get(
    "/gurus",
    response_model=list[dict],
    responses={422: {"model": ErrorResponse}}
)
def list_gurus():
    """Get all available vocal gurus"""
    return get_all_gurus()


@router.get(
    "/gurus/{guru_id}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Guru not found"}
    }
)
def get_guru_info(guru_id: str):
    """Get specific guru information"""
    guru = get_guru(guru_id)
    if not guru:
        raise HTTPException(status_code=404, detail="Guru not found")
    return {"id": guru_id, **guru}


@router.get(
    "/topics",
    response_model=list[str]
)
def list_topics():
    """Get available lesson topics"""
    return get_available_topics()


@router.get(
    "/lesson/{topic}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Topic not found"}
    }
)
def get_lesson(topic: str):
    """Get lesson content for a topic"""
    lesson = get_lesson_content(topic)
    if not lesson:
        raise HTTPException(status_code=404, detail="Topic not found")
    return lesson


@router.post(
    "/greet/{guru_id}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Guru not found"}
    }
)
def greet_guru(guru_id: str):
    """Get greeting from a guru"""
    result = generate_greeting(guru_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post(
    "/teach/{topic}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Topic not found"}
    }
)
def teach_topic(topic: str, guru_id: str = "classical"):
    """Get teaching content from guru for a topic"""
    result = generate_lesson_speech(topic, guru_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get(
    "/exercise/{topic}",
    response_model=dict,
    responses={
        404: {"model": ErrorResponse, "description": "Topic not found"}
    }
)
def get_topic_exercise(topic: str):
    """Get structured exercise, explanation, and feedback templates for a topic"""
    from services.vocal_guru import GURU_LESSONS
    lesson = GURU_LESSONS.get(topic.lower())
    if not lesson:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {
        "topic": topic.lower(),
        "title": lesson["title"],
        "explanation": lesson.get("explanation", {}),
        "exercise": lesson.get("exercise", {}),
        "feedback_templates": lesson.get("feedback_templates", {}),
        "correction_exercises": lesson.get("correction_exercises", {}),
    }


@router.post(
    "/feedback",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"}
    }
)
def generate_feedback(request: dict):
    """Generate feedback for a practice attempt based on analysis results"""
    topic = request.get("topic", "")
    analysis = request.get("analysis", {})
    attempt_number = request.get("attempt_number", 1)

    from services.vocal_guru import GURU_LESSONS
    lesson = GURU_LESSONS.get(topic.lower())
    if not lesson:
        raise HTTPException(status_code=400, detail="Invalid topic")

    templates = lesson.get("feedback_templates", {})
    corrections = lesson.get("correction_exercises", {})

    pitch_deviation = abs(analysis.get("pitch_deviation_cents", 0))
    stability = analysis.get("stability", 0)
    duration = analysis.get("duration_seconds", 0)
    volume_consistency = analysis.get("volume_consistency", 0)

    category = "good"
    if pitch_deviation > 50:
        if analysis.get("direction") == "sharp":
            category = "improve_sharp"
        elif analysis.get("direction") == "flat":
            category = "improve_flat"
        else:
            category = "improve_unstable"
    elif stability < 0.5:
        category = "improve_unstable"
    elif volume_consistency < 0.4:
        category = "improve_tension"

    template = templates.get(category, templates.get("good", {
        "observation": "Your attempt was recorded.",
        "why": "Practice helps improve your skills.",
        "try": "Try the exercise again with focus."
    }))

    correction_key = "default"
    if "sharp" in category:
        correction_key = "sharp"
    elif "flat" in category:
        correction_key = "flat"
    elif "unstable" in category:
        correction_key = "unstable"
    elif "tension" in category:
        correction_key = "tension"

    correction = corrections.get(correction_key, corrections.get("default", "Practice the exercise again."))

    return {
        "category": category,
        "observation": template.get("observation", ""),
        "why": template.get("why", ""),
        "try": template.get("try", ""),
        "correction_exercise": correction,
        "attempt_number": attempt_number,
        "score": analysis.get("score", 0),
    }


from pydantic import BaseModel, Field


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    guru_id: str = Field(default="classical")


@router.post(
    "/speak",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "TTS not available"}
    }
)
def speak_text(request: SpeakRequest):
    """Generate speech audio from text"""
    text = request.text
    guru_id = request.guru_id
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    valid_guru_ids = ["classical", "contemporary", "carnatic"]
    if guru_id not in valid_guru_ids:
        raise HTTPException(status_code=400, detail=f"Invalid guru_id. Must be one of: {', '.join(valid_guru_ids)}")

    audio_path = generate_speech(text, guru_id)
    if not audio_path:
        raise HTTPException(
            status_code=400,
            detail="Text-to-speech not available. Install gTTS or ElevenLabs."
        )
    return {
        "audio_url": f"/api/vocal-guru/audio/{os.path.basename(audio_path)}",
        "guru_id": guru_id
    }


@router.get("/audio/{filename}")
def get_audio(filename: str):
    """Serve audio files"""
    import tempfile
    # Fix #7: Prevent path traversal
    safe_filename = os.path.basename(filename)
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    temp_dir = tempfile.gettempdir()
    audio_path = os.path.join(temp_dir, safe_filename)
    
    # Verify path is within temp directory
    if not os.path.realpath(audio_path).startswith(os.path.realpath(temp_dir)):
        raise HTTPException(status_code=400, detail="Invalid path")
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")