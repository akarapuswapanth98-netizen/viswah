import C from "../ui/colors";

const TYPE_LABELS = {
  weekly: "\u{1F4C5} Weekly", daily: "\u{23F0} Daily",
  special: "\u{2B50} Special",
};

export default function ChallengeCard({ challenge, onJoin }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 18, marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{
            display: "inline-block", background: C.elevated, padding: "3px 8px",
            borderRadius: 6, fontSize: 10, color: C.secondary, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
          }}>
            {TYPE_LABELS[challenge.challenge_type] || challenge.challenge_type}
          </div>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {challenge.title}
          </div>
          {challenge.description && (
            <div style={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.4 }}>
              {challenge.description}
            </div>
          )}
        </div>
        <div style={{
          background: `${C.primary}15`, padding: "6px 10px", borderRadius: 8,
          color: C.primary, fontSize: 12, fontWeight: 600, flexShrink: 0,
        }}>
          +{challenge.xp_reward} XP
        </div>
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 12, color: C.textMuted }}>
          {"\u{1F465}"} {challenge.participants_count} participants
        </div>
        {onJoin && (
          <button
            onClick={() => onJoin(challenge.id)}
            style={{
              background: C.primary, color: C.ink, border: "none",
              borderRadius: 8, padding: "8px 16px", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}
          >Join Challenge</button>
        )}
      </div>
    </div>
  );
}
