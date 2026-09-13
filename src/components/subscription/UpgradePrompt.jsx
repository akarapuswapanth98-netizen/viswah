import { useNavigate } from "react-router-dom";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

const PLAN_FEATURES = {
  student: [
    "Full course access",
    "30 AI Coach messages/day",
    "50 Music Lab sessions/day",
    "Full practice studio",
  ],
  premium: [
    "Everything in Student",
    "100 AI Coach messages/day",
    "200 Music Lab sessions/day",
    "Advanced analytics",
    "Premium learning paths",
  ],
  pro: [
    "Everything in Premium",
    "500 AI Coach messages/day",
    "1000 Music Lab sessions/day",
    "Creator tools",
    "Priority support",
  ],
};

export default function UpgradePrompt({ feature, compact = false }) {
  const navigate = useNavigate();

  const targetPlan = feature?.includes("advanced") || feature?.includes("premium")
    ? "premium"
    : feature?.includes("creator") || feature?.includes("pro")
      ? "pro"
      : "student";

  const features = PLAN_FEATURES[targetPlan] || PLAN_FEATURES.student;
  const price = targetPlan === "student" ? 99 : targetPlan === "premium" ? 299 : 699;

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 12,
        background: `${C.saffron}08`,
        border: `1px solid ${C.saffron}20`,
      }}>
        <span style={{ color: C.saffron, fontSize: 16 }}>{"\u2B50"}</span>
        <div style={{ flex: 1 }}>
          <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
            Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
          </span>
          <span style={{ color: C.textMuted, fontSize: 12, marginLeft: 8 }}>
            from {"\u20b9"}{price}/month
          </span>
        </div>
        <button
          onClick={() => navigate("/pricing")}
          style={{
            padding: "8px 16px", borderRadius: 8,
            background: `linear-gradient(135deg, ${C.saffron}, ${C.saffron}CC)`,
            color: C.ink, border: "none", fontSize: 12, fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.opacity = "0.9"}
          onMouseLeave={(e) => e.target.style.opacity = "1"}
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "32px 24px",
      maxWidth: 400,
      margin: "32px auto",
    }}>
      <div style={{
        textAlign: "center", marginBottom: 24,
      }}>
        <h3 style={{
          color: C.text, fontSize: 18, fontWeight: 700,
          marginBottom: 8,
        }}>
          Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
        </h3>
        <p style={{
          color: C.textSecondary, fontSize: 14,
        }}>
          {"\u20b9"}{price}/month
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 10, fontSize: 13, color: C.textSecondary,
          }}>
            <span style={{ color: C.teal, fontSize: 14 }}>{"\u2713"}</span>
            <span>{f}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/pricing")}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
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
