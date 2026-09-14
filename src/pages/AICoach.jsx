import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coachApi } from "../api/coachApi";
import { onKeyDown } from "../utils/keyboard";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import UsageLimitBanner from "../components/subscription/UsageLimitBanner";

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
  vocal_guru: "🎤", piano: "🎹", drums: "🥁",
  speech_analysis: "🗣", raga: "🎵", metronome: "⏱",
};

const COACHING_STATE_LABELS = {
  beginner: "Getting Started",
  building_consistency: "Building Consistency",
  improving: "Improving",
  needs_focus: "Needs Focus",
  strong_progress: "Strong Progress",
  returning_after_gap: "Welcome Back",
};

const SKILL_BAR_COLORS = {
  pitch: C.raga,
  melody: C.saffron,
  rhythm: C.teal,
};

function SkillBar({ name, label, score, trend }) {
  const color = SKILL_BAR_COLORS[name] || C.saffron;
  const width = Math.min(100, Math.max(0, score || 0));

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {trend && trend !== "insufficient_data" && (
            <span style={{
              color: trend === "improving" ? C.success : trend === "declining" ? C.warning : C.textMuted,
              fontSize: 11, fontWeight: 600,
            }}>
              {trend === "improving" ? "↑" : trend === "declining" ? "↓" : "→"}
            </span>
          )}
          <span style={{ color: C.textSecondary, fontSize: 12 }}>{score || 0}%</span>
        </div>
      </div>
      <div style={{
        height: 6, borderRadius: 3, background: C.elevated, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${width}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 0.6s ease-out",
        }} />
      </div>
    </div>
  );
}

function TodayPlan({ plan, navigate, buttonClick }) {
  if (!plan || !plan.steps || plan.steps.length === 0) return null;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>Today's Practice Plan</h3>
          <p style={{ color: C.textMuted, fontSize: 12, margin: "4px 0 0" }}>{plan.duration_minutes || 10} minutes</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plan.steps.map((step, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => { buttonClick(); navigate(step.route); }}
            onKeyDown={(e) => onKeyDown(e, () => navigate(step.route))}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 12,
              background: C.elevated, cursor: "pointer",
              transition: "all 0.2s",
              border: `1px solid transparent`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.saffron + "40"; e.currentTarget.style.transform = "translateX(2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateX(0)"; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${C.saffron}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: C.saffron, flexShrink: 0,
            }}>
              {step.step}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{step.icon || "🎵"}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{step.activity}</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: 11, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {step.description}
              </p>
            </div>
            <span style={{ color: C.textMuted, fontSize: 11, flexShrink: 0 }}>{step.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation, navigate, buttonClick }) {
  if (!recommendation) return null;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.saffron}08, ${C.raga}05)`,
      border: `1px solid ${C.saffron}20`,
      borderRadius: 16, padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{recommendation.icon || "✨"}</span>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>Recommended Next</h3>
      </div>
      <h4 style={{ color: C.saffron, fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{recommendation.title}</h4>
      <p style={{ color: C.textSecondary, fontSize: 13, margin: "0 0 6px", lineHeight: 1.5 }}>{recommendation.description}</p>
      <p style={{ color: C.textMuted, fontSize: 12, margin: "0 0 16px", fontStyle: "italic" }}>{recommendation.reason}</p>
      <button
        onClick={() => { buttonClick(); navigate(recommendation.route); }}
        style={{
          background: C.saffron, color: C.ink, border: "none", borderRadius: 10,
          padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${C.saffron}30`; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        Practice Now →
      </button>
    </div>
  );
}

function CoachInsight({ observation }) {
  if (!observation) return null;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: 24, marginBottom: 24,
    }}>
      <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>What I'm Seeing</h3>
      <p style={{ color: C.textSecondary, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{observation}</p>
    </div>
  );
}

