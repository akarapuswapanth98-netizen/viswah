import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { courseApi } from "../api/courseApi";
import { dashboardApi } from "../api/practiceApi";
import { personalizationApi } from "../api/personalizationApi";
import { onKeyDown } from "../utils/keyboard";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import SkillMap from "../components/SkillMap";
import DailyMission from "../components/DailyMission";
import Recommendations from "../components/Recommendations";

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
  textMuted: "#8075A0",
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
  vocal_guru: "Vocal Practice",
  speech_analysis: "Speech Analysis",
  piano: "Piano Practice",
  drums: "Drum Practice",
  metronome: "Rhythm Practice",
  sargam: "Sargam Practice",
  lesson: "Lesson Study",
  quiz: "Quiz",
  raga: "Raga Study",
};

const ACHIEVEMENT_DEFS = {
  first_practice: { icon: "🎵", label: "First Practice", desc: "Completed your first practice session" },
  first_lesson: { icon: "📖", label: "First Lesson", desc: "Completed your first lesson" },
  first_quiz: { icon: "📝", label: "Quiz Starter", desc: "Completed your first quiz" },
  first_enrollment: { icon: "🎓", label: "Enrolled", desc: "Enrolled in your first course" },
  practice_regular: { icon: "🔥", label: "Regular Practitioner", desc: "Completed 10 practice sessions" },
  vocal_enthusiast: { icon: "🎤", label: "Vocal Enthusiast", desc: "Completed 5 vocal sessions" },
  voice_tracker: { icon: "📊", label: "Voice Tracker", desc: "Completed 3 speech analysis sessions" },
  first_piano: { icon: "🎹", label: "Piano Starter", desc: "Completed your first piano practice" },
  piano_enthusiast: { icon: "🎹", label: "Piano Enthusiast", desc: "Completed 10 piano sessions" },
  first_drum: { icon: "🥁", label: "Drum Starter", desc: "Completed your first drum practice" },
  drum_enthusiast: { icon: "🥁", label: "Drum Enthusiast", desc: "Completed 10 drum sessions" },
};

const COACHING_STATE_LABELS = {
  beginner: "Getting Started",
  building_consistency: "Building Consistency",
  improving: "Making Progress",
  needs_focus: "Needs Focus",
  strong_progress: "Strong Progress",
  returning_after_gap: "Welcome Back",
};

