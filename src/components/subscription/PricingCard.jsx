import { useState } from "react";
import { useNavigate } from "react-router-dom";

import C from "../ui/colors";

const planColors = { free: C.textMuted, student: C.secondary, premium: C.primary, pro: C.raga };

export default function PricingCard({ plan, currentPlanId, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const isCurrent = plan.id === currentPlanId;
  const color = planColors[plan.id] || C.secondary;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(plan.id)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(plan.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isCurrent
          ? `linear-gradient(135deg, ${color}15, ${color}08)`
          : hovered
            ? C.elevated
            : C.surface,
        border: `1px solid ${isCurrent ? `${color}40` : hovered ? `${color}25` : C.border}`,
        borderRadius: 18,
        padding: "28px 24px",
        cursor: isCurrent ? "default" : "pointer",
        transition: "all 0.3s ease-out",
        transform: hovered && !isCurrent ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isCurrent
          ? `0 0 24px ${color}10`
          : hovered
            ? `0 8px 32px rgba(0,0,0,0.3)`
            : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      aria-label={`${plan.name} plan - ${plan.price_inr === 0 ? "Free" : `\u20b9${plan.price_inr}/month`}`}
    >
      {plan.badge_label && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${color}, ${color}CC)`,
          color: plan.id === "free" ? C.text : "#0C0A14",
          fontSize: 11, fontWeight: 700, padding: "4px 14px",
          borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 0.5,
        }}>
          {plan.badge_label}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 20, marginTop: plan.badge_label ? 8 : 0 }}>
        <div style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {plan.name}
        </div>
        <div style={{ color: C.textSecondary, fontSize: 13, marginBottom: 12 }}>
          {plan.target_learner}
        </div>
        <div style={{ color, fontSize: 36, fontWeight: 800 }}>
          {plan.price_inr === 0 ? "Free" : `\u20b9${plan.price_inr}`}
        </div>
        {plan.price_inr > 0 && (
          <div style={{ color: C.textMuted, fontSize: 13 }}>/month</div>
        )}
      </div>

      <div style={{ flex: 1, marginBottom: 20 }}>
        {plan.features.map((feature, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            marginBottom: 10, fontSize: 13, color: C.textSecondary,
          }}>
            <span style={{ color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>{"\u2713"}</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {isCurrent ? (
        <div style={{
          textAlign: "center", padding: "12px 0", borderRadius: 12,
          background: `${color}15`, color, fontSize: 14, fontWeight: 600,
          border: `1px solid ${color}25`,
        }}>
          Current Plan
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect?.(plan.id); }}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12,
            background: plan.id === "free" ? `${color}20` : `linear-gradient(135deg, ${color}, ${color}CC)`,
            color: plan.id === "free" ? color : "#0C0A14",
            border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.opacity = "0.9"}
          onMouseLeave={(e) => e.target.style.opacity = "1"}
          aria-label={`Select ${plan.name} plan`}
        >
          {plan.price_inr === 0 ? "Get Started" : "Upgrade"}
        </button>
      )}
    </div>
  );
}
