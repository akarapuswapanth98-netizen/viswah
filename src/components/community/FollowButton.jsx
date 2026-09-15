import C from "../ui/colors";

export default function FollowButton({ isFollowing, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{
        background: isFollowing ? "none" : C.primary,
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
