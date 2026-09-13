import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../api/practiceApi";
import { personalizationApi } from "../api/personalizationApi";
import { onKeyDown } from "../utils/keyboard";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import {
  generateRecommendations,
  formatActivity,
  formatScore,
  formatDate,
  getGradeColor,
} from "../utils/practiceRecommendations";

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

const ACTIVITIES = [
  { id: "vocal_guru", label: "Vocal Guru", icon: "🎤", purpose: "Train pitch, control and technique", difficulty: "All levels", route: "/vocal-guru" },
  { id: "piano", label: "Piano", icon: "🎹", purpose: "Build note accuracy and timing", difficulty: "Beginner – Advanced", route: "/piano" },
  { id: "drums", label: "Drums", icon: "🥁", purpose: "Develop rhythm, coordination and timing", difficulty: "Beginner – Advanced", route: "/drums" },
  { id: "speech_analysis", label: "Speech Analysis", icon: "🗣", purpose: "Measure pitch, stability and vocal characteristics", difficulty: "All levels", route: "/speech-analysis" },
  { id: "raga", label: "Raga Learning", icon: "🎵", purpose: "Understand and practice Indian melodic frameworks", difficulty: "All levels", route: "/ragas" },
  { id: "metronome", label: "Metronome", icon: "⏱", purpose: "Keep precise time with Indian Tala support", difficulty: "All levels", route: "/metronome" },
];

const FILTER_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "voice", label: "Voice", activities: ["vocal_guru", "speech_analysis"] },
  { key: "melody", label: "Melody", activities: ["raga", "piano"] },
  { key: "rhythm", label: "Rhythm", activities: ["drums", "metronome"] },
];

function SkeletonBlock({ height = 200, style = {} }) {
  return (
    <div style={{
      height, borderRadius: 14,
      background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

function ActivityCard({ activity, stats, navigate, buttonClick }) {
  const sessions = stats?.[activity.id] || 0;
  const recentSessions = stats?._recent?.filter((s) => s.activity === activity.id) || [];
  const lastSession = recentSessions[0];
  const lastScore = lastSession?.score;

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => { buttonClick(); navigate(activity.route); }}
      onKeyDown={(e) => onKeyDown(e, () => navigate(activity.route))}
      data-testid={`activity-card-${activity.id}`}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 20, cursor: "pointer",
        transition: "all 0.25s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.saffron + "40";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${C.saffron}12`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {activity.icon}
        </div>
        {lastScore != null && (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
            background: `${getGradeColor(lastScore)}15`, color: getGradeColor(lastScore),
          }}>
            {Math.round(lastScore)}%
          </span>
        )}
      </div>
      <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{activity.label}</h3>
      <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 10px", lineHeight: 1.4 }}>{activity.purpose}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: C.textMuted, fontSize: 12 }}>{sessions} session{sessions !== 1 ? "s" : ""}</span>
        <span style={{ color: C.saffron, fontSize: 13, fontWeight: 600 }}>Open →</span>
      </div>
    </div>
  );
}

