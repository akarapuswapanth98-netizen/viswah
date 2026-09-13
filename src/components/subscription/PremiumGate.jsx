import { useSubscription } from "../../hooks/useSubscription.jsx";
import { useNavigate } from "react-router-dom";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function PremiumGate({ feature, children, fallback }) {
  const { hasEntitlement, currentPlan, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{
        padding: 40, textAlign: "center",
        color: C.textMuted, fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  if (hasEntitlement(feature)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "40px 24px",
      textAlign: "center",
      maxWidth: 400,
      margin: "40px auto",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `${C.saffron}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", fontSize: 24,
      }}>
        {"\u{1F512}"}
      </div>
      <h3 style={{
        color: C.text, fontSize: 18, fontWeight: 700,
        marginBottom: 8,
      }}>
        Premium Feature
      </h3>
      <p style={{
        color: C.textSecondary, fontSize: 14,
        marginBottom: 24, lineHeight: 1.5,
      }}>
        This feature is available with Student plan or higher.
      </p>
      <button
        onClick={() => navigate("/pricing")}
        style={{
          padding: "12px 32px", borderRadius: 12,
          background: `linear-gradient(135deg, ${C.saffron}, ${C.saffron}CC)`,
          color: C.ink, border: "none", fontSize: 14, fontWeight: 700,
          cursor: "pointer", transition: "all 0.2s",
        }}
        onMouseEnter={(e) => e.target.style.opacity = "0.9"}
        onMouseLeave={(e) => e.target.style.opacity = "1"}
      >
        View plans
      </button>
    </div>
  );
}
