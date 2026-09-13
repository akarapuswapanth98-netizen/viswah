# Lyrics Creator Routes


from fastapi import APIRouter
from pydantic import BaseModel, Field

from models.schemas import ErrorResponse
from services.lyrics_creator import (
    analyze_lyrics,
    format_lyrics,
    generate_lyrics,
    get_genres,
    get_moods,
    improve_lyrics,
)

router = APIRouter(
    prefix="/api/lyrics",
    tags=["Lyrics Creator"]
)


class LyricsGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    genre: str = Field(default="pop")
    mood: str = Field(default="happy")
    language: str = Field(default="english")


class LyricsImproveRequest(BaseModel):
    lyrics: str = Field(..., min_length=10)
    instruction: str = Field(default="make it more emotional")


class LyricsAnalyzeRequest(BaseModel):
    lyrics: str = Field(..., min_length=5)


class LyricsFormatRequest(BaseModel):
    lyrics_data: dict
    format_type: str = Field(default="text")


@router.get(
    "/genres",
    response_model=list[dict]
)
def list_genres():
    """Get available music genres"""
    return get_genres()


@router.get(
    "/moods",
    response_model=list[dict]
)
def list_moods():
    """Get available moods"""
    return get_moods()


@router.post(
    "/generate",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"}
    }
)
def generate_new_lyrics(request: LyricsGenerateRequest):
    """Generate lyrics using AI"""
    # Pydantic already validates topic via Field(min_length=2, max_length=200)
    result = generate_lyrics(
        topic=request.topic,
        genre=request.genre,
        mood=request.mood,
        language=request.language
    )
    return result


@router.post(
    "/improve",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid lyrics"}
    }
)
def improve_existing_lyrics(request: LyricsImproveRequest):
    """Improve existing lyrics using AI"""
    # Pydantic already validates lyrics via Field(min_length=10)
    result = improve_lyrics(
        lyrics=request.lyrics,
        instruction=request.instruction
    )
    return result


@router.post(
    "/analyze",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid lyrics"}
    }
)
def analyze_lyrics_text(request: LyricsAnalyzeRequest):
    """Analyze lyrics for various metrics"""
    # Pydantic already validates lyrics via Field(min_length=5)
    result = analyze_lyrics(request.lyrics)
    return result


@router.post(
    "/format",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid data"}
    }
)
def format_lyrics_text(request: LyricsFormatRequest):
    """Format lyrics for display or export"""
    # lyrics_data is a required dict field in Pydantic - no manual check needed
    formatted = format_lyrics(request.lyrics_data, request.format_type)
    return {"formatted": formatted, "format": request.format_type}
