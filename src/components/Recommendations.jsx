import { useNavigate } from "react-router-dom";
import { onKeyDown } from "../utils/keyboard";

import C from "./ui/colors";

const TYPE_ICONS = {
  lesson: "📖",
  practice: "🎵",
  explore: "✨",
  review: "📝",
  quiz: "📝",
};

const TYPE_COLORS = {
  lesson: C.primary,
  practice: C.raga,
  explore: C.secondary,
  review: C.warning,
  quiz: C.success,
};

function RecommendationCard({ rec, index, navigate }) {
  const typeColor = TYPE_COLORS[rec.type] || C.primary;
  const typeIcon = rec.icon || TYPE_ICONS[rec.type] || "🎵";

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`${rec.title}. ${rec.reason}`}
      onClick={() => {
        if (rec.route) navigate(rec.route);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (rec.route) navigate(rec.route);
        }
      }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: rec.route ? "pointer" : "default",
        transition: "all 0.2s ease-out",
      }}
      onMouseEnter={(e) => {
        if (rec.route) {
          e.currentTarget.style.borderColor = typeColor + "30";
          e.currentTarget.style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${typeColor}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {typeIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>
          {rec.title}
        </p>
        <p style={{ color: C.textMuted, fontSize: 12, margin: 0, lineHeight: 1.3 }}>
          {rec.reason}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        {rec.estimated_duration && (
          <span style={{ color: C.textMuted, fontSize: 11 }}>{rec.estimated_duration}</span>
        )}
        {rec.route && <span style={{ color: typeColor, fontSize: 14 }}>→</span>}
      </div>
    </div>
  );
}

export default function Recommendations({ recommendations = [] }) {
  const navigate = useNavigate();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {recommendations.map((rec, i) => (
        <RecommendationCard
          key={rec.id || i}
          rec={rec}
          index={i}
          navigate={navigate}
        />
      ))}
    </div>
  );
}
