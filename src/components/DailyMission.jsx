import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { onKeyDown } from "../utils/keyboard";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  success: "#6DBF73",
};

function DailyMission({ mission, mounted = true }) {
  const navigate = useNavigate();

  if (!mission) return null;

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Today's mission: ${mission.title}. ${mission.description}`}
      onClick={() => {
        if (mission.route) navigate(mission.route);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (mission.route) navigate(mission.route);
        }
      }}
      style={{
        background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
        border: `1px solid ${C.saffron}30`,
        borderRadius: 18,
        padding: 24,
        cursor: "pointer",
        transition: "all 0.3s ease-out",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.saffron + "60";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(232, 168, 56, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.saffron + "30";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${C.saffron}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          {mission.icon || "🎯"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
              color: C.saffron, background: `${C.saffron}15`,
              padding: "2px 8px", borderRadius: 6,
            }}>
              Today's Mission
            </span>
            {mission.estimated_duration && (
              <span style={{ color: C.textMuted, fontSize: 12 }}>
                {mission.estimated_duration}
              </span>
            )}
          </div>
          <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>
            {mission.title}
          </h3>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: "0 0 8px", lineHeight: 1.4 }}>
            {mission.description}
          </p>
          {mission.reason && (
            <p style={{ color: C.textMuted, fontSize: 12, margin: 0, fontStyle: "italic" }}>
              {mission.reason}
            </p>
          )}
        </div>
        <span style={{ color: C.saffron, fontSize: 18, flexShrink: 0, marginTop: 4 }}>→</span>
      </div>
    </div>
  );
}

export default memo(DailyMission);
