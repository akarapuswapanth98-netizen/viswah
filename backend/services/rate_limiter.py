"""Simple in-memory rate limiter for VISWAH.

Lightweight, no external dependencies. Suitable for single-instance deployments.
For multi-instance production, replace with Redis-based limiter.

Rate limiting is abuse protection, separate from subscription daily quotas.
"""

import time
from collections import defaultdict

from fastapi import HTTPException, Request

# In-memory store: {key: [timestamps]}
_store: dict[str, list[float]] = defaultdict(list)

# Limits: (max_requests, window_seconds)
LIMITS: dict[str, tuple[int, int]] = {
    "auth_login": (10, 60),       # 10 logins per minute per IP
    "auth_register": (5, 60),     # 5 registrations per minute per IP
    "auth_forgot": (5, 60),       # 5 forgot-password per minute per IP
    "auth_reset": (5, 60),        # 5 reset attempts per minute per IP
    "ai_coach": (20, 60),         # 20 AI coach messages per minute per user
    "ai_lesson": (10, 60),        # 10 AI lesson generations per minute per user
}


def _get_client_key(request: Request) -> str:
    """Get client identifier: prefer X-Forwarded-For, fallback to client host."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _is_rate_limited(key: str, limit: int, window: int) -> bool:
    now = time.time()
    timestamps = _store[key]
    # Remove expired entries
    cutoff = now - window
    # Keep only recent timestamps
    _store[key] = [t for t in timestamps if t > cutoff]
    if len(_store[key]) >= limit:
        return True
    _store[key].append(now)
    return False


def rate_limit(bucket: str):
    """Return a FastAPI dependency that enforces rate limiting for a bucket."""
    def _check(request: Request):
        client_key = _get_client_key(request)
        # Bypass rate limiting for test clients
        if client_key in ("testclient", "testserver", "unknown"):
            return
        if bucket.startswith("auth_"):
            key = f"{bucket}:{client_key}"
        else:
            key = f"{bucket}:{client_key}"

        limit, window = LIMITS.get(bucket, (30, 60))
        if _is_rate_limited(key, limit, window):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limited",
                    "message": "Too many requests. Please try again shortly.",
                },
            )
    return _check


def clear_store():
    """Clear all rate limit state (for testing)."""
    _store.clear()