function CoachChat({ onSend, loading }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  const handleSubmit = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      const result = await coachApi.sendMessage(msg);
      const data = result.data || result;
      setMessages((prev) => [...prev, { role: "coach", content: data.response, type: data.type }]);
    } catch {
      setMessages((prev) => [...prev, { role: "coach", content: "I couldn't process that request. Please try again.", type: "error" }]);
    }
  }, [input, loading]);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, overflow: "hidden", marginBottom: 24,
    }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: 0 }}>Ask Your Coach</h3>
        <p style={{ color: C.textMuted, fontSize: 12, margin: "4px 0 0" }}>Questions grounded in your practice data</p>
      </div>

      {messages.length > 0 && (
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "12px 20px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: 10, display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                background: msg.role === "user" ? `${C.saffron}15` : C.elevated,
                border: `1px solid ${msg.role === "user" ? C.saffron + "30" : C.border}`,
              }}>
                <p style={{
                  color: msg.role === "user" ? C.saffron : C.textSecondary,
                  fontSize: 13, lineHeight: 1.5, margin: 0,
                }}>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: "12px 20px" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="What should I practice today?"
          style={{
            flex: 1, background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13,
            outline: "none", transition: "border-color 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = C.saffron + "40"; }}
          onBlur={(e) => { e.target.style.borderColor = C.border; }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() ? C.saffron : C.elevated,
            color: input.trim() ? C.ink : C.textMuted,
            border: "none", borderRadius: 10,
            padding: "10px 16px", fontSize: 13, fontWeight: 600,
            cursor: input.trim() ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

function SkeletonBlock({ height = 200, style = {} }) {
  return (
    <div style={{
      height, borderRadius: 14,
      background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

export default function AICoach() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { buttonClick } = useAudioFeedback();

  const [summary, setSummary] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, recRes] = await Promise.all([
        coachApi.getSummary(),
        coachApi.getRecommendation(),
      ]);
      const summaryData = summaryRes.data ?? summaryRes;
      const recData = recRes.data ?? recRes;
      setSummary(summaryData);
      setRecommendation(recData);
    } catch (err) {
      setError(err.message || "Failed to load coaching data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, marginBottom: 12 }}>AI Music Coach</h1>
          <p style={{ color: C.textSecondary, fontSize: 15 }}>Sign in to access your personalized coach</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
          <SkeletonBlock height={80} style={{ marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
            <SkeletonBlock height={200} />
            <SkeletonBlock height={200} />
          </div>
          <SkeletonBlock height={250} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div role="alert" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.error, fontSize: 15, marginBottom: 16 }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              background: C.saffron, color: C.ink, border: "none", borderRadius: 10,
              padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const skillHealth = summary?.skill_health || {};
  const todayPlan = summary?.today_plan || {};
  const coachingState = summary?.coaching_state || "beginner";

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(80% 40% at 50% -10%, ${C.saffron}08, transparent 70%), radial-gradient(50% 30% at 80% 20%, ${C.raga}05, transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Usage Limit Banner */}
        <UsageLimitBanner usageType="ai_coach_daily" />

        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
                AI Music <span style={{ color: C.saffron }}>Coach</span>
              </h1>
              <p style={{ color: C.textMuted, fontSize: 15, margin: "6px 0 0" }}>
                {summary?.greeting || "Personalized guidance for your musical growth."}
              </p>
            </div>
            <div style={{
              background: `${C.saffron}12`, border: `1px solid ${C.saffron}25`,
              borderRadius: 10, padding: "6px 14px",
            }}>
              <span style={{ color: C.saffron, fontSize: 12, fontWeight: 600 }}>
                {COACHING_STATE_LABELS[coachingState] || coachingState}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Skill Health */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 24,
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease-out 100ms, transform 0.5s ease-out 100ms",
          }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Skill Health</h3>
            {Object.entries(skillHealth).length > 0 ? (
              Object.entries(skillHealth).map(([name, data]) => (
                <SkillBar key={name} name={name} label={data.label} score={data.score} trend={data.trend} />
              ))
            ) : (
              <p style={{ color: C.textMuted, fontSize: 13 }}>Practice across different activities to build your skill profile.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 24,
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease-out 150ms, transform 0.5s ease-out 150ms",
          }}>
            <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Your Progress</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 14 }}>
                <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sessions</span>
                <p style={{ color: C.saffron, fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{summary?.total_sessions || 0}</p>
              </div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 14 }}>
                <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Streak</span>
                <p style={{ color: C.teal, fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{summary?.current_streak || 0}d</p>
              </div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 14 }}>
                <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Average</span>
                <p style={{ color: C.raga, fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{summary?.average_score ? `${summary.average_score}%` : "—"}</p>
              </div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 14 }}>
                <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent</span>
                <p style={{ color: C.success, fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{summary?.recent_score ? `${summary.recent_score}%` : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Plan */}
        <div style={{
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out 200ms, transform 0.5s ease-out 200ms",
        }}>
          <TodayPlan plan={todayPlan} navigate={navigate} buttonClick={buttonClick} />
        </div>

        {/* Recommendation + Insight */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease-out 250ms, transform 0.5s ease-out 250ms",
          }}>
            <RecommendationCard recommendation={recommendation} navigate={navigate} buttonClick={buttonClick} />
          </div>
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease-out 300ms, transform 0.5s ease-out 300ms",
          }}>
            <CoachInsight observation={summary?.observation} />
          </div>
        </div>

        {/* Coach Chat */}
        <div style={{
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out 350ms, transform 0.5s ease-out 350ms",
        }}>
          <CoachChat loading={chatLoading} />
        </div>
      </div>
    </div>
  );
}
