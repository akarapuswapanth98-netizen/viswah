import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../api/practiceApi";
import { onKeyDown } from "../utils/keyboard";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  floating: "#2A2344",
  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  success: "#6DBF73",
  warning: "#D4A84A",
  error: "#D46A6A",
};

const ACTIVITY_ICONS = {
  vocal_guru: "🎤",
  speech_analysis: "🗣",
  piano: "🎹",
  drums: "🥁",
  metronome: "⏱",
  sargam: "🎼",
  lesson: "📚",
  quiz: "📝",
  raga: "🎵",
};

const ACTIVITY_LABELS = {
  vocal_guru: "Vocal Guru",
  speech_analysis: "Speech Analysis",
  piano: "Piano",
  drums: "Drums",
  metronome: "Metronome",
  sargam: "Sargam",
  lesson: "Lesson",
  quiz: "Quiz",
  raga: "Raga",
};

const TREND_ICONS = {
  improving: "↑",
  stable: "→",
  declining: "↓",
  insufficient_data: "–",
};

const TREND_LABELS = {
  improving: "Improving",
  stable: "Stable",
  declining: "Needs attention",
  insufficient_data: "Building baseline",
};

const TREND_COLORS = {
  improving: C.success,
  stable: C.teal,
  declining: C.warning,
  insufficient_data: C.textMuted,
};

