import { useState } from "react";

import C from "../ui/colors";

const BOARD_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "helpful", label: "Most Helpful" },
  { value: "contributors", label: "Top Contributors" },
  { value: "challenges", label: "Challenge Champions" },
  { value: "rising", label: "Rising Musicians" },
];

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

export default function CommunityLeaderboard({ entries, onTypeChange }) {
  const [activeType, setActiveType] = useState("weekly");

  const handleType = (type) => {
    setActiveType(type);
    onTypeChange && onTypeChange(type);
  };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 16,
    }}>
      <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        Community Leaderboard
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {BOARD_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleType(t.value)}
            style={{
              background: activeType === t.value ? C.primary : C.elevated,
              color: activeType === t.value ? C.ink : C.textSecondary,
              border: "none", borderRadius: 6, padding: "5px 10px",
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >{t.label}</button>
        ))}
      </div>
      {!entries || entries.length === 0 ? (
        <div style={{ color: C.textMuted, fontSize: 13, textAlign: "center", padding: 16 }}>
          No entries yet
        </div>
      ) : (
        entries.map((entry, i) => (
          <div
            key={`${entry.user_id}-${i}`}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            <div style={{
              width: 28, textAlign: "center", fontSize: entry.rank <= 3 ? 16 : 13,
              color: entry.rank <= 3 ? C.primary : C.textMuted, fontWeight: 600,
            }}>
              {entry.rank <= 3 ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: C.elevated,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: C.primary,
            }}>
              {(entry.username || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>
                {entry.username}
              </div>
            </div>
            <div style={{
              color: C.secondary, fontSize: 13, fontWeight: 600,
            }}>
              {entry.score} <span style={{ fontSize: 10, color: C.textMuted }}>{entry.metric}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
