import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/subscriptionApi.js', () => ({
  default: {
    getSubscription: vi.fn(),
    getPlans: vi.fn(),
    getEntitlements: vi.fn(),
    getUsage: vi.fn(),
    createCheckout: vi.fn(),
    verifyPayment: vi.fn(),
    cancelSubscription: vi.fn(),
    reactivateSubscription: vi.fn(),
    getBillingHistory: vi.fn(),
    checkFeature: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: "testuser", email: "test@test.com" },
    isAuthenticated: true,
    isGuest: false,
  }),
}));

import subscriptionApi from '../api/subscriptionApi.js';
import { PLANS, formatPrice } from '../config/plans.js';
import { SubscriptionProvider, useSubscription } from '../hooks/useSubscription.jsx';
import PremiumGate from '../components/subscription/PremiumGate.jsx';
import UsageLimitBanner from '../components/subscription/UsageLimitBanner.jsx';
import UpgradePrompt from '../components/subscription/UpgradePrompt.jsx';

const renderPage = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

const renderWithSubscription = (component) =>
  render(
    <BrowserRouter>
      <SubscriptionProvider>
        {component}
      </SubscriptionProvider>
    </BrowserRouter>
  );

// Helper component to test useSubscription hook
function TestHookComponent({ onResult }) {
  const { currentPlan, hasEntitlement, checkUsage, loading } = useSubscription();
  React.useEffect(() => {
    if (!loading) {
      onResult({ currentPlan, hasEntitlement, checkUsage });
    }
  }, [loading, currentPlan, hasEntitlement, checkUsage, onResult]);
  return null;
}

