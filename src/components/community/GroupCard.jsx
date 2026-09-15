import C from "../ui/colors";

const CATEGORY_ICONS = {
  classical: "\u{1F3BB}", jazz: "\u{1F3B7}", beginner: "\u{1F331}",
  world: "\u{1F30D}", improvisation: "\u{1F3B5}",
};

export default function GroupCard({ group, onJoin, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate && onNavigate(`/community/groups/${group.id}`)}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 18, cursor: onNavigate ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: C.elevated,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {CATEGORY_ICONS[group.category] || "\u{1F3B5}"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {group.name}
          </div>
          {group.description && (
            <div style={{
              color: C.textSecondary, fontSize: 12, lineHeight: 1.4,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>{group.description}</div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 11, color: C.textMuted }}>
            <span>{"\u{1F465}"} {group.members_count} members</span>
            {group.tradition && <span>{"\u{1F30D}"} {group.tradition}</span>}
            <span style={{
              background: C.elevated, padding: "2px 6px", borderRadius: 4,
              textTransform: "capitalize",
            }}>{group.difficulty}</span>
          </div>
        </div>
        {onJoin && (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin(group.id); }}
            style={{
              background: group.is_member ? "none" : C.secondary,
              color: group.is_member ? C.textMuted : C.ink,
              border: group.is_member ? `1px solid ${C.border}` : "none",
              borderRadius: 8, padding: "10px 16px", fontSize: 12,
              fontWeight: 600, cursor: "pointer", flexShrink: 0, minHeight: 40,
            }}
          >
            {group.is_member ? "Joined" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}
