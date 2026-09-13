# Subscription System

## Overview

VISWAH implements a 4-tier subscription model with server-side entitlement enforcement, Razorpay payment integration, and daily usage limits.

## Plans

| Plan | Price | Course Access | AI Coach | AI Lessons | Music Lab | Practice |
|------|-------|---------------|----------|------------|-----------|----------|
| **Free** | ₹0/mo | Stage 1-2 | 5/day | 2/day | 10/day | 10/day |
| **Student** | ₹99/mo | All stages | 15/day | 10/day | 50/day | 50/day |
| **Premium** | ₹299/mo | All stages | 30/day | 30/day | 100/day | 100/day |
| **Pro** | ₹699/mo | All stages | 100/day | 100/day | 500/day | 500/day |

## Architecture

### Backend
```
routes/subscriptions.py    — Subscription CRUD, checkout, verification
routes/payments.py         — Razorpay webhook handler
services/plan_config.py    — Plan definitions and pricing
services/entitlement_engine.py — Feature access and usage tracking
services/entitlement_middleware.py — FastAPI dependency injection
models/models.py           — Subscription, PaymentTransaction, UsageRecord
```

### Frontend
```
api/subscriptionApi.js     — API client for subscription endpoints
config/plans.js            — Client-side plan configuration
hooks/useSubscription.jsx  — SubscriptionProvider + useSubscription hook
components/subscription/
├── PricingCard.jsx        — Plan card for pricing page
├── SubscriptionStatus.jsx — Current subscription display
├── BillingHistory.jsx     — Transaction history
├── UsageLimitCard.jsx     — Usage display with progress bar
├── UsageLimitBanner.jsx   — Inline usage warning
├── PremiumGate.jsx        — Content gating component
└── UpgradePrompt.jsx      — Upgrade CTA
pages/Pricing.jsx          — Pricing page
pages/Subscription.jsx     — Subscription management page
```

## API Endpoints

### Subscription Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get current subscription |
| GET | `/api/subscription/plans` | List all plans |
| GET | `/api/subscription/entitlements` | Get user entitlements |
| GET | `/api/subscription/usage` | Get current usage |
| POST | `/api/subscription/checkout` | Create checkout session |
| POST | `/api/subscription/verify` | Verify payment |
| POST | `/api/subscription/cancel` | Cancel subscription |
| POST | `/api/subscription/reactivate` | Reactivate canceled |
| GET | `/api/subscription/billing` | Billing history |
| GET | `/api/subscription/check/{feature}` | Check feature access |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/webhook` | Razorpay webhook |

## Entitlement System

### How It Works

1. **Plan Lookup:** User's plan is determined from `subscriptions` table
2. **Feature Check:** `entitlement_engine.can_access(feature)` checks plan entitlements
3. **Usage Check:** `entitlement_engine.check_usage_or_denied(type)` checks daily limits
4. **Middleware:** FastAPI dependencies inject checks into route handlers

### Enforcement Points

| Feature | Route | Usage Type |
|---------|-------|------------|
| AI Coach chat | `POST /api/ai-coach/message` | `ai_coach_daily` |
| AI Lesson generation | `POST /api/ai/generate-lesson` | `ai_lessons_daily` |
| AI Exercise generation | `POST /api/ai/generate-exercise` | `ai_lessons_daily` |
| Music Lab activities | `POST /api/practice/sessions` | `music_lab_daily` |
| Practice sessions | `POST /api/practice/sessions` | `practice_sessions_daily` |
| Stage 3+ course enrollment | `POST /api/courses/{id}/enroll` | `full_course_access` |

### Music Lab Dual Counter
Music Lab activities increment **both** counters:
- `practice_sessions_daily` (all practice)
- `music_lab_daily` (music lab specific)

This allows independent limits for music lab while still counting toward overall practice.

### Daily Reset
- Usage counters reset at midnight UTC
- Stored as `YYYY-MM-DD` strings in `usage_records` table
- Composite unique constraint prevents duplicate entries

## Payment Flow

### Checkout
1. Frontend calls `POST /api/subscription/checkout` with `plan_id`
2. Backend creates Razorpay order (or dev-mode simulation)
3. Returns `order_id` and `key_id` to frontend
4. Frontend opens Razorpay checkout modal
5. User completes payment
6. Frontend calls `POST /api/subscription/verify` with payment details

### Webhook Events
| Event | Handler | Action |
|-------|---------|--------|
| `subscription.authenticated` | `_handle_subscription_active` | Set status to active |
| `subscription.activated` | `_handle_subscription_active` | Set status to active |
| `subscription.charged` | `_handle_payment_success` | Mark transaction completed |
| `payment.captured` | `_handle_payment_success` | Mark transaction completed |
| `subscription.cancelled` | `_handle_subscription_canceled` | Set status to canceled |
| `subscription.expired` | `_handle_subscription_expired` | Set status to expired |
| `payment.failed` | `_handle_payment_failed` | Mark transaction failed |

### Idempotency
- Webhook handlers check for existing records before updates
- Duplicate events are safely ignored
- Payment transactions deduplicated by `provider_payment_id`

## Development Mode

When Razorpay credentials are not configured:
- Checkout creates simulated orders (fake order IDs)
- Payment verification is skipped (auto-approved)
- Webhook signature verification is skipped
- All features work as if on the Free plan

## Frontend Integration

### useSubscription Hook
```javascript
const {
  currentPlan,        // 'free' | 'student' | 'premium' | 'pro'
  subscriptionStatus, // 'active' | 'canceled' | 'expired'
  entitlements,       // ['basic_courses', 'basic_ai_coach', ...]
  usage,              // { ai_coach_daily: { current, limit, remaining } }
  hasEntitlement,     // (feature) => boolean
  checkUsage,         // (type) => { current, limit, remaining, allowed }
  refreshSubscription, // () => void
} = useSubscription();
```

### PremiumGate Component
```jsx
<PremiumGate feature="full_course_access">
  <div>Premium content here</div>
</PremiumGate>
```

### UsageLimitBanner Component
```jsx
<UsageLimitBanner usageType="ai_coach_daily" />
```
