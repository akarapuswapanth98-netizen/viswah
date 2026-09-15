import { memo, useState, useEffect, useMemo } from "react";
import { onKeyDown } from "../utils/keyboard";

import C from "./ui/colors";

const TREND_COLORS = {
  improving: C.success,
  stable: C.secondary,
  declining: C.warning,
  insufficient_data: C.textMuted,
};

const TREND_LABELS = {
  improving: "Improving",
  stable: "Stable",
  declining: "Needs work",
  insufficient_data: "Not enough data",
};

function SkillBar({ skill, mounted, index }) {
  const hasScore = skill.score != null;
  const score = hasScore ? Math.round(skill.score) : 0;
  const barColor = hasScore
    ? score >= 70 ? C.success : score >= 50 ? C.secondary : score >= 30 ? C.warning : C.error
    : C.textMuted;

  return (
    <div
      role="listitem"
      aria-label={`${skill.label}: ${hasScore ? `${score}%` : 'Not enough data'}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.4s ease-out ${index * 50}ms, transform 0.4s ease-out ${index * 50}ms`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{skill.icon}</span>
          <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{skill.label}</span>
        </div>
        {hasScore ? (
          <span style={{ color: barColor, fontSize: 16, fontWeight: 700 }}>{score}%</span>
        ) : (
          <span style={{ color: C.textMuted, fontSize: 11, fontStyle: "italic" }}>—</span>
        )}
      </div>

      {hasScore ? (
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 6 }}>
          <div
            style={{
              width: `${score}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${barColor}AA, ${barColor})`,
              borderRadius: 4,
              transition: "width 0.8s ease-out",
            }}
          />
        </div>
      ) : (
        <div style={{ height: 6, marginBottom: 6 }}>
          <p style={{ color: C.textMuted, fontSize: 11, margin: 0, lineHeight: 1.3 }}>
            {skill.insufficient_data_message || "Start practicing to unlock this skill"}
          </p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: C.textMuted, fontSize: 11 }}>
          {skill.sessions} session{skill.sessions !== 1 ? "s" : ""}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6,
          background: `${TREND_COLORS[skill.trend]}12`,
          color: TREND_COLORS[skill.trend],
        }}>
          {TREND_LABELS[skill.trend]}
        </span>
      </div>
    </div>
  );
}

function SkillMap({ skills = [], mounted = true }) {
  if (!skills || skills.length === 0) {
    return (
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "40px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎵</div>
        <p style={{ color: C.textSecondary, fontSize: 15, margin: "0 0 6px" }}>
          Your skill map will appear here
        </p>
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
          Complete practice sessions to unlock skill insights
        </p>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Music Skill Map" style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
      gap: 12,
      overflow: "hidden",
    }}>
      {skills.map((skill, i) => (
        <SkillBar key={skill.id} skill={skill} mounted={mounted} index={i} />
      ))}
    </div>
  );
}

export default memo(SkillMap);
