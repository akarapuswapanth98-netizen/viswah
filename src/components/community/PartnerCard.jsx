import FollowButton from "./FollowButton";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function PartnerCard({ partner, onFollow, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate && onNavigate(`/profile/${partner.username}`)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 16, cursor: onNavigate ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `linear-gradient(135deg, ${C.saffron}22, ${C.teal}22)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, color: C.saffron, flexShrink: 0,
      }}>
        {(partner.username || "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>
          {partner.display_name || partner.username}
        </div>
        <div style={{ color: C.textMuted, fontSize: 11 }}>
          Level {partner.level} {partner.primary_style ? `\u{00B7} ${partner.primary_style}` : ""}
          {partner.current_streak ? ` \u{00B7} ${partner.current_streak}d streak` : ""}
        </div>
      </div>
      <FollowButton onClick={() => onFollow && onFollow(partner.user_id)} />
    </div>
  );
}