function SkeletonBlock({ height = 200, style = {} }) {
  return (
    <div style={{
      height, borderRadius: 14,
      background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

function ScoreTrendChart({ sessions }) {
  const scored = useMemo(() => {
    return sessions
      .filter((s) => s.score != null)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-20);
  }, [sessions]);

  if (scored.length < 2) {
    return (
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "40px 24px", textAlign: "center",
      }}>
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
          Complete at least 2 scored sessions to see your trend
        </p>
      </div>
    );
  }

  const scores = scored.map((s) => s.score);
  const minScore = Math.max(0, Math.floor(Math.min(...scores) / 10) * 10);
  const maxScore = Math.min(100, Math.ceil(Math.max(...scores) / 10) * 10);
  const range = maxScore - minScore || 1;

  const chartWidth = 600;
  const chartHeight = 200;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const points = scored.map((s, i) => {
    const x = padLeft + (i / (scored.length - 1)) * plotW;
    const y = padTop + plotH - ((s.score - minScore) / range) * plotH;
    return { x, y, score: s.score, date: s.created_at, activity: s.activity, activity_id: s.activity_id };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const yTicks = 5;
  const yTickValues = [];
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(Math.round(minScore + (range * i) / yTicks));
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: "100%", height: "auto", minWidth: 300 }}
        role="img"
        aria-label={`Score trend chart showing ${scored.length} sessions`}
      >
        {/* Y-axis grid lines and labels */}
        {yTickValues.map((val) => {
          const y = padTop + plotH - ((val - minScore) / range) * plotH;
          return (
            <g key={val}>
              <line x1={padLeft} y1={y} x2={chartWidth - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#6B6080" fontSize={10}>{val}</text>
            </g>
          );
        })}

        {/* Gradient fill under line */}
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.saffron} stopOpacity={0.15} />
            <stop offset="100%" stopColor={C.saffron} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${padTop + plotH} L ${points[0].x} ${padTop + plotH} Z`}
          fill="url(#trendFill)"
        />

        {/* Line */}
        <path d={pathD} fill="none" stroke={C.saffron} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={C.ink}
            stroke={C.saffron}
            strokeWidth={2}
          />
        ))}

        {/* X-axis: show first and last date */}
        <text x={padLeft} y={chartHeight - 5} textAnchor="start" fill="#6B6080" fontSize={9}>
          {new Date(points[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </text>
        <text x={chartWidth - padRight} y={chartHeight - 5} textAnchor="end" fill="#6B6080" fontSize={9}>
          {new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </text>
      </svg>
    </div>
  );
}

function TopicCard({ topic }) {
  const trendColor = TREND_COLORS[topic.trend] || C.textMuted;
  const trendIcon = TREND_ICONS[topic.trend] || "–";
  const trendLabel = TREND_LABELS[topic.trend] || "Building baseline";

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 18, transition: "border-color 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 2px", textTransform: "capitalize" }}>
            {topic.topic.replace(/_/g, " ")}
          </p>
          <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>
            {topic.sessions} session{topic.sessions !== 1 ? "s" : ""}
            {topic.total_minutes > 0 ? ` · ${topic.total_minutes}m` : ""}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 8,
          background: `${trendColor}12`, color: trendColor,
          fontSize: 12, fontWeight: 600,
        }}>
          <span>{trendIcon}</span>
          <span>{trendLabel}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <div>
          <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Latest</p>
          <p style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {topic.latest_score != null ? Math.round(topic.latest_score) : "–"}
          </p>
        </div>
        <div>
          <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Best</p>
          <p style={{ color: C.saffron, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {topic.best_score != null ? Math.round(topic.best_score) : "–"}
          </p>
        </div>
        <div>
          <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Average</p>
          <p style={{ color: C.textSecondary, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {topic.average_score != null ? Math.round(topic.average_score) : "–"}
          </p>
        </div>
      </div>

      {topic.improvement_points != null && topic.sessions >= 2 && (
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            color: topic.improvement_points >= 0 ? C.success : C.warning,
            fontSize: 13, fontWeight: 600,
          }}>
            {topic.improvement_points >= 0 ? "+" : ""}{topic.improvement_points} points
          </span>
          <span style={{ color: C.textMuted, fontSize: 12 }}>since baseline</span>
        </div>
      )}
    </div>
  );
}

function HistoryItem({ item, onClick }) {
  const icon = ACTIVITY_ICONS[item.activity] || "🎵";
  const label = ACTIVITY_LABELS[item.activity] || item.activity;
  const topicLabel = item.activity_id ? item.activity_id.replace(/_/g, " ") : null;
  const minutes = Math.round(item.duration_seconds / 60);
  const date = new Date(item.created_at);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();

  let dateLabel;
  if (isToday) dateLabel = "Today";
  else if (isYesterday) dateLabel = "Yesterday";
  else dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => onKeyDown(e, onClick)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 12,
        background: C.surface, border: `1px solid ${C.border}`,
        cursor: "pointer", transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.transform = "translateX(2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${C.saffron}10`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <p style={{ color: C.text, fontSize: 14, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}{topicLabel ? ` · ${topicLabel}` : ""}
          </p>
          {item.score != null && (
            <span style={{
              color: item.score >= 70 ? C.success : item.score >= 50 ? C.warning : C.textMuted,
              fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}>
              {Math.round(item.score)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
          <span style={{ color: C.textMuted, fontSize: 12 }}>{dateLabel}</span>
          {minutes > 0 && <span style={{ color: C.textMuted, fontSize: 12 }}>{minutes}m</span>}
        </div>
      </div>
    </div>
  );
}

export default function PracticeHistory() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, historyRes] = await Promise.all([
          practiceApi.getSummary(),
          practiceApi.getHistory({ limit: 100 }),
        ]);
        setSummary(summaryRes.data ?? summaryRes);
        setHistory(historyRes.data ?? historyRes ?? []);
      } catch (err) {
        setError(err.message || "Failed to load practice history");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const filteredHistory = useMemo(() => {
    if (!activityFilter) return history;
    return history.filter((h) => h.activity === activityFilter);
  }, [history, activityFilter]);

  const availableActivities = useMemo(() => {
    const acts = new Set(history.map((h) => h.activity));
    return [...acts];
  }, [history]);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>Sign in to view your practice history</p>
          <button onClick={() => navigate("/login")} style={{
            padding: "12px 32px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
            color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px", paddingBottom: 60 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 40 }}>
          <SkeletonBlock height={60} style={{ marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} height={80} />)}
          </div>
          <SkeletonBlock height={260} style={{ marginBottom: 32 }} />
          <SkeletonBlock height={180} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div role="alert" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            padding: "12px 32px", borderRadius: 10, border: "none",
            background: C.saffron, color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>Retry</button>
        </div>
      </div>
    );
  }

  const hasData = summary && summary.total_sessions > 0;
  const hasScores = history.some((h) => h.score != null);

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 30% at 50% 0%, rgba(232, 168, 56, 0.04), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
            Your <span style={{ color: C.saffron }}>Practice</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, marginTop: 6 }}>
            See what you've learned, practiced, and improved.
          </p>
        </div>

        {/* Empty state */}
        {!hasData && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "60px 32px", textAlign: "center", marginBottom: 32,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎵</div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
              Your practice journey starts here
            </h2>
            <p style={{ color: C.textSecondary, fontSize: 15, margin: "0 0 28px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              Complete practice sessions and they will appear here with your scores, trends, and progress over time.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/vocal-guru")}
                style={{
                  padding: "14px 28px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                  border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Start Practicing
              </button>
              <button
                onClick={() => navigate("/speech-analysis")}
                style={{
                  padding: "14px 28px", borderRadius: 12,
                  background: C.elevated, border: `1px solid ${C.border}`,
                  color: C.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                Speech Analysis
              </button>
            </div>
          </div>
        )}

        {/* Summary stats */}
        {hasData && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12, marginBottom: 32,
          }}>
            {[
              { label: "Sessions", value: summary.total_sessions, icon: "🎵" },
              { label: "Minutes", value: summary.total_minutes, icon: "⏱" },
              { label: "Best Score", value: summary.best_score != null ? Math.round(summary.best_score) : "–", icon: "🏆" },
              { label: "Streak", value: `${summary.current_streak}d`, icon: "🔥" },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "16px 18px",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.5s ease-out ${i * 60}ms, transform 0.5s ease-out ${i * 60}ms`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
                </div>
                <p style={{ color: C.saffron, fontSize: 24, fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Low data hint */}
        {hasData && summary.total_sessions >= 1 && summary.total_sessions <= 3 && (
          <div style={{
            background: `${C.teal}08`, border: `1px solid ${C.teal}18`,
            borderRadius: 12, padding: "14px 18px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <p style={{ color: C.textSecondary, fontSize: 13, margin: 0 }}>
              {summary.total_sessions === 1
                ? "Keep practicing to reveal your progress trend."
                : "You're building a baseline. More sessions will make your trend clearer."}
            </p>
          </div>
        )}

        {/* Score trend chart */}
        {hasData && hasScores && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: 0 }}>Score Trend</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setActivityFilter("")}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: `1px solid ${!activityFilter ? C.saffron + "40" : C.border}`,
                    background: !activityFilter ? `${C.saffron}12` : "transparent",
                    color: !activityFilter ? C.saffron : C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}
                >All</button>
                {availableActivities.map((act) => (
                  <button
                    key={act}
                    onClick={() => setActivityFilter(act)}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: `1px solid ${activityFilter === act ? C.saffron + "40" : C.border}`,
                      background: activityFilter === act ? `${C.saffron}12` : "transparent",
                      color: activityFilter === act ? C.saffron : C.textMuted, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}
                  >{ACTIVITY_LABELS[act] || act}</button>
                ))}
              </div>
            </div>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 20, overflow: "hidden",
            }}>
              <ScoreTrendChart sessions={filteredHistory} />
            </div>
          </section>
        )}

        {/* Topic progress */}
        {hasData && summary.topic_statistics && summary.topic_statistics.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Topic Progress</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {summary.topic_statistics.map((topic) => (
                <TopicCard key={topic.topic} topic={topic} />
              ))}
            </div>
          </section>
        )}

        {/* Practice history list */}
        {hasData && (
          <section>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Practice History</h2>
            {filteredHistory.length === 0 ? (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "32px 24px", textAlign: "center",
              }}>
                <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
                  {activityFilter ? `No ${ACTIVITY_LABELS[activityFilter] || activityFilter} sessions yet` : "No sessions yet"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredHistory.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onClick={() => {
                      if (item.activity === "vocal_guru") navigate("/vocal-guru");
                      else if (item.activity === "speech_analysis") navigate("/speech-analysis");
                      else if (item.activity === "piano") navigate("/piano");
                      else if (item.activity === "drums") navigate("/drums");
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}
