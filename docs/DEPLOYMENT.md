# Deployment Guide

## Overview

VISWAH is deployed as two separate services:

```
Frontend (Vercel)  →  Backend (FastAPI hosting)  →  Database (PostgreSQL)
```

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub repository with the `viswah-frontend` code
- Vercel account connected to GitHub

### Steps
1. Push `viswah-frontend` to GitHub
2. Import the repository in Vercel
3. Configure environment variables:
   - `VITE_API_URL` = Your production backend URL (e.g., `https://api.viswah.com`)
4. Deploy

### SPA Routing
Vercel automatically handles SPA routing with the default Vite configuration. The catch-all `<Route path="*">` in `App.jsx` handles 404s client-side.

### Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node.js Version:** 18+ (default on Vercel)

## Backend Deployment

### Recommended Hosting
- **Railway** — Easy FastAPI deployment with PostgreSQL
- **Render** — Free tier available, PostgreSQL addon
- **Fly.io** — Edge deployment with persistent volumes
- **AWS ECS/Fargate** — Production-grade containerized deployment
- **DigitalOcean App Platform** — Simple PaaS

### Prerequisites
- Python 3.13+
- PostgreSQL database (recommended for production)
- Razorpay production account (for payments)
- OpenAI API key (for AI features)

### Environment Variables
Set these in your hosting provider:

```bash
JWT_SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=postgresql://user:password@host:5432/viswah
CORS_ORIGINS=https://viswah.vercel.app,https://viswah.com
OPENAI_API_KEY=sk-...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### Start Command
```bash
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
```

The backend automatically:
- Creates database tables on startup
- Runs SQLite migrations (for SQLite only)
- Seeds initial course data
- Validates JWT secret configuration

### Health Check
```
GET /api/health
```

Returns:
```json
{
  "message": "healthy",
  "checks": {
    "api": "ok",
    "database": "ok",
    "jwt": "ok",
    "razorpay": "configured"
  }
}
```

## Database

### Development
SQLite file at `backend/viswah.db` — created automatically.

### Production
PostgreSQL connection string:
```
DATABASE_URL=postgresql://user:password@host:5432/viswah
```

The SQLAlchemy models are compatible with both SQLite and PostgreSQL. All datetime handling accounts for naive/aware differences.

### Migrations
Currently handled via raw SQL in `main.py` for SQLite. For PostgreSQL production, consider adding Alembic migrations.

## Razorpay Webhooks

### Production Webhook URL
```
https://YOUR-BACKEND-DOMAIN/api/payments/webhook
```

### Configure in Razorpay Dashboard
1. Go to Settings → Webhooks
2. Add webhook URL
3. Select events: `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `payment.captured`, `subscription.cancelled`, `subscription.expired`, `payment.failed`
4. Copy the webhook secret to `RAZORPAY_WEBHOOK_SECRET`

### Security
- Webhook signature verification is enforced when `RAZORPAY_WEBHOOK_SECRET` is set
- Duplicate events are handled idempotently
- Missing secret logs a warning and skips verification (dev mode only)

## CORS Configuration

Set `CORS_ORIGINS` to your production frontend URL(s):

```bash
CORS_ORIGINS=https://viswah.vercel.app
```

Multiple origins: comma-separated
```bash
CORS_ORIGINS=https://viswah.vercel.app,https://viswah.com
```

## Domain Configuration

### Frontend
- Vercel provides `*.vercel.app` by default
- Add custom domain in Vercel dashboard

### Backend
- Configure your hosting provider's domain
- Update `VITE_API_URL` in Vercel to point to the backend domain
- Update `CORS_ORIGINS` in backend to include the frontend domain

## Post-Deployment Verification

1. **Health Check:** `GET /api/health` returns `"healthy"`
2. **Auth Flow:** Register → Login → Token received
3. **API Access:** Authenticated requests work with Bearer token
4. **CORS:** Frontend can make API calls to backend
5. **Payments:** Razorpay checkout flow works end-to-end
6. **AI Features:** AI Coach and AI Lessons respond correctly
