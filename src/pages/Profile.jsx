import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { courseApi } from "../api/courseApi";
import { progressApi } from "../api/progressApi";
import { practiceApi, dashboardApi } from "../api/practiceApi";
import { personalizationApi } from "../api/personalizationApi";
import { onKeyDown } from "../utils/keyboard";
import { useToast } from "../context/ToastContext";

const COLORS = {
  primary: "#6C63FF",
  secondary: "#4ECDC4",
  neon: "#00FF88",
  bg: "#0F0F23",
  surface: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  secondaryText: "#B0B0CC",
  mutedText: "#6B6B8D",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
};

const skeletonKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const SkeletonBlock = ({ height = 200, style = {} }) => (
  <div
    style={{
      height,
      borderRadius: 16,
      background: `linear-gradient(110deg, ${COLORS.surface} 30%, rgba(255,255,255,0.12) 50%, ${COLORS.surface} 70%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}
  />
);

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Unknown";
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();

  const [enrolled, setEnrolled] = useState([]);
  const [progress, setProgress] = useState([]);
  const [practiceStats, setPracticeStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [personalization, setPersonalization] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrolledRes, progressRes] = await Promise.all([
          courseApi.getEnrolled(),
          progressApi.getProgress(),
        ]);
        setEnrolled(enrolledRes.data ?? enrolledRes ?? []);
        setProgress(progressRes.data ?? progressRes ?? []);

        try {
          const [statsRes, achRes] = await Promise.all([
            practiceApi.getStats(),
            practiceApi.getAchievements(),
          ]);
          setPracticeStats(statsRes.data ?? statsRes);
          setAchievements(achRes.data ?? achRes ?? []);
        } catch {
          try {
            const dashRes = await dashboardApi.getDashboard();
            const dash = dashRes.data ?? dashRes;
            setPracticeStats(dash.practice_stats ?? null);
            setAchievements(dash.achievements ?? []);
          } catch {
            // Practice tracking not available
          }
        }
      } catch {
        addToast({ type: "error", message: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const fetchPersonalization = async () => {
      try {
        const summaryRes = await personalizationApi.getSummary();
        setPersonalization(summaryRes.data ?? summaryRes);
      } catch {
        // Personalization data not available
      }
    };
    fetchPersonalization();
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const completed = progress.filter((p) => p.completed === true);
    const scores = progress
      .map((p) => p.score)
      .filter((s) => s !== null && s !== undefined && s !== "");
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + Number(b), 0) / scores.length)
        : 0;
    const quizzesPassed = scores.filter((s) => Number(s) >= 70).length;

    return {
      coursesEnrolled: enrolled.length,
      lessonsCompleted: completed.length,
      averageScore: avgScore,
      quizzesPassed,
      practiceSessions: practiceStats?.total_sessions ?? 0,
      practiceMinutes: practiceStats?.total_minutes ?? 0,
      streakDays: practiceStats?.streak_days ?? 0,
    };
  }, [enrolled, progress, practiceStats]);

  const recentActivity = useMemo(() => {
    return [...progress]
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || 0);
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [progress]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
      addToast({ type: "success", message: "Logged out successfully" });
      navigate("/");
    } catch {
      addToast({ type: "error", message: "Failed to log out" });
    } finally {
      setLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{skeletonKeyframes}</style>
        <div
          style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 24,
            padding: "48px 40px",
            textAlign: "center",
            maxWidth: 420,
            width: "100%",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `${COLORS.primary}22`,
              border: `2px solid ${COLORS.primary}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 36,
            }}
          >
            👤
          </div>
          <h2 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
            Welcome, Guest
          </h2>
          <p style={{ color: COLORS.secondaryText, fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>
            Sign in to track your progress, view stats, and manage your profile.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                color: COLORS.text,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: `1px solid ${COLORS.glassBorder}`,
                background: COLORS.glass,
                color: COLORS.text,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = COLORS.surface)}
              onMouseLeave={(e) => (e.target.style.background = COLORS.glass)}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const username = user?.name ?? user?.username ?? "User";
  const email = user?.email ?? "";
  const level = user?.level ?? user?.xp_level ?? null;
  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "0 20px" }}>
        <style>{skeletonKeyframes}</style>
        <div style={{ maxWidth: 800, margin: "0 auto", paddingTop: 40 }}>
          <SkeletonBlock height={160} style={{ marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} height={100} />)}
          </div>
          <SkeletonBlock height={300} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "0 20px 80px" }}>
      <style>{skeletonKeyframes}</style>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingTop: 40 }}>
        {/* User Info Card */}
        <div
          style={{
            background: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            borderRadius: 24,
            padding: 32,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 24,
            animation: "fadeIn 0.3s ease",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.text,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
              {username}
            </h1>
            <p style={{ color: COLORS.secondaryText, fontSize: 15, margin: "0 0 8px" }}>{email}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {level && (
                <span
                  style={{
                    background: `${COLORS.neon}22`,
                    color: COLORS.neon,
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Level {level}
                </span>
              )}
              {personalization?.coaching_state && (
                <span
                  style={{
                    background: `${COLORS.primary}22`,
                    color: COLORS.primary,
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {personalization.coaching_state === "improving" && "Making Progress"}
                  {personalization.coaching_state === "strong_progress" && "Strong Progress"}
                  {personalization.coaching_state === "building_consistency" && "Building Consistency"}
                  {personalization.coaching_state === "needs_focus" && "Needs Focus"}
                  {personalization.coaching_state === "returning_after_gap" && "Welcome Back"}
                  {personalization.coaching_state === "beginner" && "Beginner"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { label: "Courses Enrolled", value: stats.coursesEnrolled, icon: "📚", color: COLORS.primary },
            { label: "Lessons Completed", value: stats.lessonsCompleted, icon: "✅", color: COLORS.success },
            { label: "Average Score", value: `${stats.averageScore}%`, icon: "📊", color: COLORS.secondary },
            { label: "Quizzes Passed", value: stats.quizzesPassed, icon: "🏆", color: COLORS.neon },
            ...(stats.practiceSessions > 0 ? [
              { label: "Practice Sessions", value: stats.practiceSessions, icon: "🎵", color: COLORS.primary },
              { label: "Total Practice", value: `${stats.practiceMinutes}m`, icon: "⏱", color: COLORS.secondary },
              { label: "Streak", value: `${stats.streakDays}d`, icon: "🔥", color: COLORS.warning },
            ] : []),
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                background: COLORS.glass,
                border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 16,
                padding: "24px 20px",
                animation: `fadeIn 0.3s ease ${i * 0.08}s both`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
              <p
                style={{
                  color: stat.color,
                  fontSize: 28,
                  fontWeight: 700,
                  margin: "0 0 4px",
                }}
              >
                {stat.value}
              </p>
              <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Skill Map */}
        {personalization?.skill_map && personalization.skill_map.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Music Skill Map
            </h2>
            <div
              style={{
                background: COLORS.glass,
                border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {personalization.skill_map.slice(0, 5).map((skill) => (
                  <div key={skill.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{skill.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 500 }}>{skill.label}</span>
                        {skill.score !== null ? (
                          <span style={{ color: COLORS.mutedText, fontSize: 13 }}>{skill.score}%</span>
                        ) : (
                          <span style={{ color: COLORS.mutedText, fontSize: 12, fontStyle: "italic" }}>No data yet</span>
                        )}
                      </div>
                      {skill.score !== null && (
                        <div style={{
                          height: 6, borderRadius: 3, background: COLORS.surface, overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: 3,
                            width: `${skill.score}%`,
                            background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Achievements
            </h2>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {achievements.map((a, i) => {
                const defs = {
                  first_practice: { icon: "🎵", label: "First Practice" },
                  first_lesson: { icon: "📖", label: "First Lesson" },
                  first_quiz: { icon: "📝", label: "Quiz Starter" },
                  first_enrollment: { icon: "🎓", label: "Enrolled" },
                  practice_regular: { icon: "🔥", label: "Regular Practitioner" },
                  vocal_enthusiast: { icon: "🎤", label: "Vocal Enthusiast" },
                  voice_tracker: { icon: "📊", label: "Voice Tracker" },
                  first_piano: { icon: "🎹", label: "Piano Starter" },
                  piano_enthusiast: { icon: "🎹", label: "Piano Enthusiast" },
                  first_drum: { icon: "🥁", label: "Drum Starter" },
                  drum_enthusiast: { icon: "🥁", label: "Drum Enthusiast" },
                  first_raga: { icon: "🎵", label: "Raga Starter" },
                  raga_explorer: { icon: "🎵", label: "Raga Explorer" },
                  first_metronome: { icon: "⏱", label: "Metronome Starter" },
                  consistency_champion: { icon: "🏆", label: "Consistency Champion" },
                  practice_master: { icon: "👑", label: "Practice Master" },
                  score_champion: { icon: "⭐", label: "Score Champion" },
                };
                const def = defs[a.type] || { icon: "🏅", label: a.type };
                return (
                  <div key={i} style={{
                    background: COLORS.glass,
                    border: `1px solid ${COLORS.glassBorder}`,
                    borderRadius: 12, padding: "16px 18px", minWidth: 140,
                    textAlign: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{def.icon}</div>
                    <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600 }}>{def.label}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Learning Streak */}
        {personalization?.streak_data && personalization.streak_data.current_streak > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`,
                border: `1px solid ${COLORS.primary}30`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🔥</span>
                <div>
                  <p style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, margin: 0 }}>
                    {personalization.streak_data.current_streak} Day Streak
                  </p>
                  <p style={{ color: COLORS.mutedText, fontSize: 13, margin: "2px 0 0" }}>
                    {personalization.streak_data.total_minutes} minutes total practice
                  </p>
                </div>
              </div>
              {personalization.streak_data.longest_streak > 0 && (
                <span style={{ color: COLORS.mutedText, fontSize: 13 }}>
                  Best: {personalization.streak_data.longest_streak} days
                </span>
              )}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div
              style={{
                background: COLORS.glass,
                border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 16,
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ color: COLORS.secondaryText, fontSize: 16, margin: 0 }}>
                No activity yet. Start a course to see your progress here!
              </p>
            </div>
          ) : (
            <div
              style={{
                background: COLORS.glass,
                border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {recentActivity.map((item, i) => (
                <div
                  key={item.id || i}
                  style={{
                    padding: "16px 20px",
                    borderBottom: i < recentActivity.length - 1 ? `1px solid ${COLORS.glassBorder}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div>
                    <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 500, margin: "0 0 4px" }}>
                      {item.lesson_title ?? item.lessonTitle ?? item.title ?? `Lesson ${item.lesson_id ?? item.lessonId ?? ""}`}
                    </p>
                    <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>
                      {formatDate(item.updated_at || item.updatedAt || item.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {item.completed && (
                      <span
                        style={{
                          background: `${COLORS.success}22`,
                          color: COLORS.success,
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Completed
                      </span>
                    )}
                    {item.score !== null && item.score !== undefined && (
                      <span
                        style={{
                          background:
                            Number(item.score) >= 70
                              ? `${COLORS.neon}22`
                              : `${COLORS.warning}22`,
                          color: Number(item.score) >= 70 ? COLORS.neon : COLORS.warning,
                          padding: "4px 10px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {item.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Practice Studio Link */}
        <section style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/practice")}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: COLORS.glass, border: `1px solid ${COLORS.primary}25`,
              color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${COLORS.primary}25`; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🎵</span>
              Open Practice Studio
            </span>
            <span style={{ color: COLORS.mutedText }}>→</span>
          </button>
        </section>

        {/* AI Coach Link */}
        <section style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/ai-coach")}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: COLORS.glass, border: `1px solid ${COLORS.secondary}25`,
              color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${COLORS.secondary}25`; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🎯</span>
              AI Music Coach
            </span>
            <span style={{ color: COLORS.mutedText }}>→</span>
          </button>
        </section>

        {/* World Music Link */}
        <section style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/world-music")}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: COLORS.glass, border: `1px solid ${COLORS.secondary}25`,
              color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.secondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${COLORS.secondary}25`; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🌍</span>
              World Music
            </span>
            <span style={{ color: COLORS.mutedText }}>→</span>
          </button>
        </section>

        {/* Practice History Link */}
        <section style={{ marginBottom: 32 }}>
          <button
            onClick={() => navigate("/practice-history")}
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
              color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.glassBorder; }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              View Practice History
            </span>
            <span style={{ color: COLORS.mutedText }}>→</span>
          </button>
        </section>

        {/* Enrolled Courses */}
        {enrolled.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Enrolled Courses
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {enrolled.map((course) => (
                <div
                  key={course.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onKeyDown={(e) => onKeyDown(e, () => navigate(`/courses/${course.id}`))}
                  style={{
                    background: COLORS.glass,
                    border: `1px solid ${COLORS.glassBorder}`,
                    borderRadius: 16,
                    padding: "16px 20px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "border-color 0.2s, transform 0.2s",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.glassBorder;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div>
                    <p style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
                      {course.title}
                    </p>
                    <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>
                      {course.instrument || "Music"} • {course.difficulty || "All levels"}
                    </p>
                  </div>
                  <span
                    style={{
                      color: COLORS.primary,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    View →
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Settings */}
        <section>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Settings
          </h2>
          <div
            style={{
              background: COLORS.glass,
              border: `1px solid ${COLORS.glassBorder}`,
              borderRadius: 16,
              padding: "8px 20px",
            }}
          >
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: "100%",
                padding: "16px 0",
                border: "none",
                background: "transparent",
                color: COLORS.error,
                fontSize: 16,
                fontWeight: 600,
                cursor: loggingOut ? "not-allowed" : "pointer",
                opacity: loggingOut ? 0.6 : 1,
                textAlign: "left",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loggingOut) e.target.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                if (!loggingOut) e.target.style.opacity = "1";
              }}
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
