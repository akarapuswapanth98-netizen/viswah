import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { courseApi } from "../api/courseApi";
import { progressApi } from "../api/progressApi";

export default function Lesson() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState([]);

  useEffect(() => {
    const fetchLessonData = async () => {
      setLoading(true);
      setError("");
      try {
        const lessonRes = await courseApi.getLesson(id);
        setLesson(lessonRes.data ?? lessonRes);

        if ((lessonRes.data ?? lessonRes).course_id) {
          const [courseRes, lessonsRes] = await Promise.all([
            courseApi.getCourse((lessonRes.data ?? lessonRes).course_id),
            courseApi.getLessons((lessonRes.data ?? lessonRes).course_id),
          ]);
          setCourse(courseRes.data ?? courseRes);
          const lessonsData = lessonsRes.data ?? lessonsRes ?? [];
          setLessons([...lessonsData].sort((a, b) => a.order - b.order));
        }

        if (user) {
          const progressRes = await progressApi.getProgress();
          setProgress(progressRes.data ?? progressRes ?? []);
        }

        parseContent((lessonRes.data ?? lessonRes).content);
      } catch (err) {
        setError(err.message || "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };
    fetchLessonData();
  }, [id, user]);

  const parseInline = (text) => {
    if (!text) return text;
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", text: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: "bold", text: match[1] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ type: "text", text: text.slice(lastIndex) });
    }
    const result = parts.length === 1 && parts[0].type === "text" ? text : parts;
    return result;
  };

  const parseContent = (raw) => {
    if (!raw) { setContent([]); return; }
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        setContent(parsed);
      } else if (parsed.blocks) {
        setContent(parsed.blocks);
      } else {
        setContent([{ type: "paragraph", text: JSON.stringify(parsed) }]);
      }
    } catch {
      const blocks = [];
      const lines = raw.split("\n");
      let i = 0;

      const isListItem = (line) => {
        const t = line.trim();
        return t.startsWith("- ") || t.startsWith("* ");
      };

      const isOrderedItem = (line) => /^\d+\.\s/.test(line.trim());

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === "" || trimmed === "---") {
          if (trimmed === "---") {
            blocks.push({ type: "divider" });
          }
          i++;
          continue;
        }

        if (trimmed.startsWith("### ")) {
          blocks.push({ type: "header", text: trimmed.replace(/^#+\s*/, ""), level: 3 });
          i++;
          continue;
        }

        if (trimmed.startsWith("## ")) {
          blocks.push({ type: "header", text: trimmed.replace(/^#+\s*/, ""), level: 2 });
          i++;
          continue;
        }

        if (trimmed.startsWith("# ")) {
          blocks.push({ type: "header", text: trimmed.replace(/^#+\s*/, ""), level: 1 });
          i++;
          continue;
        }

        if (isOrderedItem(trimmed)) {
          const items = [];
          while (i < lines.length && isOrderedItem(lines[i])) {
            items.push(parseInline(lines[i].trim().replace(/^\d+\.\s*/, "")));
            i++;
          }
          blocks.push({ type: "ordered_list", items });
          continue;
        }

        if (isListItem(trimmed)) {
          const items = [];
          while (i < lines.length && isListItem(lines[i])) {
            items.push(parseInline(lines[i].trim().replace(/^[-*]\s*/, "")));
            i++;
          }
          blocks.push({ type: "list", items });
          continue;
        }

        const paraLines = [trimmed];
        i++;
        while (
          i < lines.length &&
          lines[i].trim() !== "" &&
          !lines[i].trim().startsWith("#") &&
          !isListItem(lines[i]) &&
          !isOrderedItem(lines[i]) &&
          lines[i].trim() !== "---"
        ) {
          paraLines.push(lines[i].trim());
          i++;
        }
        const fullText = paraLines.join("\n");
        const inlineParsed = parseInline(fullText);
        blocks.push({ type: "paragraph", text: inlineParsed });
        continue;
      }
      setContent(blocks.length > 0 ? blocks : [{ type: "paragraph", text: raw }]);
    }
  };

  const isComplete = progress.some((p) => String(p.lesson_id) === String(id) && p.completed);

  const handleMarkComplete = async () => {
    if (!user) {
      toast.info("Please login to track progress");
      navigate("/login");
      return;
    }
    if (isComplete) return;
    setCompleting(true);
    try {
      await progressApi.createProgress({
        lesson_id: id,
        completed: true,
        score: null,
      });
      setProgress((prev) => [...prev, { lesson_id: id, completed: true, score: null }]);
      toast.success("Lesson completed!");
    } catch (err) {
      toast.error(err.message || "Failed to mark complete");
    } finally {
      setCompleting(false);
    }
  };

  const currentIndex = lessons.findIndex((l) => String(l.id) === String(id));
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const renderInline = (parts) => {
    if (typeof parts === "string") return parts;
    if (!Array.isArray(parts)) return parts?.text || "";
    return parts.map((part, i) => {
      if (part.type === "bold") {
        return <strong key={i} style={{ color: "#F0EBE3", fontWeight: 600 }}>{part.text}</strong>;
      }
      return <span key={i} style={{ whiteSpace: "pre-line" }}>{part.text}</span>;
    });
  };

  const renderContentBlock = (block, index) => {
    if (!block) return null;
    const type = block.type?.toLowerCase();

    switch (type) {
      case "header": {
        const level = block.level || 2;
        const sizes = { 1: 26, 2: 22, 3: 18 };
        const weights = { 1: 700, 2: 700, 3: 600 };
        return (
          <h2 key={index} style={{
            fontSize: sizes[level] || 22, fontWeight: weights[level] || 700, color: "#F0EBE3",
            margin: level === 1 ? "36px 0 16px" : "28px 0 12px",
            borderBottom: level <= 2 ? "1px solid rgba(240, 235, 227, 0.08)" : "none",
            paddingBottom: level <= 2 ? 10 : 0,
          }}>{block.text || block.content}</h2>
        );
      }
      case "paragraph": {
        const text = block.text || block.content;
        if (typeof text === "string" && text.includes("\n")) {
          const lines = text.split("\n");
          return (
            <div key={index} style={{ margin: "0 0 16px" }}>
              {lines.map((line, li) => (
                <p key={li} style={{
                  fontSize: 15, color: "#A89FB8", lineHeight: 1.8,
                  margin: li < lines.length - 1 ? "0 0 4px" : 0,
                  whiteSpace: "pre-line",
                }}>{renderInline(line)}</p>
              ))}
            </div>
          );
        }
        return (
          <p key={index} style={{
            fontSize: 15, color: "#A89FB8", lineHeight: 1.8, margin: "0 0 16px",
            whiteSpace: "pre-line",
          }}>{renderInline(text)}</p>
        );
      }
      case "list":
        return (
          <ul key={index} style={{
            margin: "0 0 16px", paddingLeft: 24, listStyleType: "disc",
            color: "#5BA8A0",
          }}>
            {(block.items || []).map((item, i) => (
              <li key={i} style={{
                fontSize: 15, color: "#A89FB8", lineHeight: 1.8, marginBottom: 8,
              }}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      case "ordered_list":
        return (
          <ol key={index} style={{
            margin: "0 0 16px", paddingLeft: 24, listStyleType: "decimal",
            color: "#C77DBA",
          }}>
            {(block.items || []).map((item, i) => (
              <li key={i} style={{
                fontSize: 15, color: "#A89FB8", lineHeight: 1.8, marginBottom: 8,
              }}>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      case "bold":
        return (
          <strong key={index} style={{
            fontSize: 15, color: "#F0EBE3", fontWeight: 600,
          }}>{block.text || block.content}</strong>
        );
      case "divider":
        return (
          <hr key={index} style={{
            border: "none", height: 1, background: "rgba(240, 235, 227, 0.08)",
            margin: "24px 0",
          }} />
        );
      default:
        return (
          <p key={index} style={{
            fontSize: 15, color: "#A89FB8", lineHeight: 1.8, margin: "0 0 16px",
          }}>{renderInline(block.text || block.content || JSON.stringify(block))}</p>
        );
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0C0A14",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(240, 235, 227, 0.08)",
            borderTopColor: "#E8A838", borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: "#A89FB8", marginTop: 16, fontSize: 14 }}>Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0C0A14",
      }}>
        <div role="alert" style={{
          background: "#161222", border: "1px solid rgba(240, 235, 227, 0.06)",
          borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400,
        }}>
          <p style={{ color: "#D46A6A", fontSize: 16, marginBottom: 16 }}>{error}</p>
          <button onClick={() => navigate("/courses")} style={{
            padding: "10px 24px", background: "#E8A838", color: "#0C0A14", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
          }}>Back to Courses</button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0C0A14",
      }}>
        <p style={{ color: "#A89FB8" }}>Lesson not found</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0A14",
      padding: "20px 24px 100px",
      position: "relative",
    }}>
      {/* Ambient reading light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 60% 30% at 50% 15%, rgba(232, 168, 56, 0.04), transparent 70%)",
      }} />

      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 24,
          flexWrap: "wrap", fontSize: 13, color: "#6B6080",
        }}>
          <Link to="/courses" style={{ color: "#E8A838", textDecoration: "none" }}>Courses</Link>
          {course && (
            <>
              <span>/</span>
              <Link to={`/courses/${course.id}`} style={{ color: "#E8A838", textDecoration: "none" }}>
                {course.title}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: "#A89FB8" }}>{lesson.title}</span>
        </div>

        <div style={{
          background: "#161222",
          border: "1px solid rgba(240, 235, 227, 0.06)",
          borderRadius: 20, padding: 32,
          marginBottom: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            {(lesson.lesson_type || lesson.duration_minutes) && (
              <span style={{
                padding: "4px 12px", background: "rgba(232, 168, 56, 0.12)",
                border: "1px solid rgba(232, 168, 56, 0.2)", borderRadius: 20,
                fontSize: 12, color: "#E8A838", fontWeight: 500,
              }}>{lesson.lesson_type ? lesson.lesson_type.replace(/\*\*/g, "").replace(/^./, c => c.toUpperCase()) : ""}{lesson.lesson_type && lesson.duration_minutes ? " \u00B7 " : ""}{lesson.duration_minutes ? `${lesson.duration_minutes} min` : ""}</span>
            )}
            {isComplete && (
              <span style={{
                padding: "4px 12px", background: "rgba(109, 191, 115, 0.12)",
                border: "1px solid rgba(109, 191, 115, 0.2)", borderRadius: 20,
                fontSize: 12, color: "#6DBF73", fontWeight: 500,
              }}>✓ Completed</span>
            )}
          </div>

          <h1 style={{
            fontSize: 26, fontWeight: 700, color: "#F0EBE3", margin: "0 0 24px",
          }}>{lesson.title}</h1>

          <div style={{ marginBottom: 24 }}>
            {content.map((block, i) => {
              if (i === 0 && block.type === "header" && block.text === lesson.title) return null;
              return renderContentBlock(block, i);
            })}
          </div>

          {lesson.audio_url && (
            <div style={{
              background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 20, marginBottom: 24,
            }}>
              <p style={{ fontSize: 13, color: "#6B6080", margin: "0 0 10px" }}>Audio</p>
              <audio controls style={{ width: "100%", borderRadius: 8 }}>
                <source src={lesson.audio_url} />
              </audio>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={handleMarkComplete} disabled={completing || isComplete} style={{
              padding: "12px 28px",
              background: isComplete ? "rgba(109, 191, 115, 0.15)" : completing ? "#C4893A" : "#6DBF73",
              color: isComplete ? "#6DBF73" : "#0C0A14",
              border: isComplete ? "1px solid rgba(109, 191, 115, 0.25)" : "none",
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: completing || isComplete ? "not-allowed" : "pointer",
              boxShadow: !isComplete && !completing ? "0 2px 12px rgba(109, 191, 115, 0.15)" : "none",
            }}>
              {isComplete ? "✓ Completed" : completing ? "Saving..." : "Mark Complete"}
            </button>

            {lesson.quiz_questions && (
              <button onClick={() => navigate(`/lessons/${id}/quiz`)} style={{
                padding: "12px 28px", background: "#E8A838", color: "#0C0A14",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(232, 168, 56, 0.15)",
              }}>Take Quiz</button>
            )}
          </div>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", gap: 12,
        }}>
          {prevLesson ? (
            <Link to={`/lessons/${prevLesson.id}`} style={{
              flex: 1, padding: "14px 20px", background: "#161222",
              border: "1px solid rgba(240, 235, 227, 0.06)", borderRadius: 14,
              textDecoration: "none", display: "flex", flexDirection: "column", gap: 4,
              transition: "border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(232, 168, 56, 0.2)";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(240, 235, 227, 0.06)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
            >
              <span style={{ fontSize: 12, color: "#6B6080" }}>← Previous</span>
              <span style={{ fontSize: 14, color: "#F0EBE3", fontWeight: 500 }}>{prevLesson.title}</span>
            </Link>
          ) : <div style={{ flex: 1 }} />}

          {nextLesson ? (
            <Link to={`/lessons/${nextLesson.id}`} style={{
              flex: 1, padding: "14px 20px", background: "#161222",
              border: "1px solid rgba(240, 235, 227, 0.06)", borderRadius: 14,
              textDecoration: "none", display: "flex", flexDirection: "column",
              gap: 4, textAlign: "right",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(232, 168, 56, 0.2)";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(240, 235, 227, 0.06)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
            >
              <span style={{ fontSize: 12, color: "#6B6080" }}>Next →</span>
              <span style={{ fontSize: 14, color: "#F0EBE3", fontWeight: 500 }}>{nextLesson.title}</span>
            </Link>
          ) : <div style={{ flex: 1 }} />}
        </div>
      </div>
    </div>
  );
}