const COACHING_STATE_COLORS = {
  beginner: C.textMuted,
  building_consistency: C.saffron,
  improving: C.teal,
  needs_focus: C.warning,
  strong_progress: C.success,
  returning_after_gap: C.raga,
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function SkeletonCard({ height = 200, style = {} }) {
  return (
    <div style={{
      height, borderRadius: 14,
      background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style,
    }} />
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuest } = useAuth();
  const { buttonClick } = useAudioFeedback();

  const [dashboard, setDashboard] = useState(null);
  const [personalization, setPersonalization] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ difficulty: "", instrument: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesRes = await courseApi.getCourses();
      setCourses(coursesRes.data ?? coursesRes ?? []);

      if (isAuthenticated) {
        try {
          const [dashRes, persRes] = await Promise.all([
            dashboardApi.getDashboard(),
            personalizationApi.getSummary(),
          ]);
          setDashboard(dashRes.data ?? dashRes);
          setPersonalization(persRes.data ?? persRes);
        } catch {
          try {
            const dashRes = await dashboardApi.getDashboard();
            setDashboard(dashRes.data ?? dashRes);
          } catch {
            const [enrolledRes, progressRes] = await Promise.all([
              courseApi.getEnrolled(),
              import("../api/progressApi").then((m) => m.progressApi.getProgress()),
            ]);
            setDashboard({
              enrolled_courses: enrolledRes.data ?? enrolledRes ?? [],
              progress: progressRes.data ?? progressRes ?? [],
              practice_stats: { total_sessions: 0, total_minutes: 0, streak_days: 0, today_minutes: 0 },
              achievements: [],
              recommendations: [],
              recent_activity: [],
            });
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData();
    return () => controller.abort();
  }, [isAuthenticated]);

  const username = isAuthenticated ? (user?.name ?? user?.username ?? "User") : "Guest";
  const stats = dashboard?.practice_stats;
  const enrolled = dashboard?.enrolled_courses ?? [];
  const achievements = dashboard?.achievements ?? [];
  const recent = dashboard?.recent_activity ?? [];

  const pStats = personalization?.streak_data;
  const coachingState = personalization?.coaching_state;
  const skillMap = personalization?.skill_map;
  const dailyMission = personalization?.daily_mission;
  const recommendations = personalization?.recommendations;
  const strongestSkill = personalization?.strongest_skill;
  const weakestSkill = personalization?.weakest_skill;

  const instruments = [...new Set(courses.map((c) => c.instrument).filter(Boolean))];
  const difficulties = [...new Set(courses.map((c) => c.difficulty).filter(Boolean))];
  const filteredCourses = courses.filter((c) => {
    if (filter.difficulty && c.difficulty !== filter.difficulty) return false;
    if (filter.instrument && c.instrument !== filter.instrument) return false;
    return true;
  }).slice(0, 8);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px", paddingBottom: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 40 }}>
          <SkeletonCard height={60} style={{ marginBottom: 24 }} />
          <SkeletonCard height={120} style={{ marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={80} />)}
          </div>
          <SkeletonCard height={180} style={{ marginBottom: 32 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div role="alert" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ color: C.textMuted, marginBottom: 24, fontSize: 14 }}>{error}</p>
          <button onClick={fetchData} style={{
            padding: "12px 32px", borderRadius: 10, border: "none",
            background: C.saffron, color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(232, 168, 56, 0.05), transparent 70%), radial-gradient(ellipse 40% 30% at 85% 20%, rgba(199, 125, 186, 0.03), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>

        {/* Greeting + Learner State */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 32, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {getGreeting()}, <span style={{ color: C.saffron }}>{username}</span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
              {isAuthenticated ? "Your music command center" : "Sign in to track your progress"}
            </p>
            {coachingState && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                background: `${COACHING_STATE_COLORS[coachingState]}15`,
                color: COACHING_STATE_COLORS[coachingState],
              }}>
                {COACHING_STATE_LABELS[coachingState]}
              </span>
            )}
          </div>
        </div>

        {/* Daily Mission — Priority 1 */}
        {isAuthenticated && dailyMission && (
          <section style={{ marginBottom: 32 }} data-testid="daily-mission">
            <DailyMission mission={dailyMission} mounted={mounted} />
          </section>
        )}

        {/* Stats Row */}
        {isAuthenticated && (stats || pStats) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}>
            {[
              { label: "Practice Streak", value: `${(pStats || stats).current_streak ?? (pStats || stats).streak_days ?? 0}d`, sub: "days", icon: "🔥", color: C.saffron },
              { label: "Today", value: `${(pStats || stats).today_minutes ?? 0}m`, sub: "minutes", icon: "⏱", color: C.teal },
              { label: "Total Practice", value: `${(pStats || stats).total_minutes ?? stats?.total_minutes ?? 0}m`, sub: `${(pStats || stats).total_sessions ?? stats?.total_sessions ?? 0} sessions`, icon: "🎵", color: C.raga },
              { label: "Courses", value: enrolled.length, sub: "enrolled", icon: "📚", color: C.saffron },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "16px 18px",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(12px)",
                transition: `opacity 0.5s ease-out ${i * 80}ms, transform 0.5s ease-out ${i * 80}ms`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
                </div>
                <div style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations — Priority 2 */}
        {isAuthenticated && recommendations && recommendations.length > 0 && (
          <section style={{ marginBottom: 40 }} data-testid="recommendations">
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>
              Recommended for you
            </h2>
            <Recommendations recommendations={recommendations} />
          </section>
        )}

        {/* Skill Map — Priority 3 */}
        {isAuthenticated && skillMap && skillMap.length > 0 && (
          <section style={{ marginBottom: 40 }} data-testid="skill-map">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: 0 }}>Music Skill Map</h2>
              <button
                onClick={() => navigate("/ai-coach")}
                style={{
                  background: "transparent", border: `1px solid ${C.teal}30`, borderRadius: 8,
                  color: C.teal, fontSize: 12, fontWeight: 600, padding: "6px 12px", cursor: "pointer",
                }}
              >
                View Details →
              </button>
            </div>
            <SkillMap skills={skillMap} mounted={mounted} />
          </section>
        )}

        {/* Continue Learning — enrolled courses with progress */}
        {isAuthenticated && enrolled.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Continue Learning</h2>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
              {enrolled.map((course) => (
                <div
                  key={course.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => { buttonClick(); navigate(`/courses/${course.id}`); }}
                  onKeyDown={(e) => onKeyDown(e, () => navigate(`/courses/${course.id}`))}
                  style={{
                    minWidth: 260, background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: 18, cursor: "pointer", transition: "all 0.25s ease-out", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = C.saffron + "40";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <p style={{ color: C.text, fontWeight: 600, fontSize: 15, margin: 0 }}>{course.title}</p>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: course.progress_pct === 100 ? C.success : C.saffron,
                    }}>{course.progress_pct}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 5, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{
                      width: `${course.progress_pct}%`, height: "100%",
                      background: course.progress_pct === 100
                        ? `linear-gradient(90deg, ${C.success}AA, ${C.success})`
                        : `linear-gradient(90deg, ${C.saffronMuted}, ${C.saffron})`,
                      borderRadius: 6, transition: "width 0.6s ease",
                    }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{course.completed_lessons}/{course.total_lessons} lessons</span>
                    {course.instrument && <span style={{ fontSize: 11, color: C.saffron }}>{course.instrument}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {isAuthenticated && achievements.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Achievements</h2>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
              {achievements.map((a, i) => {
                const def = ACHIEVEMENT_DEFS[a.type] || { icon: "🏅", label: a.type, desc: "" };
                return (
                  <div key={i} style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: "14px 16px", minWidth: 160, flexShrink: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 28 }}>{def.icon}</span>
                    <span style={{ color: C.text, fontSize: 13, fontWeight: 600, textAlign: "center" }}>{def.label}</span>
                    <span style={{ color: C.textMuted, fontSize: 11, textAlign: "center", lineHeight: 1.3 }}>{def.desc}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {isAuthenticated && recent.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Recent Activity</h2>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              {recent.slice(0, 5).map((item, i) => (
                <div key={i} style={{
                  padding: "12px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                  borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  <span style={{ fontSize: 16 }}>
                    {item.type === "lesson" ? "📖" : ACTIVITY_ICONS[item.activity] || "🎵"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: C.text, fontSize: 13, fontWeight: 500, margin: 0 }}>
                      {item.type === "lesson" ? item.title : ACTIVITY_LABELS[item.activity] || item.activity}
                    </p>
                    <p style={{ color: C.textMuted, fontSize: 11, margin: "2px 0 0" }}>
                      {item.date ? new Date(item.date).toLocaleDateString() : ""}
                      {item.duration_seconds ? ` · ${Math.round(item.duration_seconds / 60)}m` : ""}
                    </p>
                  </div>
                  {item.completed && <span style={{ color: C.success, fontSize: 12 }}>✓</span>}
                  {item.score != null && item.score > 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: item.score >= 70 ? C.success : C.warning,
                    }}>{Math.round(item.score)}%</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Practice History link */}
        {isAuthenticated && (
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => navigate("/practice-history")}
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
                View Practice History
              </span>
              <span style={{ color: C.textMuted }}>→</span>
            </button>
          </div>
        )}

        {/* Guest prompt */}
        {!isAuthenticated && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 32,
          }}>
            <p style={{ color: C.textSecondary, fontSize: 15, marginBottom: 16 }}>
              Sign in to see your enrolled courses, practice stats, and recommendations
            </p>
            <button onClick={() => navigate("/login")} style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
              color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
            }}>Sign In</button>
          </div>
        )}

        {/* Practice Studio */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Practice Studio</h2>
          <div
            tabIndex={0}
            role="button"
            onClick={() => { buttonClick(); navigate("/practice"); }}
            onKeyDown={(e) => onKeyDown(e, () => navigate("/practice"))}
            style={{
              background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
              border: `1px solid ${C.saffron}25`,
              borderRadius: 16, padding: 24, cursor: "pointer",
              transition: "all 0.25s ease-out",
              display: "flex", alignItems: "center", gap: 16, marginBottom: 14,
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
            }}>🎵</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 2px" }}>Open Practice Studio</p>
              <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Choose skills, track progress, and practice smarter</p>
            </div>
            <span style={{ color: C.saffron, fontSize: 14, fontWeight: 600 }}>Open →</span>
          </div>

          {/* AI Coach CTA */}
          <div
            tabIndex={0}
            role="button"
            onClick={() => { buttonClick(); navigate("/ai-coach"); }}
            onKeyDown={(e) => onKeyDown(e, () => navigate("/ai-coach"))}
            style={{
              background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
              border: `1px solid ${C.teal}25`,
              borderRadius: 16, padding: 20, cursor: "pointer",
              transition: "all 0.25s ease-out",
              display: "flex", alignItems: "center", gap: 14, marginBottom: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.teal + "50";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(91, 168, 160, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.teal + "25";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${C.teal}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>🎯</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>AI Music Coach</p>
              <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Personalized guidance based on your practice</p>
            </div>
            <span style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>Open →</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {[
              { label: "Vocal Guru", path: "/vocal-guru", icon: "🎤", desc: "AI coaching" },
              { label: "Speech Analysis", path: "/speech-analysis", icon: "🗣", desc: "Analyze voice" },
              { label: "Piano", path: "/piano", icon: "🎹", desc: "Play & learn" },
              { label: "Drums", path: "/drums", icon: "🥁", desc: "Rhythm studio" },
              { label: "Metronome", path: "/metronome", icon: "⏱", desc: "Keep time" },
              { label: "Sargam", path: "/sargam", icon: "🎼", desc: "Note practice" },
            ].map((item, i) => (
              <div
                key={item.label}
                tabIndex={0}
                role="button"
                onClick={() => { buttonClick(); navigate(item.path); }}
                onKeyDown={(e) => onKeyDown(e, () => navigate(item.path))}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "16px 14px", textAlign: "center",
                  cursor: "pointer", transition: "all 0.25s ease-out",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transitionDelay: `${i * 40}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = C.saffron + "35";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                <p style={{ color: C.text, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>{item.label}</p>
                <p style={{ color: C.textMuted, fontSize: 11, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Indian Classical */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Indian Classical</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Ragas", path: "/ragas", icon: "🎵" },
              { label: "Talas", path: "/talas", icon: "🪘" },
              { label: "AI Lessons", path: "/ai-lessons", icon: "🤖" },
            ].map((item) => (
              <div
                key={item.label}
                tabIndex={0}
                role="button"
                onClick={() => { buttonClick(); navigate(item.path); }}
                onKeyDown={(e) => onKeyDown(e, () => navigate(item.path))}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", transition: "all 0.2s ease-out", flex: "1 1 auto", minWidth: 130,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.saffron + "30"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* World Music */}
        <section style={{ marginBottom: 40 }}>
          <div
            tabIndex={0}
            role="button"
            onClick={() => { buttonClick(); navigate("/world-music"); }}
            onKeyDown={(e) => onKeyDown(e, () => navigate("/world-music"))}
            style={{
              background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
              border: `1px solid ${C.teal}25`,
              borderRadius: 16, padding: 20, cursor: "pointer",
              transition: "all 0.25s ease-out",
              display: "flex", alignItems: "center", gap: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.teal + "50";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(91, 168, 160, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.teal + "25";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${C.teal}15`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>🌍</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>World Music</p>
              <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Explore musical traditions from around the globe</p>
            </div>
            <span style={{ color: C.teal, fontSize: 13, fontWeight: 600 }}>Explore →</span>
          </div>
        </section>

        {/* Browse Courses */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: 0 }}>Courses</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={filter.difficulty} onChange={(e) => setFilter((f) => ({ ...f, difficulty: e.target.value }))}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "6px 10px", fontSize: 12, outline: "none" }}>
                <option value="">All Levels</option>
                {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filter.instrument} onChange={(e) => setFilter((f) => ({ ...f, instrument: e.target.value }))}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "6px 10px", fontSize: 12, outline: "none" }}>
                <option value="">All Instruments</option>
                {instruments.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <button onClick={() => navigate("/courses")} style={{
                background: C.saffron, border: "none", borderRadius: 8,
                color: C.ink, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>View All</button>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
              <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>No courses found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => { buttonClick(); navigate(`/courses/${course.id}`); }}
                  onKeyDown={(e) => onKeyDown(e, () => navigate(`/courses/${course.id}`))}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.25s ease-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = C.saffron + "30";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {course.image_url && (
                    <img src={course.image_url} alt={course.title}
                      style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{ padding: 16 }}>
                    <p style={{ color: C.text, fontWeight: 600, fontSize: 14, margin: "0 0 8px" }}>{course.title}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      {course.instrument && (
                        <span style={{ background: `${C.saffron}12`, color: C.saffron, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500 }}>{course.instrument}</span>
                      )}
                      {course.difficulty && (
                        <span style={{
                          background: course.difficulty === "beginner" ? `${C.success}15` : course.difficulty === "advanced" ? `${C.warning}15` : `${C.teal}15`,
                          color: course.difficulty === "beginner" ? C.success : course.difficulty === "advanced" ? C.warning : C.teal,
                          borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500,
                        }}>{course.difficulty}</span>
                      )}
                    </div>
                    <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>{course.lessons_count ?? 0} lessons</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
