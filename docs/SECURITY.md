# Security

## Overview

VISWAH implements security at multiple layers: authentication, authorization, input validation, CORS, and dependency management.

## Authentication

### JWT Implementation
- **Algorithm:** HS256 (symmetric)
- **Secret:** Environment variable `JWT_SECRET_KEY` — app crashes if missing
- **Expiry:** 30 minutes (access tokens)
- **Password reset tokens:** 15 minutes
- **Password hashing:** bcrypt via passlib

### Token Security
- Tokens stored in `localStorage` (not cookies — prevents CSRF but vulnerable to XSS)
- Bearer token sent in `Authorization` header
- 401 responses automatically clear tokens and dispatch `auth:expired` event
- No refresh token mechanism (30-minute sessions)

### Production Requirements
- `JWT_SECRET_KEY` must be a strong random value (64+ hex characters)
- Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- Known development secrets trigger startup warnings

## Authorization

### User Isolation
- Every protected route extracts user identity from JWT
- Database queries filter by `user_id` from the authenticated user
- Users cannot access other users' data (verified in tests)

### Route Protection
- All API routes except `/api/auth/*`, `/health`, `/api/health` require authentication
- Frontend uses `useAuth()` hook to check authentication state
- No route-level protection wrapper (auth checks in individual pages)

## CORS

### Configuration
- Origins configured via `CORS_ORIGINS` environment variable
- Defaults to localhost-only in development
- No wildcard (`*`) origins with credentials
- `allow_credentials=True` with specific origins only

### Production
```bash
CORS_ORIGINS=https://viswah.vercel.app
```

## Input Validation

### Backend
- Pydantic models validate all request bodies
- Email validation via `email-validator` package
- String length limits on user inputs
- SQL injection prevented by SQLAlchemy ORM (parameterized queries)

### Frontend
- Form validation before submission
- API client validates response structure

## Payment Security

### Razorpay Integration
- Server-side payment verification using HMAC-SHA256
- Webhook signature validation with `RAZORPAY_WEBHOOK_SECRET`
- Payment amounts verified server-side (not trusted from client)
- Idempotent webhook handling (duplicate events are safe)

### Production Requirements
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must be set
- Missing secrets log warnings and skip verification (dev mode only)
- Never expose Razorpay secrets to the frontend

## AI Security

### API Key Handling
- OpenAI and ElevenLabs keys stored in environment variables
- Never exposed to frontend
- Graceful fallback when keys are missing (deterministic responses)
- Input validation on user prompts (length limits)

## Known Limitations

### Current
- **No rate limiting** beyond entitlement-based daily limits
- **No HTTPS enforcement** (expected to run behind reverse proxy)
- **No refresh tokens** (30-minute sessions require re-login)
- **localStorage for tokens** (vulnerable to XSS if any XSS exists)
- **No Content Security Policy** headers configured

### Recommended for Production
- Add rate limiting middleware (e.g., slowapi)
- Configure HTTPS redirect at reverse proxy level
- Add CSP headers
- Consider httpOnly cookies for token storage
- Add request logging and monitoring

## Dependency Vulnerabilities

### Frontend
- `react-router` 6.x has known vulnerabilities (CVE-2025-68470)
  - Severity: Moderate
  - Upgrade to v7 would be a breaking change
  - Mitigated by: not using `<Link>` with untrusted `to` props
- `esbuild` dev-server vulnerability (moderate)
  - Only affects development, not production builds

### Backend
- No known vulnerabilities in current dependencies
- `python-jose` for JWT (maintained, widely used)
- `passlib` with bcrypt (industry standard)

## Security Checklist

- [x] JWT secret from environment (not hardcoded)
- [x] JWT secret validated at startup
- [x] Password hashing with bcrypt
- [x] User isolation in database queries
- [x] CORS configured with specific origins
- [x] No wildcard CORS with credentials
- [x] Payment signature verification
- [x] Webhook signature validation
- [x] AI API keys not exposed to frontend
- [x] SQL injection prevented by ORM
- [x] No secrets in .gitignore
- [x] .env files excluded from version control
- [ ] Rate limiting (not implemented)
- [ ] HTTPS enforcement (expected at proxy)
- [ ] CSP headers (not implemented)
- [ ] Request logging (basic logging added)
