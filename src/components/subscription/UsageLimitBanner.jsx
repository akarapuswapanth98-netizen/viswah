import { useSubscription } from "../../hooks/useSubscription.jsx";
import { useNavigate } from "react-router-dom";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  error: "#EF4444", warning: "#F59E0B",
};

const USAGE_LABELS = {
  ai_coach_daily: "AI Coach",
  ai_lessons_daily: "AI Lessons",
  music_lab_daily: "Music Lab",
  practice_sessions_daily: "Practice Sessions",
};

export default function UsageLimitBanner({ usageType, showUpgrade = true }) {
  let subscription;
  try {
    subscription = useSubscription();
  } catch {
    return null;
  }
  const { checkUsage, currentPlan } = subscription;
  const navigate = useNavigate();
  const usage = checkUsage(usageType);

  if (usage.limit === 0) return null;

  const percentage = Math.min(100, Math.round((usage.current / usage.limit) * 100));
  const isLimitReached = usage.remaining === 0;
  const isApproaching = percentage >= 80 && !isLimitReached;

  const label = USAGE_LABELS[usageType] || usageType;

  const barColor = isLimitReached
    ? C.error
    : isApproaching
      ? C.warning
      : C.teal;

  return (
    <div style={{
      background: isLimitReached
        ? "rgba(239, 68, 68, 0.08)"
        : isApproaching
          ? "rgba(245, 158, 11, 0.08)"
          : `${C.teal}08`,
      border: `1px solid ${isLimitReached ? "rgba(239, 68, 68, 0.2)" : isApproaching ? "rgba(245, 158, 11, 0.2)" : `${C.teal}20`}`,
      borderRadius: 12,
      padding: "12px 16px",
      marginBottom: 16,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <span style={{
          color: C.textSecondary, fontSize: 13, fontWeight: 500,
        }}>
          {label} today
        </span>
        <span style={{
          color: isLimitReached ? C.error : isApproaching ? C.warning : C.teal,
          fontSize: 13, fontWeight: 600,
        }}>
          {usage.current}/{usage.limit}
        </span>
      </div>

      <div style={{
        height: 6, borderRadius: 3,
        background: `${C.textMuted}20`,
        overflow: "hidden",
        marginBottom: isLimitReached ? 12 : 0,
      }}>
        <div style={{
          height: "100%", width: `${percentage}%`,
          background: barColor,
          borderRadius: 3,
          transition: "width 0.3s ease",
        }} />
      </div>

      {isLimitReached && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            color: C.error, fontSize: 12, fontWeight: 500,
          }}>
            Daily limit reached
          </span>
          {showUpgrade && currentPlan !== "pro" && (
            <button
              onClick={() => navigate("/pricing")}
              style={{
                padding: "6px 16px", borderRadius: 8,
                background: `${C.saffron}15`,
                color: C.saffron, border: `1px solid ${C.saffron}30`,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.background = `${C.saffron}25`}
              onMouseLeave={(e) => e.target.style.background = `${C.saffron}15`}
            >
              View plans
            </button>
          )}
        </div>
      )}
    </div>
  );
}
