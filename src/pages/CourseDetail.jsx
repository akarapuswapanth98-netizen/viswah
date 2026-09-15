import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { courseApi } from "../api/courseApi";
import { progressApi } from "../api/progressApi";
import C from "../components/ui/colors";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          courseApi.getCourse(id),
          courseApi.getLessons(id),
        ]);
        setCourse(courseRes.data ?? courseRes);
        const lessonsData = lessonsRes.data ?? lessonsRes ?? [];
        setLessons([...lessonsData].sort((a, b) => a.order - b.order));

        if (user) {
          const [enrolledRes, progressRes] = await Promise.all([
            courseApi.getEnrolled(),
            progressApi.getProgress(),
          ]);
          const enrolledList = enrolledRes.data ?? enrolledRes ?? [];
          setEnrolled(enrolledList.some((e) => String(e.id) === String(id)));
          setProgress(progressRes.data ?? progressRes ?? []);
        }
      } catch (err) {
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const isLessonComplete = (lessonId) =>
    progress.some((p) => p.lesson_id === lessonId && p.completed);

  const handleEnroll = async () => {
    if (!user) {
      toast.info("Please login to enroll");
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await courseApi.enroll(id);
      setEnrolled(true);
      toast.success("Successfully enrolled in course!");
    } catch (err) {
      toast.error(err.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { beginner: "#34C759", intermediate: "#FF9500", advanced: "#FF3B30" };
    return colors[difficulty?.toLowerCase()] || "#6B6B8D";
  };

  const getLessonTypeIcon = (type) => {
    const icons = { video: "▶", audio: "♪", text: "📄", quiz: "❓", interactive: "🎯" };
    return icons[type?.toLowerCase()] || "📝";
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${C.ink} 0%, #1a1a3e 50%, ${C.ink} 100%)`,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: "#B0B0CC", marginTop: 16 }}>Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${C.ink} 0%, #1a1a3e 50%, ${C.ink} 100%)`,
      }}>
        <div role="alert" style={{
          background: C.surfaceGlass, border: `1px solid ${C.glassBorder}`,
          borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400,
        }}>
          <p style={{ color: "#FF3B30", fontSize: 16, marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate("/courses")} style={{
            padding: "10px 24px", background: C.primary, color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Back to Courses</button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${C.ink} 0%, #1a1a3e 50%, ${C.ink} 100%)`,
      }}>
        <p style={{ color: "#B0B0CC" }}>Course not found</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.ink} 0%, #1a1a3e 50%, ${C.ink} 100%)`,
      padding: "20px 24px 100px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link to="/courses" style={{
          color: C.primary, textDecoration: "none", fontSize: 14, display: "inline-flex",
          alignItems: "center", gap: 6, marginBottom: 24, padding: "8px 4px",
          minHeight: 44,
        }}>
          ← Back to Courses
        </Link>

        <div style={{
          background: C.surfaceGlass, backdropFilter: "blur(20px)",
          border: `1px solid ${C.glassBorder}`, borderRadius: 20, padding: 32,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {course.stage && (
              <span style={{
                padding: "4px 12px", background: `${C.primary}20`,
                border: `1px solid ${C.primary}30`, borderRadius: 20,
                fontSize: 12, color: C.primary, fontWeight: 500,
              }}>{course.stage}</span>
            )}
            {course.instrument && (
              <span style={{
                padding: "4px 12px", background: `${C.secondary}20`,
                border: `1px solid ${C.secondary}30`, borderRadius: 20,
                fontSize: 12, color: C.secondary, fontWeight: 500,
              }}>{course.instrument}</span>
            )}
            {course.difficulty && (
              <span style={{
                padding: "4px 12px",
                background: `${getDifficultyColor(course.difficulty)}20`,
                border: `1px solid ${getDifficultyColor(course.difficulty)}50`,
                borderRadius: 20, fontSize: 12,
                color: getDifficultyColor(course.difficulty), fontWeight: 500,
              }}>{course.difficulty}</span>
            )}
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 700, color: C.text, margin: "0 0 12px",
          }}>{course.title}</h1>
          <p style={{
            fontSize: 15, color: C.textSecondary, lineHeight: 1.6, margin: "0 0 20px",
          }}>{course.description}</p>

          <div style={{
            display: "flex", alignItems: "center", gap: 24, color: C.textMuted, fontSize: 14,
          }}>
            <span>{course.lessons_count || lessons.length} lessons</span>
            {enrolled && <span style={{ color: C.success }}>✓ Enrolled</span>}
          </div>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: 0 }}>Lessons</h2>
          {!enrolled && (
            <button onClick={handleEnroll} disabled={enrolling} style={{
              padding: "12px 24px", background: enrolling ? C.primaryMuted : C.primary,
              color: C.ink, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: enrolling ? "not-allowed" : "pointer", minHeight: 44,
            }}>{enrolling ? "Enrolling..." : "Enroll in Course"}</button>
          )}
        </div>

        {lessons.length === 0 ? (
          <div style={{
            background: C.surfaceGlass, border: `1px solid ${C.glassBorder}`,
            borderRadius: 16, padding: 40, textAlign: "center",
          }}>
            <p style={{ color: C.textMuted, fontSize: 15, margin: "0 0 16px" }}>
              No lessons available yet
            </p>
            <Link to={`/ai-lessons/${id}`} style={{
              display: "inline-block", padding: "10px 24px", background: C.secondary,
              color: C.ink, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
            }}>Generate AI Lesson</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lessons.map((lesson, index) => {
              const completed = isLessonComplete(lesson.id);
              return (
                <Link
                  key={lesson.id}
                  to={enrolled ? `/lessons/${lesson.id}` : "#"}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: C.surfaceGlass,
                    border: `1px solid ${completed ? `${C.success}44` : C.glassBorder}`,
                    borderRadius: 14, padding: "16px 20px", textDecoration: "none",
                    cursor: enrolled ? "pointer" : "not-allowed",
                    opacity: enrolled ? 1 : 0.6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (enrolled) {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.background = C.surfaceHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = completed
                      ? `${C.success}44`
                      : C.glassBorder;
                    e.currentTarget.style.background = C.surfaceGlass;
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: completed
                      ? `${C.success}22`
                      : `${C.primary}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 600,
                    color: completed ? C.success : C.primary, flexShrink: 0,
                  }}>
                    {completed ? "✓" : index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 4px",
                    }}>{lesson.title}</h3>
                    <div style={{
                      display: "flex", gap: 12, fontSize: 13, color: C.textMuted,
                    }}>
                      <span>{getLessonTypeIcon(lesson.lesson_type)} {lesson.lesson_type}</span>
                      {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
