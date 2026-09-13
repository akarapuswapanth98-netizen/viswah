import { useState, useEffect, useCallback, createContext, useContext } from "react";
import subscriptionApi from "../api/subscriptionApi";
import { useAuth } from "../context/AuthContext";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setEntitlements(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [subData, entData] = await Promise.all([
        subscriptionApi.getSubscription(),
        subscriptionApi.getEntitlements(),
      ]);
      setSubscription(subData);
      setEntitlements(entData);
    } catch (err) {
      setError(err);
      setSubscription(null);
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const refreshSubscription = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  const hasEntitlement = useCallback(
    (feature) => {
      if (!entitlements?.features) return false;
      return entitlements.features.includes(feature);
    },
    [entitlements]
  );

  const checkUsage = useCallback(
    (usageType) => {
      if (!entitlements?.usage?.[usageType]) {
        return { allowed: true, current: 0, limit: 0, remaining: 0 };
      }
      const u = entitlements.usage[usageType];
      return {
        allowed: u.remaining > 0,
        current: u.current,
        limit: u.limit,
        remaining: u.remaining,
      };
    },
    [entitlements]
  );

  const value = {
    currentPlan: subscription?.plan_id || "free",
    subscriptionStatus: subscription?.status || "active",
    subscription,
    entitlements,
    loading,
    error,
    refreshSubscription,
    hasEntitlement,
    checkUsage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
