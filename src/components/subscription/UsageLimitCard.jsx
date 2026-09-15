import C from "../ui/colors";

const usageLabels = {
  ai_coach_daily: { label: "AI Coach", icon: "\uD83C\uDFAF" },
  ai_lessons_daily: { label: "AI Lessons", icon: "\uD83E\uDD16" },
  music_lab_daily: { label: "Music Lab", icon: "\uD83D\uDD0A" },
  practice_sessions_daily: { label: "Practice Sessions", icon: "\uD83C\uDFB5" },
};

export default function UsageLimitCard({ usageType, current, limit, onUpgrade }) {
  const info = usageLabels[usageType] || { label: usageType, icon: "\u2699" };
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const barColor = isAtLimit ? "#EF4444" : isNearLimit ? C.primary : C.secondary;

  return (
    <div style={{
      background: C.surface, borderRadius: 14, padding: "18px 20px",
      border: `1px solid ${isAtLimit ? "rgba(239,68,68,0.2)" : C.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{info.icon}</span>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{info.label}</span>
        </div>
        <span style={{
          color: isAtLimit ? "#EF4444" : C.textSecondary, fontSize: 13, fontWeight: 600,
        }}>
          {current}/{limit}
        </span>
      </div>

      <div style={{
        height: 6, borderRadius: 3, background: C.elevated, overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          height: "100%", borderRadius: 3, background: barColor,
          width: `${percentage}%`, transition: "width 0.3s ease-out",
        }} />
      </div>

      {isAtLimit && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 600 }}>
            Daily limit reached
          </span>
          {onUpgrade && (
            <button onClick={onUpgrade} style={{
              background: `${C.primary}15`, color: C.primary, border: `1px solid ${C.primary}25`,
              padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}>
              View plans
            </button>
          )}
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <span style={{ color: C.primary, fontSize: 12, fontWeight: 500 }}>
          Approaching daily limit
        </span>
      )}
    </div>
  );
}
