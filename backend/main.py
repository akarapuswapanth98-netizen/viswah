# Viswah Backend - FastAPI Main

import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ── Logging Configuration ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("viswah")

from sqlalchemy import text

from database import Base, SessionLocal, engine
from models.schemas import SuccessResponse
from routes import admin, ai_coach, ai_routes, audio, auth, community, contact, courses, dashboard, lyrics_creator, payments, personalization, practice, progress, speech_analysis, subscriptions, vocal_guru, world_music
from seed_data import seed_database

load_dotenv()

_jwt_secret = os.environ.get("JWT_SECRET_KEY", "")
if not _jwt_secret:
    logger.critical(
        "JWT_SECRET_KEY environment variable is not set. "
        "The application cannot start without it. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )
    raise RuntimeError("JWT_SECRET_KEY environment variable is required")
_known_dev = {"viswah-dev-secret-key-change-in-production-2024", "dev-fallback-secret-key-do-not-use-in-production"}
if _jwt_secret in _known_dev:
    logger.warning(
        "JWT_SECRET_KEY is a known development value. "
        "This is NOT secure for production."
    )

# Fix #1: Always create tables first, then run SQLite PRAGMA migration
Base.metadata.create_all(bind=engine)

# Only run SQLite PRAGMA for file-based databases
if engine.url.drivername == "sqlite" and ":memory:" not in str(engine.url):
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(lessons)"))
            columns = [row[1] for row in result]
            if "quiz_questions" not in columns:
                try:
                    conn.execute(text("ALTER TABLE lessons ADD COLUMN quiz_questions TEXT"))
                    conn.commit()
                except Exception:
                    pass
            try:
                conn.execute(text("SELECT id FROM practice_sessions LIMIT 1"))
            except Exception:
                try:
                    conn.execute(text("""
                        CREATE TABLE practice_sessions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            activity VARCHAR(50) NOT NULL,
                            activity_id VARCHAR(100),
                            duration_seconds INTEGER DEFAULT 0,
                            score FLOAT,
                            completed BOOLEAN DEFAULT 0,
                            metadata_json TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    conn.execute(text("""
                        CREATE TABLE achievements (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            achievement_type VARCHAR(50) NOT NULL,
                            achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE(user_id, achievement_type)
                        )
                    """))
                    conn.commit()
                except Exception:
                    pass
            # Phase 14: Create subscription-related tables if they don't exist
            try:
                result = conn.execute(text("PRAGMA table_info(subscriptions)"))
                columns = [row[1] for row in result]
                if not columns:
                    conn.execute(text("""
                        CREATE TABLE subscriptions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                            plan_id VARCHAR(30) NOT NULL DEFAULT 'free',
                            status VARCHAR(20) NOT NULL DEFAULT 'active',
                            provider VARCHAR(30),
                            provider_subscription_id VARCHAR(200),
                            provider_customer_id VARCHAR(200),
                            current_period_start TIMESTAMP,
                            current_period_end TIMESTAMP,
                            cancel_at_period_end BOOLEAN DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    conn.execute(text("""
                        CREATE TABLE payment_transactions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            subscription_id INTEGER REFERENCES subscriptions(id),
                            plan_id VARCHAR(30) NOT NULL,
                            amount_inr INTEGER NOT NULL,
                            currency VARCHAR(10) DEFAULT 'INR',
                            status VARCHAR(30) NOT NULL DEFAULT 'pending',
                            provider VARCHAR(30),
                            provider_order_id VARCHAR(200),
                            provider_payment_id VARCHAR(200),
                            provider_signature VARCHAR(500),
                            metadata_json TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    conn.execute(text("""
                        CREATE TABLE usage_records (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            usage_type VARCHAR(50) NOT NULL,
                            usage_date VARCHAR(10) NOT NULL,
                            count INTEGER DEFAULT 1,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            UNIQUE(user_id, usage_type, usage_date)
                        )
                    """))
                    conn.commit()
            except Exception:
                pass
    except Exception as e:
        logger.warning(f"SQLite migration check failed: {e}")

# Fix #3: Wrap seed in try/except so failure doesn't kill the app
try:
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
except Exception as e:
    logger.error(f"Database seeding failed: {e}")

app = FastAPI(
    title="Viswah Music Learning API",
    description="AI-Powered Music Education Platform",
    version="1.0.0"
)

# Fix #4: Validate CORS_ORIGINS, default to empty list if empty string
cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8081,http://127.0.0.1:8081").strip()
cors_origins = [origin.strip() for origin in cors_raw.split(",") if origin.strip()] if cors_raw else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=(self), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(ai_routes.router)
app.include_router(vocal_guru.router)
app.include_router(speech_analysis.router)
app.include_router(lyrics_creator.router)
app.include_router(practice.router)
app.include_router(dashboard.router)
app.include_router(ai_coach.router)
app.include_router(world_music.router)
app.include_router(personalization.router)
app.include_router(progress.router)
app.include_router(community.router)
app.include_router(subscriptions.router)
app.include_router(payments.router)
app.include_router(contact.router)
app.include_router(audio.router)
app.include_router(admin.router)


@app.get("/", response_model=SuccessResponse, tags=["System"])
def root():
    return SuccessResponse(message="Welcome to Viswah API - v1.0.0")


@app.get("/health", tags=["System"])
def health_root():
    return health()


@app.get("/api/health", tags=["System"])
def health():
    # Only expose database status; never reveal credential configuration
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
        status_code = 200
    except Exception as e:
        logger.warning("Health check: database unavailable: %s", type(e).__name__)
        db_status = "unavailable"
        status_code = 503

    # Detailed config status stays in logs, not in response
    if status_code == 200:
        return {"status": "ok", "database": db_status}
    return {"status": "degraded", "database": db_status}


MUSIC_ONTOLOGY_PATH = Path(__file__).parent / "data" / "music_ontology.json"
INDIAN_MUSIC_PATH = Path(__file__).parent / "data" / "indian_music.json"


@app.get("/api/v1/musicology/genres")
def get_musicology_genres():
    if not MUSIC_ONTOLOGY_PATH.exists():
        raise HTTPException(status_code=404, detail="Music ontology not found")
    with open(MUSIC_ONTOLOGY_PATH) as f:
        return json.load(f)


@app.get("/api/v1/indian-music/ragas")
def get_ragas():
    if not INDIAN_MUSIC_PATH.exists():
        raise HTTPException(status_code=404, detail="Indian music data not found")
    with open(INDIAN_MUSIC_PATH) as f:
        data = json.load(f)
    return {"ragas": data.get("ragas", []), "thaat_system": data.get("thaat_system", [])}


@app.get("/api/v1/indian-music/ragas/{raga_id}")
def get_raga(raga_id: str):
    if not INDIAN_MUSIC_PATH.exists():
        raise HTTPException(status_code=404, detail="Indian music data not found")
    with open(INDIAN_MUSIC_PATH) as f:
        data = json.load(f)
    for raga in data.get("ragas", []):
        if raga["id"] == raga_id:
            return raga
    raise HTTPException(status_code=404, detail=f"Raga '{raga_id}' not found")


@app.get("/api/v1/indian-music/talas")
def get_talas():
    if not INDIAN_MUSIC_PATH.exists():
        raise HTTPException(status_code=404, detail="Indian music data not found")
    with open(INDIAN_MUSIC_PATH) as f:
        data = json.load(f)
    return {"talas": data.get("talas", [])}


@app.get("/api/v1/indian-music/sargam")
def get_sargam_map():
    if not INDIAN_MUSIC_PATH.exists():
        raise HTTPException(status_code=404, detail="Indian music data not found")
    with open(INDIAN_MUSIC_PATH) as f:
        data = json.load(f)
    return {"sargam_map": data.get("sargam_map", {}), "variations": data.get("variations", {})}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)