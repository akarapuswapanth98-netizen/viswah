import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { courseApi } from "../api/courseApi";
import { onKeyDown } from "../utils/keyboard";
import { useSubscription } from "../hooks/useSubscription";

import C from "../components/ui/colors";

const SkeletonCard = () => (
  <div style={{
    borderRadius: 16,
    overflow: "hidden",
    background: C.surface,
    border: `1px solid ${C.border}`,
  }}>
    <div style={{
      height: 160,
      background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
    <div style={{ padding: 20 }}>
      <div style={{
        height: 20, width: "70%", borderRadius: 8,
        background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        marginBottom: 12,
      }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{
          height: 24, width: 70, borderRadius: 8,
          background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
        <div style={{
          height: 24, width: 80, borderRadius: 8,
          background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      </div>
      <div style={{
        height: 14, width: "50%", borderRadius: 8,
        background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }} />
    </div>
  </div>
);

const getDifficultyColor = (d) => {
  if (d === "beginner") return { bg: `${C.success}18`, text: C.success };
  if (d === "advanced") return { bg: `${C.warning}18`, text: C.warning };
  return { bg: `${C.secondary}18`, text: C.secondary };
};

export default function Courses() {
  const navigate = useNavigate();
  const { hasEntitlement, currentPlan } = useSubscription();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [instrument, setInstrument] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseApi.getCourses();
      setCourses(res.data ?? res ?? []);
    } catch (err) {
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const instruments = [...new Set(courses.map((c) => c.instrument).filter(Boolean))].sort();
  const difficulties = [...new Set(courses.map((c) => c.difficulty).filter(Boolean))].sort();

  const filtered = courses.filter((c) => {
    if (difficulty && c.difficulty !== difficulty) return false;
    if (instrument && c.instrument !== instrument) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.instrument && c.instrument.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getLessonsCount = (c) => c.lessons_count ?? c.lessonsCount ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      {/* Ambient light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 70% 40% at 60% -5%, rgba(199, 125, 186, 0.04), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>
            Discover Courses
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
            Explore lessons across instruments, vocals, and music theory
          </p>
        </div>

        {/* Filters — elevated panel */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 20,
          marginBottom: 32,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              padding: "12px 16px",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              width: "100%",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = C.borderFocus;
              e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.06)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = C.border;
              e.target.style.boxShadow = "none";
            }}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              padding: "12px 16px",
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              minWidth: 160,
              boxSizing: "border-box",
            }}
          >
            <option value="">All Difficulties</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            style={{
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.text,
              padding: "12px 16px",
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              minWidth: 160,
              boxSizing: "border-box",
            }}
          >
            <option value="">All Instruments</option>
            {instruments.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.error}30`,
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
            marginBottom: 24,
          }}>
            <p style={{ color: C.textSecondary, fontSize: 16, marginBottom: 8 }}>Failed to load courses</p>
            <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 20 }}>{error}</p>
            <button onClick={fetchCourses} style={{
              padding: "12px 32px", borderRadius: 10, border: "none",
              background: C.primary, color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
            }}>Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "60px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🎵</div>
            <p style={{ color: C.textSecondary, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
              No courses found
            </p>
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Course grid — spatial cards */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {filtered.map((course, i) => {
              const dc = getDifficultyColor(course.difficulty);
              return (
                <div
                  key={course.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onKeyDown={(e) => onKeyDown(e, () => navigate(`/courses/${course.id}`))}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease-out",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0) translateZ(0)" : "translateY(16px) translateZ(-10px)",
                    transitionDelay: `${Math.min(i * 60, 300)}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) translateZ(8px)";
                    e.currentTarget.style.borderColor = C.primary + "35";
                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.35), 0 0 24px ${C.primary}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) translateZ(0)";
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {course.image_url && (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                    />
                  )}
                  {!course.image_url && (
                    <div style={{
                      height: 160,
                      background: `linear-gradient(135deg, ${C.primary}12, ${C.raga}10)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 48, opacity: 0.3 }}>🎵</span>
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <p style={{ color: C.text, fontWeight: 600, fontSize: 16, margin: "0 0 10px", lineHeight: 1.3 }}>
                      {course.title}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      {course.instrument && (
                        <span style={{
                          background: `${C.primary}12`,
                          color: C.primary,
                          borderRadius: 7,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 500,
                        }}>{course.instrument}</span>
                      )}
                      {course.difficulty && (
                        <span style={{
                          background: dc.bg,
                          color: dc.text,
                          borderRadius: 7,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 500,
                        }}>{course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}</span>
                      )}
                    </div>
                    {course.stage && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 4px" }}>
                        <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
                          Stage: {course.stage}
                        </p>
                        {course.stage >= 3 && !hasEntitlement("full_course_access") && (
                          <span style={{
                            background: `${C.primary}15`,
                            color: C.primary,
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            Premium
                          </span>
                        )}
                      </div>
                    )}
                    <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
                      {getLessonsCount(course)} lessons
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
