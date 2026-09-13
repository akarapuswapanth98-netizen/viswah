import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import subscriptionApi from "../api/subscriptionApi";
import SubscriptionStatus from "../components/subscription/SubscriptionStatus";
import BillingHistory from "../components/subscription/BillingHistory";
import UsageLimitCard from "../components/subscription/UsageLimitCard";
import { PLANS } from "../config/plans";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function Subscription() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sub, ent, hist] = await Promise.all([
        subscriptionApi.getSubscription(),
        subscriptionApi.getEntitlements(),
        subscriptionApi.getBillingHistory(),
      ]);
      setSubscription(sub);
      setEntitlements(ent);
      setHistory(hist);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      await subscriptionApi.cancelSubscription();
      setMessage({ type: "success", text: "Subscription will cancel at end of billing period" });
      loadData();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      await subscriptionApi.reactivateSubscription();
      setMessage({ type: "success", text: "Subscription reactivated" });
      loadData();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: `3px solid ${C.border}`,
            borderTopColor: C.saffron, borderRadius: "50%",
            animation: "spin 1s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading subscription...</p>
        </div>
      </div>
    );
  }

  const currentPlan = PLANS.find(p => p.id === subscription?.plan_id);
  const isPremium = subscription?.plan_id !== "free";
  const isCanceled = subscription?.cancel_at_period_end;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
            Subscription
          </h1>
        </div>

        {message && (
          <div style={{
            marginBottom: 20, padding: "14px 20px", borderRadius: 12,
            background: message.type === "success" ? `${C.teal}15` : "rgba(239,68,68,0.1)",
            color: message.type === "success" ? C.teal : "#EF4444",
            fontSize: 14, fontWeight: 600,
            border: `1px solid ${message.type === "success" ? `${C.teal}25` : "rgba(239,68,68,0.2)"}`,
          }}>
            {message.text}
          </div>
        )}

        <div style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.5s ease-out 0.1s",
        }}>
          <SubscriptionStatus subscription={subscription} onManage={() => navigate("/pricing")} />
        </div>

        {isPremium && (
          <div style={{
            marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap",
            opacity: mounted ? 1 : 0,
            transition: "all 0.5s ease-out 0.2s",
          }}>
            {!isCanceled ? (
              <button onClick={handleCancel} disabled={actionLoading === "cancel"} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "rgba(239,68,68,0.1)", color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
              }}>
                {actionLoading === "cancel" ? "Canceling..." : "Cancel Subscription"}
              </button>
            ) : (
              <button onClick={handleReactivate} disabled={actionLoading === "reactivate"} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: `${C.teal}15`, color: C.teal,
                border: `1px solid ${C.teal}25`, cursor: "pointer",
              }}>
                {actionLoading === "reactivate" ? "Reactivating..." : "Reactivate"}
              </button>
            )}
            <Link to="/pricing" style={{
              padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: `${C.saffron}15`, color: C.saffron,
              border: `1px solid ${C.saffron}25`, textDecoration: "none",
              display: "inline-block",
            }}>
              Change Plan
            </Link>
          </div>
        )}

        {entitlements?.usage && (
          <div style={{
            marginTop: 24,
            opacity: mounted ? 1 : 0,
            transition: "all 0.5s ease-out 0.3s",
          }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Today's Usage
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {Object.entries(entitlements.usage).map(([key, val]) => (
                <UsageLimitCard
                  key={key}
                  usageType={key}
                  current={val.current}
                  limit={val.limit}
                  onUpgrade={() => navigate("/pricing")}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 24,
          opacity: mounted ? 1 : 0,
          transition: "all 0.5s ease-out 0.4s",
        }}>
          <BillingHistory transactions={history} />
        </div>
      </div>
    </div>
  );
}
