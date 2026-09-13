# Architecture

## System Overview

VISWAH follows a decoupled frontend-backend architecture:

```
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│                     │  ◄──────────►  │                     │
│   React Frontend    │                │  FastAPI Backend     │
│   (Vercel)          │                │  (Railway/Render)    │
│                     │                │                     │
│   - 38 pages        │                │   - 15 route modules │
│   - Lazy-loaded     │                │   - JWT auth         │
│   - Subscription UI │                │   - Entitlements     │
│                     │                │   - AI integration   │
└─────────────────────┘                └─────────┬───────────┘
                                                 │
                                    ┌────────────┼────────────┐
                                    │            │            │
                              ┌─────▼──┐  ┌─────▼──┐  ┌─────▼──┐
                              │SQLite/ │  │OpenAI  │  │Razorpay│
                              │Postgres│  │  API   │  │Payments│
                              └────────┘  └────────┘  └────────┘
```

## Frontend Architecture

### Component Hierarchy
```
App
├── BrowserRouter
│   ├── AuthProvider (JWT token, user state)
│   │   ├── SubscriptionProvider (plan, entitlements, usage)
│   │   │   ├── ToastProvider (notifications)
│   │   │   │   ├── ErrorBoundary (catches render errors)
│   │   │   │   │   └── Suspense (lazy loading)
│   │   │   │   │       ├── Layout (sidebar + content)
│   │   │   │   │       │   ├── Home, Courses, Practice, ...
│   │   │   │   │       │   └── NotFound (404)
│   │   │   │   │       ├── Login, Register (standalone)
```

### State Management
- **AuthContext** — JWT token, user info, login/logout
- **SubscriptionProvider** — Current plan, entitlements, usage limits
- **ToastContext** — Notification toasts
- **Local state** — Component-level useState/useReducer
- **No global state library** — Intentionally minimal

### API Layer
- Custom `ApiClient` class with fetch wrapper
- Request caching (30s TTL for GET requests)
- Automatic Bearer token injection
- 401 handling (token clear + auth:expired event)
- `ApiError` class for structured error handling

### Code Splitting
- 38 page components lazy-loaded via `React.lazy()`
- Single `Suspense` boundary with loading spinner
- `ErrorBoundary` catches chunk load failures

## Backend Architecture

### FastAPI Application
```
main.py
├── CORS Middleware
├── 15 Route Modules
│   ├── auth.py          /api/auth
│   ├── courses.py       /api/courses
│   ├── ai_routes.py     /api/ai
│   ├── ai_coach.py      /api/ai-coach
│   ├── practice.py      /api/practice
│   ├── subscriptions.py /api/subscription
│   ├── payments.py      /api/payments
│   ├── community.py     /api/community
│   └── ... (7 more)
├── Health Endpoints     /health, /api/health
└── Static Data Endpoints (ragas, talas, etc.)
```

### Service Layer
```
services/
├── plan_config.py           # 4-plan configuration
├── entitlement_engine.py    # Feature access & usage tracking
├── entitlement_middleware.py # FastAPI dependency injection
├── ai_lesson_generator.py   # OpenAI lesson generation
├── coaching_engine.py       # AI coach logic
├── vocal_guru.py            # TTS integration
├── lyrics_creator.py        # AI lyrics generation
├── speech_analysis.py       # Voice pitch analysis
└── personalization.py       # Recommendation engine
```

### Data Flow
```
Request → FastAPI Router → Dependency Injection (auth, db)
    → Service Layer → SQLAlchemy ORM → Database
    → Response Model → JSON Response
```

## Authentication

### JWT Flow
1. User registers/logs in → `/api/auth/register` or `/api/auth/login`
2. Backend creates JWT with `sub=email`, 30-minute expiry
3. Frontend stores token in `localStorage` as `viswah_token`
4. Subsequent requests include `Authorization: Bearer <token>`
5. `get_current_user` dependency extracts email from JWT `sub` claim
6. 401 responses trigger token clear and redirect to login

### Token Details
- **Algorithm:** HS256
- **Expiry:** 30 minutes (access), 15 minutes (password reset)
- **Payload:** `{ sub: email, exp: timestamp }`

## Entitlement System

### Plan Hierarchy
```
Free (₹0) → Student (₹99) → Premium (₹299) → Pro (₹699)
```

### Enforcement Layers
1. **Frontend** — `PremiumGate`, `UsageLimitBanner`, `UpgradePrompt` (UX only)
2. **Backend** — `check_usage_limit()`, `require_entitlement()` (source of truth)

### Usage Tracking
- Daily counters in `usage_records` table
- Composite unique constraint: `(user_id, usage_type, usage_date)`
- Resets automatically at midnight UTC

## Database Schema

### Key Tables (20+)
- `users` — User accounts
- `courses`, `lessons` — Course content
- `progress` — Lesson completion tracking
- `practice_sessions` — Practice activity logs
- `subscriptions` — Subscription state
- `payment_transactions` — Payment records
- `usage_records` — Daily usage counters
- `community_posts`, `comments`, `likes` — Social features
- `achievements` — Gamification

### Design Decisions
- **SQLite for development** — Zero setup, file-based
- **PostgreSQL for production** — ACID, concurrent access, managed hosting
- **SQLAlchemy ORM** — Database-agnostic queries
- **Raw SQL migrations** — Currently in `main.py` (Alembic recommended for production)
