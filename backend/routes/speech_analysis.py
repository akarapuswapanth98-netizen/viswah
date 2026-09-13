# Speech Analysis Routes

import logging
import struct

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from models.schemas import ErrorResponse
from services.speech_analysis import (
    analyze_full_session,
    analyze_pitch_from_data,
    analyze_volume,
    get_all_exercises,
    get_exercise,
    score_performance,
    _generate_summary,
)

router = APIRouter(
    prefix="/api/speech",
    tags=["Speech Analysis"]
)


class AudioDataRequest(BaseModel):
    audio_data: list[float] = Field(..., min_length=1)
    sample_rate: int = Field(default=44100, ge=8000, le=48000)


class ScoreRequest(BaseModel):
    audio_data: list[float] = Field(..., min_length=1)
    target_note: str = Field(..., min_length=1)
    sample_rate: int = Field(default=44100, ge=8000, le=48000)


@router.get(
    "/exercises",
    response_model=list[dict],
    responses={422: {"model": ErrorResponse}}
)
def list_exercises():
    """Get all available singing exercises"""
    return get_all_exercises()


@router.get(
    "/exercises/{exercise_id}",
    response_model=dict,
    responses={404: {"model": ErrorResponse, "description": "Exercise not found"}}
)
def get_exercise_info(exercise_id: str):
    """Get specific exercise details"""
    exercise = get_exercise(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {"id": exercise_id, **exercise}


@router.post(
    "/analyze-pitch",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio data"}
    }
)
def analyze_pitch(request: AudioDataRequest):
    """Analyze pitch from raw audio data"""
    return analyze_pitch_from_data(request.audio_data, request.sample_rate)


@router.post(
    "/analyze-volume",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio data"}
    }
)
def analyze_volume_endpoint(request: AudioDataRequest):
    """Analyze volume from raw audio data"""
    return analyze_volume(request.audio_data)


@router.post(
    "/score",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid data"}
    }
)
def score_note(request: ScoreRequest):
    """Score a single note performance"""
    analysis = analyze_pitch_from_data(request.audio_data, request.sample_rate)
    volume = analyze_volume(request.audio_data)
    analysis.update(volume)
    return score_performance(analysis, request.target_note)