function SkillProgress({ activityStats, recentSessions }) {
  const activities = Object.keys(activityStats || {}).filter((a) => a !== "_recent");
  if (activities.length === 0) return null;

  return (
    <section style={{ marginBottom: 40 }} data-testid="skill-progress">
      <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Skill Progress</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {activities.map((act) => {
          const sessions = recentSessions.filter((s) => s.activity === act);
          const scored = sessions.filter((s) => s.score != null);
          const avgScore = scored.length > 0
            ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
            : null;
          const bestScore = scored.length > 0
            ? Math.round(Math.max(...scored.map((s) => s.score)))
            : null;
          const lastPracticed = sessions[0]?.created_at;

          const trend = scored.length >= 2
            ? (scored[0].score > scored[scored.length - 1].score ? "improving" : scored[0].score < scored[scored.length - 1].score ? "needs_work" : "stable")
            : null;

          return (
            <div key={act} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{formatActivity(act)}</span>
                {trend && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                    background: trend === "improving" ? `${C.success}15` : trend === "needs_work" ? `${C.warning}15` : `${C.teal}15`,
                    color: trend === "improving" ? C.success : trend === "needs_work" ? C.warning : C.teal,
                  }}>
                    {trend === "improving" ? "↑ Improving" : trend === "needs_work" ? "↓ Needs work" : "→ Stable"}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Avg</p>
                  <p style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{avgScore != null ? `${avgScore}%` : "–"}</p>
                </div>
                <div>
                  <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Best</p>
                  <p style={{ color: C.saffron, fontSize: 18, fontWeight: 700, margin: 0 }}>{bestScore != null ? `${bestScore}%` : "–"}</p>
                </div>
                <div>
                  <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 2px" }}>Sessions</p>
                  <p style={{ color: C.teal, fontSize: 18, fontWeight: 700, margin: 0 }}>{activityStats[act]}</p>
                </div>
              </div>
              {lastPracticed && (
                <p style={{ color: C.textMuted, fontSize: 11, margin: "8px 0 0" }}>Last: {formatDate(lastPracticed)}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentPractice({ sessions, navigate }) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <section style={{ marginBottom: 40 }} data-testid="recent-practice">
      <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Recent Practice</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sessions.slice(0, 5).map((s) => {
          const ACTIVITY_ICONS = { vocal_guru: "🎤", speech_analysis: "🗣", piano: "🎹", drums: "🥁", metronome: "⏱", sargam: "🎼", raga: "🎵" };
          const routeMap = { vocal_guru: "/vocal-guru", speech_analysis: "/speech-analysis", piano: "/piano", drums: "/drums", metronome: "/metronome", sargam: "/sargam", raga: "/ragas" };
          return (
            <div
              key={s.id}
              tabIndex={0}
              role="button"
              onClick={() => navigate(routeMap[s.activity] || "/practice")}
              onKeyDown={(e) => onKeyDown(e, () => navigate(routeMap[s.activity] || "/practice"))}
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
                {ACTIVITY_ICONS[s.activity] || "🎵"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <p style={{ color: C.text, fontSize: 14, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formatActivity(s.activity)}{s.activity_id ? ` · ${s.activity_id.replace(/_/g, " ")}` : ""}
                  </p>
                  {s.score != null && (
                    <span style={{
                      color: s.score >= 70 ? C.success : s.score >= 50 ? C.warning : C.textMuted,
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                    }}>
                      {Math.round(s.score)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>{formatDate(s.created_at)}</span>
                  {s.duration_seconds > 0 && <span style={{ color: C.textMuted, fontSize: 12 }}>{Math.round(s.duration_seconds / 60)}m</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function PracticeStudio() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { buttonClick } = useAudioFeedback();

  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [personalization, setPersonalization] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, statsRes] = await Promise.all([
          practiceApi.getSummary(),
          practiceApi.getStats(),
        ]);
        setSummary(summaryRes.data ?? summaryRes);
        setStats(statsRes.data ?? statsRes);
      } catch (err) {
        setError(err.message || "Failed to load practice data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchPersonalization = async () => {
      try {
        const res = await personalizationApi.getSummary();
        setPersonalization(res.data ?? res);
      } catch {
        // Personalization not available
      }
    };
    fetchPersonalization();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>Sign in to access Practice Studio</p>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} height={80} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {[...Array(6)].map((_, i) => <SkeletonBlock key={i} height={180} />)}
          </div>
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
  const recentSessions = summary?.recent_sessions || [];
  const activityStats = stats?.activities_breakdown || {};
  const recs = generateRecommendations({ recentSessions, activityStats, summary });
  const continueSession = recentSessions[0];

  const filteredActivities = filter === "all"
    ? ACTIVITIES
    : ACTIVITIES.filter((a) => FILTER_CATEGORIES.find((c) => c.key === filter)?.activities?.includes(a.id));

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(232, 168, 56, 0.05), transparent 70%), radial-gradient(ellipse 50% 30% at 80% 20%, rgba(199, 125, 186, 0.03), transparent 70%), radial-gradient(ellipse 40% 30% at 15% 80%, rgba(91, 168, 160, 0.02), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
            Practice <span style={{ color: C.saffron }}>Studio</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, marginTop: 6 }}>
            Build your musical skills one session at a time.
          </p>
        </div>

        {/* Practice Summary */}
        {hasData && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}>
            {[
              { label: "Today", value: `${stats.today_minutes}m`, icon: "⏱", color: C.teal },
              { label: "Sessions", value: summary.total_sessions, icon: "🎵", color: C.saffron },
              { label: "Streak", value: `${summary.current_streak}d`, icon: "🔥", color: C.warning },
              { label: "Best Score", value: summary.best_score != null ? `${Math.round(summary.best_score)}%` : "–", icon: "🏆", color: C.success },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "16px 18px",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.5s ease-out ${i * 80}ms, transform 0.5s ease-out ${i * 80}ms`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
                </div>
                <p style={{ color: s.color, fontSize: 24, fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Personalized Daily Mission */}
        {personalization?.daily_mission && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                background: `linear-gradient(135deg, ${C.saffron}12, ${C.raga}12)`,
                border: `1px solid ${C.saffron}25`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${C.saffron}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}>
                {personalization.daily_mission.icon || "🎯"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.textMuted, fontSize: 12, fontWeight: 500, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 1 }}>
                  Today's Mission
                </p>
                <p style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: 0 }}>
                  {personalization.daily_mission.title}
                </p>
                <p style={{ color: C.textSecondary, fontSize: 13, margin: "4px 0 0" }}>
                  {personalization.daily_mission.description}
                </p>
              </div>
              {personalization.daily_mission.route && (
                <button
                  onClick={() => navigate(personalization.daily_mission.route)}
                  style={{
                    padding: "8px 18px", borderRadius: 10, border: "none",
                    background: C.saffron, color: C.ink,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Start
                </button>
              )}
            </div>
          </section>
        )}

        {/* Personalized Recommendations */}
        {personalization?.recommendations && personalization.recommendations.length > 0 && (
          <section style={{ marginBottom: 32 }} data-testid="personalized-recommendations">
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>
              Personalized for you
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {personalization.recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={rec.id || i}
                  tabIndex={0}
                  role="button"
                  onClick={() => { if (rec.route) navigate(rec.route); }}
                  onKeyDown={(e) => onKeyDown(e, () => { if (rec.route) navigate(rec.route); })}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: rec.route ? "pointer" : "default",
                    transition: "all 0.2s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    if (rec.route) { e.currentTarget.style.borderColor = C.teal + "30"; e.currentTarget.style.transform = "translateX(4px)"; }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${C.teal}12`, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {rec.icon || "🎵"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{rec.title}</p>
                    <p style={{ color: C.textMuted, fontSize: 12, margin: "2px 0 0" }}>{rec.description || rec.reason}</p>
                  </div>
                  {rec.route && <span style={{ color: C.textMuted, fontSize: 16 }}>→</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Continue Practicing */}
        {continueSession && (
          <section style={{ marginBottom: 32 }} data-testid="continue-practice">
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Continue Practicing</h2>
            <div
              tabIndex={0}
              role="button"
              onClick={() => {
                buttonClick();
                const routeMap = { vocal_guru: "/vocal-guru", speech_analysis: "/speech-analysis", piano: "/piano", drums: "/drums", metronome: "/metronome", sargam: "/sargam", raga: "/ragas" };
                navigate(routeMap[continueSession.activity] || "/practice");
              }}
              onKeyDown={(e) => onKeyDown(e, () => {})}
              style={{
                background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
                border: `1px solid ${C.saffron}25`,
                borderRadius: 16, padding: 20, cursor: "pointer",
                transition: "all 0.25s ease-out",
                display: "flex", alignItems: "center", gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.saffron + "50";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(232, 168, 56, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.saffron + "25";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${C.saffron}15`, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}>
                {ACTIVITIES.find((a) => a.id === continueSession.activity)?.icon || "🎵"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>
                  {formatActivity(continueSession.activity)}{continueSession.activity_id ? ` — ${continueSession.activity_id.replace(/_/g, " ")}` : ""}
                </p>
                <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
                  {continueSession.score != null ? `Last score: ${Math.round(continueSession.score)}%` : "Continue where you left off"}
                  {continueSession.created_at ? ` · ${formatDate(continueSession.created_at)}` : ""}
                </p>
              </div>
              <span style={{ color: C.saffron, fontSize: 14, fontWeight: 600 }}>Resume →</span>
            </div>
          </section>
        )}

        {/* Empty state for new users */}
        {!hasData && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "48px 32px", textAlign: "center", marginBottom: 32,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎵</div>
            <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
              Your practice journey starts here
            </h2>
            <p style={{ color: C.textSecondary, fontSize: 15, margin: "0 0 28px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              Choose an activity below to begin your first practice session. Your progress will appear here.
            </p>
          </div>
        )}

        {/* Recommendations */}
        {recs.length > 0 && hasData && (
          <section style={{ marginBottom: 32 }} data-testid="recommendations">
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Recommended</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((rec, i) => (
                <div
                  key={i}
                  tabIndex={0}
                  role="button"
                  onClick={() => { buttonClick(); if (rec.path) navigate(rec.path); }}
                  onKeyDown={(e) => onKeyDown(e, () => { if (rec.path) navigate(rec.path); })}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: rec.path ? "pointer" : "default",
                    transition: "all 0.2s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    if (rec.path) { e.currentTarget.style.borderColor = C.saffron + "30"; e.currentTarget.style.transform = "translateX(4px)"; }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${C.saffron}12`, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    {rec.type === "repeat_exercise" ? "🔄" : rec.type === "try_activity" ? "✨" : rec.type === "maintain_streak" ? "🔥" : rec.type === "great_work" ? "⭐" : "🎵"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{rec.title}</p>
                    <p style={{ color: C.textMuted, fontSize: 12, margin: "2px 0 0" }}>{rec.reason}</p>
                  </div>
                  {rec.path && <span style={{ color: C.textMuted, fontSize: 16 }}>→</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Choose Your Skill */}
        <section style={{ marginBottom: 40 }} data-testid="activity-cards">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: 0 }}>Choose Your Skill</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setFilter(cat.key)}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: `1px solid ${filter === cat.key ? C.saffron + "40" : C.border}`,
                    background: filter === cat.key ? `${C.saffron}12` : "transparent",
                    color: filter === cat.key ? C.saffron : C.textMuted,
                    fontSize: 12, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                stats={{ ...activityStats, _recent: recentSessions }}
                navigate={navigate}
                buttonClick={buttonClick}
              />
            ))}
          </div>
        </section>

        {/* Skill Progress */}
        {hasData && <SkillProgress activityStats={activityStats} recentSessions={recentSessions} />}

        {/* Recent Practice */}
        {hasData && <RecentPractice sessions={recentSessions} navigate={navigate} />}

        {/* View Full History */}
        {hasData && (
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => { buttonClick(); navigate("/practice-history"); }}
              style={{
                width: "100%", padding: "16px 20px", borderRadius: 14,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.saffron + "30"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                View Full Practice History
              </span>
              <span style={{ color: C.textMuted }}>→</span>
            </button>

            {/* AI Coach CTA */}
            <button
              onClick={() => { buttonClick(); navigate("/ai-coach"); }}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                background: C.surface, border: `1px solid ${C.teal}25`,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal + "50"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.teal + "25"; }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🎯</span>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>AI Coach Recommendation</span>
              </span>
              <span style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>Open →</span>
            </button>

            {/* World Music CTA */}
            <button
              onClick={() => { buttonClick(); navigate("/world-music"); }}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                background: C.surface, border: `1px solid ${C.teal}25`,
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal + "50"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.teal + "25"; }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🌍</span>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>Explore World Music</span>
              </span>
              <span style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>Explore →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
