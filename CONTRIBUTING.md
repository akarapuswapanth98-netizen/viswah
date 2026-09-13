# Contributing to VISWAH

## Project Overview

VISWAH is an AI-powered global music learning platform. Frontend: React + Vite, Backend: FastAPI + SQLAlchemy, SQLite (dev) / PostgreSQL (prod).

## Local Setup

### Frontend

```bash
cd frontend  # or repo root if unified
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8003
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set JWT_SECRET_KEY, DATABASE_URL, etc.
python -m uvicorn main:app --reload --port 8003
```

## Environment Variables

**Frontend:** `VITE_API_URL` (see `frontend/.env.example` or `/.env.example`)

**Backend:** See `backend/.env.example` — `JWT_SECRET_KEY` (required), `DATABASE_URL`, `CORS_ORIGINS`, `OPENAI_API_KEY`, `RAZORPAY_*`. Never commit `.env`.

## Testing

```bash
# Frontend
npm run test -- --run   # or npm test
# Backend
cd backend && python -m pytest -q
```

## Build

```bash
npm run build  # frontend production build, outputs dist/
```

## Branch / PR Expectations

- Branch from `main`, PR to `main`
- Keep commits focused; use `feat:`, `fix:`, `chore:` prefixes
- CI must pass (backend pytest, frontend Vitest, build)

## Security Rules

- Never commit `.env`, `*.db`, `node_modules`, `dist`, `__pycache__`, `.venv`
- Never commit JWT secrets, API keys, Razorpay secrets, tokens, passwords
- All secrets via environment variables; see `.env.example` placeholders

## Migration Workflow

```bash
cd backend
# Create migration after model changes
python -m alembic revision --autogenerate -m "describe change"
# Review generated file in alembic/versions/
# Apply
python -m alembic upgrade head
# Downgrade if needed
python -m alembic downgrade -1
```

`alembic/env.py` reads `DATABASE_URL` from env, works with SQLite (dev) and PostgreSQL (prod). Do not run destructive migrations on prod data.

## Project Structure

- `src/` — React frontend
- `backend/` — FastAPI backend
- `docs/` — Deployment, architecture, security docs
- `public/` — Static assets, `robots.txt`, `sitemap.xml`