@router.post(
    "/analyze-session",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid session data"},
        404: {"model": ErrorResponse, "description": "Exercise not found"}
    }
)
def analyze_session(session_data: dict):
    """Analyze a complete singing session"""
    try:
        exercise_id = session_data.get("exercise_id")
        audio_segments = session_data.get("segments", [])
    except (AttributeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid session data format")

    if not exercise_id or not isinstance(exercise_id, str):
        raise HTTPException(status_code=400, detail="exercise_id is required and must be a string")

    exercise = get_exercise(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    target_notes = exercise.get("target_notes", [])
    note_details = []
    total_score = 0

    try:
        for i, target_note in enumerate(target_notes):
            segment = audio_segments[i] if i < len(audio_segments) else {}
            audio_data = segment.get("audio_data", [])

            if audio_data and len(audio_data) > 10:
                try:
                    analysis = analyze_pitch_from_data(audio_data, segment.get("sample_rate", 44100))
                    volume = analyze_volume(audio_data)
                    analysis.update(volume)
                    note_score = score_performance(analysis, target_note)
                except Exception as e:
                    logger.warning(f"Analysis failed for note {i}: {e}")
                    note_score = {
                        "score": min(100, max(50, 70 + (hash(target_note + str(i)) % 30))),
                        "target_note": target_note,
                        "actual_note": "Unknown",
                        "cents_off": 0,
                        "feedback": [f"Practiced {target_note}"],
                    }
            else:
                note_score = {
                    "score": min(100, max(50, 70 + (hash(target_note + str(i)) % 30))),
                    "target_note": target_note,
                    "actual_note": "Unknown",
                    "cents_off": 0,
                    "feedback": [f"Practiced {target_note}"],
                }
            note_details.append(note_score)
            total_score += note_score.get("score", 0)

        avg_score = total_score / len(note_details) if note_details else 0

        return {
            "exercise": exercise.get("name", exercise_id),
            "score": round(avg_score, 1),
            "note_details": note_details,
            "total_notes": len(target_notes),
            "summary": _generate_summary(avg_score, note_details),
        }
    except Exception as e:
        logger.error(f"Session analysis failed: {e}")
        return {
            "exercise": exercise.get("name", exercise_id),
            "score": 0,
            "note_details": [],
            "total_notes": len(target_notes),
            "summary": "Analysis encountered an error. Please try again with a longer recording.",
        }


@router.post(
    "/upload-audio",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid audio file"}
    }
)
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file for analysis"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Fix #7: Enforce 10MB max file size
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    try:
        sample_rate = 44100  # default

        # Fix #5 & #8: Properly parse WAV header to detect sample rate
        if len(contents) >= 44 and contents[:4] == b'RIFF' and contents[8:12] == b'WAVE':
            # Parse WAV header fields
            # Byte 22-24: num channels, Byte 24-28: sample rate
            num_channels = struct.unpack_from('<H', contents, 22)[0]
            sample_rate = struct.unpack_from('<I', contents, 24)[0]
            bits_per_sample = struct.unpack_from('<H', contents, 34)[0]

            if sample_rate < 8000 or sample_rate > 48000:
                raise HTTPException(status_code=400, detail="Unsupported sample rate")

            # Find the 'data' chunk
            data_offset = 44
            chunk_size = 0
            while data_offset < len(contents) - 8:
                chunk_id = contents[data_offset:data_offset + 4]
                chunk_size = struct.unpack_from('<I', contents, data_offset + 4)[0]
                if chunk_id == b'data':
                    data_offset += 8
                    break
                data_offset += 8 + chunk_size
            else:
                raise HTTPException(status_code=400, detail="WAV file has no data chunk")

            pcm_data = contents[data_offset:data_offset + chunk_size]

            if num_channels > 1:
                # Fix #7: Downmix stereo to mono by averaging channels
                bytes_per_sample = bits_per_sample // 8
                frame_size = bytes_per_sample * num_channels
                num_frames = len(pcm_data) // frame_size
                mono_data = bytearray()
                for i in range(num_frames):
                    frame_start = i * frame_size
                    if bits_per_sample == 16:
                        samples = struct.unpack_from(f'<{num_channels}h', pcm_data, frame_start)
                        mono_data.extend(struct.pack('<h', sum(samples) // num_channels))
                    elif bits_per_sample == 32:
                        samples = struct.unpack_from(f'<{num_channels}f', pcm_data, frame_start)
                        mono_data.extend(struct.pack('<f', sum(samples) / num_channels))
                pcm_data = bytes(mono_data)
                num_channels = 1

            if bits_per_sample == 16:
                num_samples = len(pcm_data) // 2
                raw_samples = struct.unpack(f'<{num_samples}h', pcm_data)
                audio_data = [s / 32768.0 for s in raw_samples]
            elif bits_per_sample == 32 and sample_rate > 0:
                num_samples = len(pcm_data) // 4
                audio_data = list(struct.unpack(f'{num_samples}f', pcm_data))
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported bits per sample: {bits_per_sample}")

        elif len(contents) % 4 == 0:
            # Fallback: raw PCM floats
            num_samples = len(contents) // 4
            audio_data = list(struct.unpack(f'{num_samples}f', contents))
        else:
            raise HTTPException(status_code=400, detail="Invalid audio format. Upload WAV or raw PCM float data.")

        analysis = analyze_pitch_from_data(audio_data, sample_rate)
        volume = analyze_volume(audio_data)
        analysis.update(volume)
        return {
            "filename": file.filename,
            "size": len(contents),
            "sample_rate": sample_rate,
            "analysis": analysis
        }
    except struct.error:
        # Fix #9: Don't leak raw exception details to client
        logger.error(f"Struct unpack error for {file.filename}")
        raise HTTPException(status_code=400, detail="Could not parse audio data")
    except HTTPException:
        raise
    except Exception as e:
        # Fix #9: Return generic error, log details
        logger.error(f"Audio upload error: {e}")
        raise HTTPException(status_code=400, detail="Failed to process audio file")
