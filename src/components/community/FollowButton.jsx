const C = {
  ink: "#0C0A14", saffron: "#E8A838", teal: "#5BA8A0",
  textMuted: "#6B6080", elevated: "#241E38",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function FollowButton({ isFollowing, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{
        background: isFollowing ? "none" : C.saffron,
        color: isFollowing ? C.textMuted : C.ink,
        border: isFollowing ? `1px solid ${C.border}` : "none",
        borderRadius: 8, padding: "6px 14px", fontSize: 12,
        fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