describe('Plan Configuration', () => {
  it('has four plans', () => {
    expect(PLANS).toHaveLength(4);
  });

  it('has correct plan IDs', () => {
    const ids = PLANS.map(p => p.id);
    expect(ids).toContain('free');
    expect(ids).toContain('student');
    expect(ids).toContain('premium');
    expect(ids).toContain('pro');
  });

  it('has correct prices', () => {
    expect(PLANS.find(p => p.id === 'free').price_inr).toBe(0);
    expect(PLANS.find(p => p.id === 'student').price_inr).toBe(99);
    expect(PLANS.find(p => p.id === 'premium').price_inr).toBe(299);
    expect(PLANS.find(p => p.id === 'pro').price_inr).toBe(699);
  });

  it('all plans have features', () => {
    PLANS.forEach(plan => {
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });

  it('formatPrice shows Free for zero', () => {
    expect(formatPrice(0)).toBe('Free');
  });

  it('formatPrice shows rupee symbol', () => {
    expect(formatPrice(99)).toContain('99');
  });
});

describe('PricingCard Component', () => {
  let PricingCard;
  beforeEach(async () => {
    PricingCard = (await import('../components/subscription/PricingCard.jsx')).default;
  });

  it('renders plan name', () => {
    renderPage(<PricingCard plan={PLANS[0]} onSelect={vi.fn()} />);
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(2);
  });

  it('renders price', () => {
    renderPage(<PricingCard plan={PLANS[1]} onSelect={vi.fn()} />);
    expect(screen.getByText(/99/)).toBeTruthy();
  });

  it('shows current plan indicator', () => {
    renderPage(<PricingCard plan={PLANS[0]} currentPlanId="free" onSelect={vi.fn()} />);
    expect(screen.getByText('Current Plan')).toBeTruthy();
  });

  it('shows upgrade button for non-current plans', () => {
    renderPage(<PricingCard plan={PLANS[1]} currentPlanId="free" onSelect={vi.fn()} />);
    expect(screen.getByText('Upgrade')).toBeTruthy();
  });

  it('renders features list', () => {
    renderPage(<PricingCard plan={PLANS[0]} onSelect={vi.fn()} />);
    expect(screen.getByText(/Basic courses/)).toBeTruthy();
  });
});

describe('SubscriptionStatus Component', () => {
  let SubscriptionStatus;
  beforeEach(async () => {
    SubscriptionStatus = (await import('../components/subscription/SubscriptionStatus.jsx')).default;
  });

  it('renders plan name', () => {
    renderPage(<SubscriptionStatus subscription={{ plan_name: "Student", plan_id: "student", status: "active", price_inr: 99 }} />);
    expect(screen.getByText('Student')).toBeTruthy();
  });

  it('shows active status', () => {
    renderPage(<SubscriptionStatus subscription={{ plan_name: "Free", plan_id: "free", status: "active", price_inr: 0 }} />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows canceled status', () => {
    renderPage(<SubscriptionStatus subscription={{ plan_name: "Student", plan_id: "student", status: "active", cancel_at_period_end: true, price_inr: 99 }} />);
    expect(screen.getByText('Cancels at period end')).toBeTruthy();
  });

  it('returns null for no subscription', () => {
    const { container } = renderPage(<SubscriptionStatus subscription={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows manage button when provided', () => {
    renderPage(<SubscriptionStatus subscription={{ plan_name: "Free", plan_id: "free", status: "active", price_inr: 0 }} onManage={vi.fn()} />);
    expect(screen.getByText('Manage')).toBeTruthy();
  });
});

describe('BillingHistory Component', () => {
  let BillingHistory;
  beforeEach(async () => {
    BillingHistory = (await import('../components/subscription/BillingHistory.jsx')).default;
  });

  it('shows empty state', () => {
    renderPage(<BillingHistory transactions={[]} />);
    expect(screen.getByText('No billing history yet')).toBeTruthy();
  });

  it('renders transactions', () => {
    const tx = [{ id: 1, plan_id: "student", amount_inr: 99, status: "completed", created_at: "2026-09-01T00:00:00" }];
    renderPage(<BillingHistory transactions={tx} />);
    expect(screen.getByText('student')).toBeTruthy();
    expect(screen.getByText('completed')).toBeTruthy();
  });
});

describe('UsageLimitCard Component', () => {
  let UsageLimitCard;
  beforeEach(async () => {
    UsageLimitCard = (await import('../components/subscription/UsageLimitCard.jsx')).default;
  });

  it('renders usage info', () => {
    renderPage(<UsageLimitCard usageType="ai_coach_daily" current={3} limit={5} />);
    expect(screen.getByText('AI Coach')).toBeTruthy();
    expect(screen.getByText('3/5')).toBeTruthy();
  });

  it('shows limit reached', () => {
    renderPage(<UsageLimitCard usageType="ai_coach_daily" current={5} limit={5} onUpgrade={vi.fn()} />);
    expect(screen.getByText('Daily limit reached')).toBeTruthy();
    expect(screen.getByText('View plans')).toBeTruthy();
  });

  it('shows approaching limit', () => {
    renderPage(<UsageLimitCard usageType="ai_coach_daily" current={4} limit={5} />);
    expect(screen.getByText('Approaching daily limit')).toBeTruthy();
  });
});

describe('Subscription Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays subscription', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active", price_inr: 0,
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", plan_name: "Free", features: [], usage: {},
    });
    subscriptionApi.getBillingHistory.mockResolvedValue([]);

    const Subscription = (await import('../pages/Subscription.jsx')).default;
    renderPage(<Subscription />);
    await waitFor(() => {
      expect(screen.getAllByText('Subscription').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows loading state', async () => {
    subscriptionApi.getSubscription.mockReturnValue(new Promise(() => {}));
    subscriptionApi.getEntitlements.mockReturnValue(new Promise(() => {}));
    subscriptionApi.getBillingHistory.mockReturnValue(new Promise(() => {}));

    const Subscription = (await import('../pages/Subscription.jsx')).default;
    renderPage(<Subscription />);
    expect(screen.getByText('Loading subscription...')).toBeTruthy();
  });
});

describe('Pricing Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pricing page', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });

    const Pricing = (await import('../pages/Pricing.jsx')).default;
    renderPage(<Pricing />);
    await waitFor(() => {
      expect(screen.getByText('Choose Your Learning Path')).toBeTruthy();
    });
  });

  it('displays all plan cards', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });

    const Pricing = (await import('../pages/Pricing.jsx')).default;
    renderPage(<Pricing />);
    await waitFor(() => {
      expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Student')).toBeTruthy();
      expect(screen.getByText('Premium')).toBeTruthy();
      expect(screen.getByText('Pro')).toBeTruthy();
    });
  });
});

// ── Phase 14.1 Integration Tests ─────────────────────────────────

