# VISWAH

**AI-Powered World Music Learning Platform**

VISWAH is a full-stack web application that combines AI-powered music coaching, interactive practice tools, world music exploration, and structured courses into a unified learning experience.

## Features

### Core Learning
- **AI Music Coach** — Personalized practice plans, skill tracking, and real-time guidance
- **Interactive Courses** — Structured lessons with quizzes and progress tracking
- **Practice Studio** — Piano, Drums, Metronome, Vocal Guru, Sargam, Raga Learning
- **AI Lessons** — AI-generated music lessons and exercises

### Music Lab
- Note Recognition, Interval Training, Rhythm Training
- Melody Recognition, Musical Memory, World Music Listening

### World Music
- Explore musical traditions from 30+ countries
- Compare traditions, learn about instruments, scales, and rhythms

### Community
- Social feed, groups, challenges, and leaderboards
- Follow other learners and share your progress

### Gamification
- XP system, achievements, journey map, daily missions
- Practice streaks and skill health tracking

### Monetization
- 4 subscription tiers: Free, Student (₹99/mo), Premium (₹299/mo), Pro (₹699/mo)
- Server-side entitlement enforcement
- Razorpay payment integration

## Architecture

```
Frontend (React)          Backend (FastAPI)         Database (SQLite/PostgreSQL)
    │                          │                          │
    ├─ Vite 5.4               ├─ Python 3.13             ├─ SQLAlchemy ORM
    ├─ React 18               ├─ JWT Authentication      ├─ 20+ tables
    ├─ React Router 6         ├─ Entitlement Engine      ├─ SQLite (dev)
    ├─ 38 lazy-loaded pages   ├─ AI Integration          └─ PostgreSQL (prod)
    └─ Vitest                 └─ Razorpay Payments
```

## Quick Start

### Frontend

```bash
cd viswah-frontend
cp .env.example .env
npm install
npm run dev
```

### Backend

```bash
cd viswah-app/backend
cp .env.example .env
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8003
```

## Environment Variables

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8003` |

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET_KEY` | Yes | JWT signing secret (app won't start without it) |
| `DATABASE_URL` | No | Database connection string (defaults to SQLite) |
| `CORS_ORIGINS` | No | Comma-separated frontend origins |
| `OPENAI_API_KEY` | No | OpenAI API key (AI features use fallbacks if missing) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs TTS key (falls back to gTTS) |
| `RAZORPAY_KEY_ID` | No | Razorpay key (dev simulation if missing) |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | No | Razorpay webhook signature secret |

## Testing

### Backend (275 tests)
```bash
cd viswah-app/backend
python -m pytest -v
```

### Frontend (210 tests)
```bash
cd viswah-frontend
npx vitest run
```

### Production Build
```bash
cd viswah-frontend
npm run build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5.4, React Router 6 |
| Backend | FastAPI, SQLAlchemy, Python 3.13 |
| Database | SQLite (dev), PostgreSQL (prod) |
| Auth | JWT (HS256, 30min expiry) |
| Payments | Razorpay |
| AI | OpenAI API, ElevenLabs TTS, gTTS fallback |
| Testing | Vitest, pytest |

## Project Structure

```
viswah-frontend/
├── src/
│   ├── api/          # API client modules (15 files)
│   ├── components/   # Reusable UI components
│   ├── config/       # Plan configuration
│   ├── context/      # React Context (Auth, Toast)
│   ├── hooks/        # Custom hooks (useSubscription, etc.)
│   ├── pages/        # 38 page components
│   ├── test/         # Test suites
│   └── utils/        # Utility functions
├── .env.example
└── package.json

viswah-app/backend/
├── routes/           # API route handlers (15 files)
├── services/         # Business logic
├── models/           # SQLAlchemy models & Pydantic schemas
├── data/             # Static music data (JSON)
├── .env.example
├── requirements.txt
└── main.py
```

## License

Private — All rights reserved.
