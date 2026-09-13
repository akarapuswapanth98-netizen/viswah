import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import communityApi from "../api/communityApi";

const C = {
  ink: "#0C0A14", surface: "#161222", elevated: "#241E38",
  saffron: "#E8A838", teal: "#5BA8A0", text: "#F0EBE3",
  textSecondary: "#A89FB8", textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
};

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getGroup(groupId);
      setGroup(data);
    } catch (e) {
      setError(e.message || "Group not found");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const result = await communityApi.joinGroup(groupId);
      setGroup((prev) => ({
        ...prev,
        is_member: result.joined,
        members_count: result.members_count,
        members: result.joined
          ? [...(prev.members || []), { user_id: 0, role: "member" }]
          : (prev.members || []).slice(0, -1),
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textMuted, fontSize: 14 }}>Loading group...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{
          background: C.surface, borderRadius: 14, padding: 40,
          textAlign: "center", color: C.textMuted, fontSize: 14,
        }}>{error || "Group not found"}</div>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", color: C.teal, fontSize: 13,
          cursor: "pointer", marginTop: 12,
        }}>{"\u{2190}"} Back</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
      <button onClick={() => navigate(-1)} style={{
        background: "none", border: "none", color: C.teal, fontSize: 13,
        cursor: "pointer", marginBottom: 20,
        }}>{"\u{2190}"} Back</button>

      <div style={{
        background: C.surface, borderRadius: 18, padding: 28,
        border: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
              {group.name}
            </h1>
            <div style={{ color: C.textMuted, fontSize: 13 }}>
              by @{group.creator_username}
            </div>
          </div>
          <button
            onClick={handleJoin}
            style={{
              background: group.is_member ? "none" : C.teal,
              color: group.is_member ? C.textMuted : C.ink,
              border: group.is_member ? `1px solid ${C.border}` : "none",
              borderRadius: 8, padding: "8px 16px", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            {group.is_member ? "Joined" : "Join Group"}
          </button>
        </div>

        {group.description && (
          <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
            {group.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.textMuted }}>
          <span>{"\u{1F465}"} {group.members_count} members</span>
          {group.category && <span>{"\u{1F3B5}"} {group.category}</span>}
          {group.tradition && <span>{"\u{1F30D}"} {group.tradition}</span>}
          <span style={{
            background: C.elevated, padding: "2px 8px", borderRadius: 4,
            textTransform: "capitalize",
          }}>{group.difficulty}</span>
        </div>
      </div>

      {group.members && group.members.length > 0 && (
        <div style={{
          background: C.surface, borderRadius: 14, padding: 20,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
            Members
          </div>
          {group.members.map((m, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", borderBottom: i < group.members.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: C.elevated,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: C.saffron,
              }}>{m.user_id}</div>
              <div style={{ flex: 1, color: C.textSecondary, fontSize: 13 }}>
                User #{m.user_id}
                {m.role === "admin" && (
                  <span style={{
                    background: `${C.saffron}15`, color: C.saffron,
                    padding: "1px 6px", borderRadius: 4, fontSize: 10,
                    marginLeft: 6, fontWeight: 600,
                  }}>Admin</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