describe('useSubscription Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads subscription data', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: ["basic_courses"], usage: {},
    });

    let result;
    renderWithSubscription(
      <TestHookComponent onResult={(r) => { result = r; }} />
    );

    await waitFor(() => {
      expect(result).toBeTruthy();
      expect(result.currentPlan).toBe('free');
    });
  });

  it('hasEntitlement returns true for included feature', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: ["basic_courses", "basic_ai_coach"], usage: {},
    });

    let result;
    renderWithSubscription(
      <TestHookComponent onResult={(r) => { result = r; }} />
    );

    await waitFor(() => {
      expect(result).toBeTruthy();
      expect(result.hasEntitlement('basic_courses')).toBe(true);
      expect(result.hasEntitlement('basic_ai_coach')).toBe(true);
      expect(result.hasEntitlement('creator_tools')).toBe(false);
    });
  });

  it('checkUsage returns correct usage info', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {
        ai_coach_daily: { current: 3, limit: 5, remaining: 2 },
      },
    });

    let result;
    renderWithSubscription(
      <TestHookComponent onResult={(r) => { result = r; }} />
    );

    await waitFor(() => {
      expect(result).toBeTruthy();
      const usage = result.checkUsage('ai_coach_daily');
      expect(usage.current).toBe(3);
      expect(usage.limit).toBe(5);
      expect(usage.remaining).toBe(2);
      expect(usage.allowed).toBe(true);
    });
  });
});

describe('PremiumGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows children when entitled', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "student", plan_name: "Student", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "student", features: ["full_course_access"], usage: {},
    });

    renderWithSubscription(
      <PremiumGate feature="full_course_access">
        <div>Premium Content</div>
      </PremiumGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Premium Content')).toBeTruthy();
    });
  });

  it('shows locked state when not entitled', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {},
    });

    renderWithSubscription(
      <PremiumGate feature="full_course_access">
        <div>Premium Content</div>
      </PremiumGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Premium Feature')).toBeTruthy();
      expect(screen.getByText('This feature is available with Student plan or higher.')).toBeTruthy();
      expect(screen.queryByText('Premium Content')).toBeNull();
    });
  });

  it('shows upgrade CTA', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {},
    });

    renderWithSubscription(
      <PremiumGate feature="full_course_access">
        <div>Premium Content</div>
      </PremiumGate>
    );

    await waitFor(() => {
      expect(screen.getByText('View plans')).toBeTruthy();
    });
  });
});

describe('UsageLimitBanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows usage progress', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {
        ai_coach_daily: { current: 3, limit: 5, remaining: 2 },
      },
    });

    renderWithSubscription(<UsageLimitBanner usageType="ai_coach_daily" />);

    await waitFor(() => {
      expect(screen.getByText('AI Coach today')).toBeTruthy();
      expect(screen.getByText('3/5')).toBeTruthy();
    });
  });

  it('shows limit reached state', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {
        ai_coach_daily: { current: 5, limit: 5, remaining: 0 },
      },
    });

    renderWithSubscription(<UsageLimitBanner usageType="ai_coach_daily" />);

    await waitFor(() => {
      expect(screen.getByText('Daily limit reached')).toBeTruthy();
      expect(screen.getByText('View plans')).toBeTruthy();
    });
  });

  it('shows warning when approaching limit', async () => {
    subscriptionApi.getSubscription.mockResolvedValue({
      plan_id: "free", plan_name: "Free", status: "active",
    });
    subscriptionApi.getEntitlements.mockResolvedValue({
      plan_id: "free", features: [], usage: {
        ai_coach_daily: { current: 4, limit: 5, remaining: 1 },
      },
    });

    renderWithSubscription(<UsageLimitBanner usageType="ai_coach_daily" />);

    await waitFor(() => {
      expect(screen.getByText('4/5')).toBeTruthy();
      expect(screen.queryByText('Daily limit reached')).toBeNull();
    });
  });
});

describe('UpgradePrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upgrade CTA', () => {
    renderPage(<UpgradePrompt feature="full_course_access" />);
    expect(screen.getByText('Upgrade to Student')).toBeTruthy();
    expect(screen.getByText('View plans')).toBeTruthy();
  });

  it('shows compact mode', () => {
    renderPage(<UpgradePrompt feature="full_course_access" compact />);
    expect(screen.getByText('Upgrade to Student')).toBeTruthy();
    expect(screen.getByText('Upgrade')).toBeTruthy();
  });

  it('shows premium features list', () => {
    renderPage(<UpgradePrompt feature="advanced_analytics" />);
    expect(screen.getByText('Upgrade to Premium')).toBeTruthy();
    expect(screen.getByText('Everything in Student')).toBeTruthy();
  });
});
