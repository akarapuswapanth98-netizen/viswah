import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import subscriptionApi from "../api/subscriptionApi";
import PricingCard from "../components/subscription/PricingCard";
import { PLANS } from "../config/plans";

import C from "../components/ui/colors";

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSubscription = async () => {
    try {
      const data = await subscriptionApi.getSubscription();
      setSubscription(data);
    } catch (e) {
      // User may not have subscription yet
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (planId === "free" || planId === subscription?.plan_id) {
      navigate("/subscription");
      return;
    }
    setPurchasing(true);
    setMessage(null);
    try {
      const checkout = await subscriptionApi.createCheckout(planId);
      if (checkout.provider === "dev") {
        const result = await subscriptionApi.verifyPayment({
          provider: "dev",
          order_id: checkout.order_id,
          plan_id: planId,
        });
        if (result.success) {
          setMessage({ type: "success", text: `Upgraded to ${PLANS.find(p => p.id === planId)?.name || planId}!` });
          loadSubscription();
        }
      } else {
        setMessage({ type: "info", text: "Payment provider configured. Checkout opening..." });
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Failed to start checkout" });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.ink,
      paddingBottom: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{
          textAlign: "center", marginBottom: 48,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}>
          <h1 style={{
            color: C.text, fontSize: 36, fontWeight: 800, marginBottom: 12,
            lineHeight: 1.2,
          }}>
            Choose Your Learning Path
          </h1>
          <p style={{
            color: C.textSecondary, fontSize: 16, maxWidth: 500, margin: "0 auto",
          }}>
            Start free, upgrade when you are ready. No hidden fees.
          </p>
        </div>

        {message && (
          <div style={{
            maxWidth: 600, margin: "0 auto 24px",
            padding: "14px 20px", borderRadius: 12,
            background: message.type === "success" ? `${C.secondary}15` : message.type === "error" ? "rgba(239,68,68,0.1)" : `${C.primary}15`,
            color: message.type === "success" ? C.secondary : message.type === "error" ? "#EF4444" : C.primary,
            fontSize: 14, fontWeight: 600, textAlign: "center",
            border: `1px solid ${message.type === "success" ? `${C.secondary}25` : message.type === "error" ? "rgba(239,68,68,0.2)" : `${C.primary}25`}`,
          }}>
            {message.text}
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out 0.15s",
        }}>
          {PLANS.map((plan, i) => (
            <div key={plan.id} style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.5s ease-out ${0.2 + i * 0.1}s`,
            }}>
              <PricingCard
                plan={plan}
                currentPlanId={subscription?.plan_id}
                onSelect={handleSelectPlan}
              />
            </div>
          ))}
        </div>

        <div style={{
          textAlign: "center", marginTop: 40,
          color: C.textMuted, fontSize: 13,
        }}>
          All plans include SSL encryption. Prices in Indian Rupees (INR).
          Cancel anytime. No questions asked.
        </div>
      </div>
    </div>
  );
}
