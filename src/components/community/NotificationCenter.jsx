import C from "../ui/colors";

const NOTIF_ICONS = {
  like: "\u{2764}\u{FE0F}", comment: "\u{1F4AC}", follow: "\u{1F44D}",
  challenge: "\u{1F3AF}", group: "\u{1F465}",
};

export default function NotificationCenter({ notifications, onMarkRead, unreadCount }) {
  if (!notifications) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 16,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14,
      }}>
        <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>
          Notifications {unreadCount > 0 && (
            <span style={{
              background: C.primary, color: C.ink, borderRadius: 10,
              padding: "1px 7px", fontSize: 11, fontWeight: 700, marginLeft: 6,
            }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkRead}
            style={{
              background: "none", border: "none", color: C.secondary,
              fontSize: 12, cursor: "pointer",
            }}
          >Mark all read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>
          No notifications yet
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 0", borderBottom: `1px solid ${C.border}`,
              opacity: n.is_read ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 16 }}>{NOTIF_ICONS[n.notification_type] || "\u{1F514}"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: 13 }}>{n.content}</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
                {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
              </div>
            </div>
            {!n.is_read && (
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: C.primary, flexShrink: 0, marginTop: 4,
              }} />
            )}
          </div>
        ))
      )}
    </div>
  );
}
