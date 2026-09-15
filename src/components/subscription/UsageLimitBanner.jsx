import { useSubscription } from "../../hooks/useSubscription.jsx";
import { useNavigate } from "react-router-dom";

import C from "../ui/colors";

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
      : C.secondary;

  return (
    <div style={{
      background: isLimitReached
        ? "rgba(239, 68, 68, 0.08)"
        : isApproaching
          ? "rgba(245, 158, 11, 0.08)"
          : `${C.secondary}08`,
      border: `1px solid ${isLimitReached ? "rgba(239, 68, 68, 0.2)" : isApproaching ? "rgba(245, 158, 11, 0.2)" : `${C.secondary}20`}`,
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
          color: isLimitReached ? C.error : isApproaching ? C.warning : C.secondary,
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
                background: `${C.primary}15`,
                color: C.primary, border: `1px solid ${C.primary}30`,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.background = `${C.primary}25`}
              onMouseLeave={(e) => e.target.style.background = `${C.primary}15`}
            >
              View plans
            </button>
          )}
        </div>
      )}
    </div>
  );
}
