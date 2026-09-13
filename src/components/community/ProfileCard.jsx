const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function ProfileCard({ profile, onNavigate, compact = false }) {
  if (!profile) return null;
  return (
    <div
      onClick={() => onNavigate && onNavigate(`/profile/${profile.username}`)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: compact ? 14 : 20,
        cursor: onNavigate ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: compact ? 0 : 12 }}>
        <div style={{
          width: compact ? 36 : 48, height: compact ? 36 : 48, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.saffron}22, ${C.teal}22)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: compact ? 14 : 18, fontWeight: 700, color: C.saffron,
        }}>
          {(profile.display_name || profile.username || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontSize: compact ? 13 : 15, fontWeight: 600 }}>
            {profile.display_name || profile.username}
          </div>
          <div style={{ color: C.textMuted, fontSize: 11 }}>
            Level {profile.level} {profile.primary_style ? `\u{00B7} ${profile.primary_style}` : ""}
          </div>
        </div>
      </div>
      {!compact && (
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: C.textSecondary }}>
          <span>{"\u{1F525}"} {profile.current_streak || 0}d streak</span>
          <span>{"\u{2B50}"} {profile.xp || 0} XP</span>
          {profile.followers_count != null && <span>{"\u{1F465}"} {profile.followers_count}</span>}
        </div>
      )}
    </div>
  );
}
