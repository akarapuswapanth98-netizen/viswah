import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { aiApi } from "../api/aiApi";

import C from "../components/ui/colors";

const keyframes = `
@keyframes aiLessonsSpin { to { transform: rotate(360deg); } }
@keyframes aiLessonsFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes aiLessonsPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes aiLessonsGlow { 0%,100% { box-shadow: 0 0 20px ${C.primary}4D; } 50% { box-shadow: 0 0 40px ${C.primary}99; } }
@keyframes aiLessonsTyping { 0% { width: 0; } 100% { width: 100%; } }
@keyframes aiLessonsOrbit { 0% { transform: rotate(0deg) translateX(30px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(30px) rotate(-360deg); } }
@keyframes aiLessonsGradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
`;

const INSTRUMENTS = ["vocal","piano","guitar","drums","violin","flute","saxophone","percussion","bass","keyboard"];
const DIFFICULTIES = ["beginner","intermediate","advanced"];
const LESSON_TYPES = ["theory","practice","ear-training","sight-reading","improvisation"];



const AIAnimation = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
    <div style={{ position: "relative", width: 80, height: 80, marginBottom: 24 }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        border: `3px solid ${C.glassBorder}`,
        borderTopColor: C.primary,
        animation: "aiLessonsSpin 1s linear infinite",
      }} />
      {[0,1,2].map(i => (
        <div key={i} style={{
          position: "absolute", width: 10, height: 10, borderRadius: "50%",
          background: i === 0 ? C.primary : i === 1 ? C.secondary : C.neon,
          animation: `aiLessonsOrbit ${2 + i * 0.5}s linear infinite`,
          animationDelay: `${i * 0.3}s`,
          top: "50%", left: "50%", marginTop: -5, marginLeft: -5,
        }} />
      ))}
    </div>
    <p style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 8, animation: "aiLessonsPulse 2s ease-in-out infinite" }}>
      AI is creating your lesson...
    </p>
    <p style={{ color: C.textMuted, fontSize: 13 }}>This usually takes a few seconds</p>
  </div>
);

const TopicChip = ({ topic, onClick }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", borderRadius: 20,
    background: `${C.primary}26`, border: `1px solid ${C.primary}4D`,
    color: C.primary, fontSize: 13, fontWeight: 500, cursor: "pointer",
    transition: "all 0.2s", whiteSpace: "nowrap",
  }}
  onMouseEnter={e => { e.target.style.background = `${C.primary}4D`; e.target.style.transform = "scale(1.05)"; }}
  onMouseLeave={e => { e.target.style.background = `${C.primary}26`; e.target.style.transform = "scale(1)"; }}
  >
    {topic}
  </button>
);

const ContentRenderer = ({ content }) => {
  if (!content) return null;
  let sections = [];
  if (typeof content === "string") {
    try { content = JSON.parse(content); } catch { sections = [{ type: "text", text: content }]; }
  }
  if (Array.isArray(content)) sections = content;
  else if (content.sections) sections = content.sections;
  else if (content.title || content.text || content.content) sections = [content];
  else sections = [{ type: "text", text: JSON.stringify(content, null, 2) }];

  return (
    <div style={{ animation: "aiLessonsFadeIn 0.5s ease" }}>
      {sections.map((s, i) => {
        if (!s) return null;
        const t = s.type || "paragraph";
        if (t === "header" || t === "title") return (
          <h3 key={i} style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "24px 0 12px", borderLeft: `3px solid ${C.secondary}`, paddingLeft: 12 }}>
            {s.text || s.content || s.title}
          </h3>
        );
        if (t === "list" || s.items) return (
          <ul key={i} style={{ margin: "0 0 16px", paddingLeft: 0, listStyle: "none" }}>
            {(s.items || []).map((item, j) => (
              <li key={j} style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8, marginBottom: 6, paddingLeft: 20, position: "relative" }}>
                <span style={{ position: "absolute", left: 0, color: C.neon }}>▸</span>
                {item}
              </li>
            ))}
          </ul>
        );
        if (t === "bold" || t === "highlight") return (
          <p key={i} style={{ fontSize: 15, color: C.text, fontWeight: 600, margin: "12px 0" }}>{s.text || s.content}</p>
        );
        return (
          <p key={i} style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8, margin: "0 0 12px" }}>
            {s.text || s.content || JSON.stringify(s)}
          </p>
        );
      })}
    </div>
  );
};

const StepsRenderer = ({ steps }) => {
  if (!steps || !steps.length) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: C.secondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Practice Steps</h4>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, marginBottom: 12, padding: "12px 16px",
          background: C.surfaceGlass, border: `1px solid ${C.glassBorder}`, borderRadius: 12,
          animation: `aiLessonsFadeIn 0.3s ease ${i * 0.1}s both`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: C.text,
          }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>{typeof step === "string" ? step : step.text || step.instruction || JSON.stringify(step)}</p>
            {step.detail && <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>{step.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

const TipsRenderer = ({ tips }) => {
  if (!tips || !tips.length) return null;
  return (
    <div style={{ marginTop: 20, padding: "16px 20px", background: `${C.neon}0F`, border: `1px solid ${C.neon}26`, borderRadius: 14 }}>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: C.neon, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Pro Tips</h4>
      {tips.map((tip, i) => (
        <p key={i} style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, margin: "0 0 8px", paddingLeft: 16, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: C.neon }}>✦</span>
          {typeof tip === "string" ? tip : tip.text || tip.tip || JSON.stringify(tip)}
        </p>
      ))}
    </div>
  );
};

export default function AiLessons() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const s = document.createElement("style");
    s.id = "ai-lessons-keyframes";
    s.textContent = keyframes;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

  const [activeTab, setActiveTab] = useState("lesson");
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const [lessonForm, setLessonForm] = useState({ topic: "", difficulty: "beginner", instrument: "piano", lesson_type: "theory" });
  const [exerciseForm, setExerciseForm] = useState({ topic: "", skill_level: "beginner" });

  const [topicInstrument, setTopicInstrument] = useState("piano");
  const [topicDifficulty, setTopicDifficulty] = useState("beginner");
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLesson = async () => {
    if (!lessonForm.topic.trim()) { addToast({ type: "error", message: "Topic is required" }); return; }
    setGenerating(true); setError(null); setGenerated(null);
    try {
      const res = await aiApi.generateLesson(lessonForm);
      const data = res.data ?? res;
      setGenerated(data);
      addToast({ type: "success", message: "Lesson generated!" });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Generation failed");
      addToast({ type: "error", message: "Failed to generate lesson" });
    } finally { setGenerating(false); }
  };

  const handleGenerateExercise = async () => {
    if (!exerciseForm.topic.trim()) { addToast({ type: "error", message: "Topic is required" }); return; }
    setGenerating(true); setError(null); setGenerated(null);
    try {
      const res = await aiApi.generateExercise(exerciseForm);
      const data = res.data ?? res;
      setGenerated(data);
      addToast({ type: "success", message: "Exercise generated!" });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Generation failed");
      addToast({ type: "error", message: "Failed to generate exercise" });
    } finally { setGenerating(false); }
  };

  const handleFetchTopics = async () => {
    setLoadingTopics(true); setSuggestedTopics([]);
    try {
      const res = await aiApi.getTopics(topicInstrument, topicDifficulty);
      const data = res.data ?? res;
      setSuggestedTopics(Array.isArray(data) ? data : data.topics || []);
    } catch (err) {
      addToast({ type: "error", message: "Could not fetch topics" });
    } finally { setLoadingTopics(false); }
  };

  const handleCopy = useCallback(() => {
    if (!generated) return;
    const text = JSON.stringify(generated, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      addToast({ type: "success", message: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      addToast({ type: "error", message: "Copy failed" });
    });
  }, [generated, addToast]);

  const inputStyle = {
    width: "100%", padding: "12px 16px", background: C.surface, border: `1px solid ${C.glassBorder}`,
    borderRadius: 12, color: C.text, fontSize: 14, outline: "none", transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 6, display: "block" };

  const selectStyle = {
    ...inputStyle, appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23B0B0CC' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
  };

  const btnPrimary = {
    width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
    background: `linear-gradient(135deg, ${C.primary}, #8B5CF6)`,
    color: C.text, fontSize: 15, fontWeight: 700, cursor: "pointer",
    transition: "all 0.3s", boxShadow: `0 4px 20px ${C.primary}4D`,
  };

  const cardStyle = {
    background: C.surfaceGlass, backdropFilter: "blur(20px)",
    border: `1px solid ${C.glassBorder}`, borderRadius: 20, padding: 28,
    marginBottom: 24,
  };

  const generatedData = generated?.data ?? generated;
  const content = generatedData?.content || generatedData?.text || generatedData?.lesson || generatedData?.exercise;
  const title = generatedData?.title || generatedData?.topic || generatedData?.name;
  const steps = generatedData?.steps || generatedData?.practice_steps || generatedData?.exercises;
  const tips = generatedData?.tips || generatedData?.pro_tips || generatedData?.advice;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.ink} 0%, #1a1a3e 50%, ${C.ink} 100%)`,
      padding: "20px 24px 100px",
    }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36, animation: "aiLessonsFadeIn 0.5s ease" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            marginBottom: 16, boxShadow: `0 0 30px ${C.primary}4D`,
          }}>
            <span style={{ fontSize: 28 }}>🤖</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>
            AI <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Lessons</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14 }}>Personalized music lessons powered by AI</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: C.surfaceGlass, border: `1px solid ${C.glassBorder}`, borderRadius: 14, padding: 4 }}>
          {[
            { key: "lesson", label: "Generate Lesson", icon: "📖" },
            { key: "exercise", label: "Generate Exercise", icon: "✏️" },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setGenerated(null); setError(null); }} style={{
              flex: 1, padding: "12px 16px", borderRadius: 11, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, transition: "all 0.2s",
              background: activeTab === tab.key
                ? `linear-gradient(135deg, ${C.primary}, #8B5CF6)`
                : "transparent",
              color: activeTab === tab.key ? C.text : C.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Topic Discovery */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Discover Topics</h3>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 16px" }}>Not sure what to learn? Get AI-suggested topics for your instrument and level.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Instrument</label>
              <select value={topicInstrument} onChange={e => setTopicInstrument(e.target.value)} style={selectStyle}>
                {INSTRUMENTS.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Difficulty</label>
              <select value={topicDifficulty} onChange={e => setTopicDifficulty(e.target.value)} style={selectStyle}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={handleFetchTopics} disabled={loadingTopics} style={{
                padding: "12px 20px", borderRadius: 12, border: `1px solid ${C.secondary}`,
                background: `${C.secondary}26`, color: C.secondary,
                fontSize: 14, fontWeight: 600, cursor: loadingTopics ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}>
                {loadingTopics ? "Loading..." : "Get Topics"}
              </button>
            </div>
          </div>
          {suggestedTopics.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", animation: "aiLessonsFadeIn 0.3s ease" }}>
              {suggestedTopics.map((t, i) => {
                const topicText = typeof t === "string" ? t : t.topic || t.title || t.name;
                return (
                  <TopicChip key={i} topic={topicText} onClick={() => {
                    if (activeTab === "lesson") setLessonForm(f => ({ ...f, topic: topicText }));
                    else setExerciseForm(f => ({ ...f, topic: topicText }));
                    addToast({ type: "info", message: `Topic "${topicText}" selected` });
                  }} />
                );
              })}
            </div>
          )}
        </div>

        {/* Generation Form */}
        <div style={cardStyle}>
          {activeTab === "lesson" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>📖</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Generate a Lesson</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Topic *</label>
                  <input
                    type="text" required placeholder="e.g. Chord progressions in jazz"
                    value={lessonForm.topic} onChange={e => setLessonForm(f => ({ ...f, topic: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.glassBorder}
                  />
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={labelStyle}>Difficulty</label>
                    <select value={lessonForm.difficulty} onChange={e => setLessonForm(f => ({ ...f, difficulty: e.target.value }))} style={selectStyle}>
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={labelStyle}>Instrument</label>
                    <select value={lessonForm.instrument} onChange={e => setLessonForm(f => ({ ...f, instrument: e.target.value }))} style={selectStyle}>
                      {INSTRUMENTS.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={labelStyle}>Lesson Type</label>
                    <select value={lessonForm.lesson_type} onChange={e => setLessonForm(f => ({ ...f, lesson_type: e.target.value }))} style={selectStyle}>
                      {LESSON_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGenerateLesson} disabled={generating} style={{
                  ...btnPrimary,
                  opacity: generating ? 0.7 : 1,
                  cursor: generating ? "not-allowed" : "pointer",
                  animation: !generating ? "aiLessonsGlow 3s ease-in-out infinite" : "none",
                }}>
                  {generating ? "Generating..." : "✨ Generate Lesson"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>✏️</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Generate an Exercise</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Topic *</label>
                  <input
                    type="text" required placeholder="e.g. Major scale finger patterns"
                    value={exerciseForm.topic} onChange={e => setExerciseForm(f => ({ ...f, topic: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.glassBorder}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Skill Level</label>
                  <select value={exerciseForm.skill_level} onChange={e => setExerciseForm(f => ({ ...f, skill_level: e.target.value }))} style={selectStyle}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <button onClick={handleGenerateExercise} disabled={generating} style={{
                  ...btnPrimary,
                  background: `linear-gradient(135deg, ${C.secondary}, ${C.neon})`,
                  opacity: generating ? 0.7 : 1,
                  cursor: generating ? "not-allowed" : "pointer",
                  animation: !generating ? "aiLessonsGlow 3s ease-in-out infinite" : "none",
                }}>
                  {generating ? "Generating..." : "⚡ Generate Exercise"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loading */}
        {generating && (
          <div style={cardStyle}>
            <AIAnimation />
          </div>
        )}

        {/* Error */}
        {error && !generating && (
          <div style={{
            ...cardStyle, borderColor: "rgba(255,59,48,0.3)",
            background: "rgba(255,59,48,0.08)",
            animation: "aiLessonsFadeIn 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#FF3B30", margin: 0 }}>Generation Failed</p>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: "0 0 16px" }}>{error}</p>
            <button onClick={() => activeTab === "lesson" ? handleGenerateLesson() : handleGenerateExercise()} style={{
              padding: "10px 20px", borderRadius: 10, border: `1px solid ${C.primary}`,
              background: `${C.primary}26`, color: C.primary,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>🔄 Retry</button>
          </div>
        )}

        {/* Generated Content */}
        {generated && !generating && (
          <div style={{ ...cardStyle, animation: "aiLessonsFadeIn 0.5s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${C.success}33, ${C.neon}33)`,
                  border: `1px solid ${C.success}4D`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>✅</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.success }}>Generated Successfully</span>
              </div>
              <button onClick={handleCopy} style={{
                padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.glassBorder}`,
                background: C.surface, color: C.textSecondary, fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>

            {title && (
              <h2 style={{
                fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 20px",
                background: `linear-gradient(135deg, ${C.text}, ${C.secondary})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{title}</h2>
            )}

            {content && (
              <div style={{
                padding: "20px 24px", background: C.surface, border: `1px solid ${C.glassBorder}`,
                borderRadius: 14, marginBottom: 20,
              }}>
                <ContentRenderer content={content} />
              </div>
            )}

            <StepsRenderer steps={steps} />
            <TipsRenderer tips={tips} />

            {!content && !steps && !tips && (
              <pre style={{
                fontSize: 13, color: C.textSecondary, background: "rgba(0,0,0,0.3)",
                padding: 16, borderRadius: 12, overflow: "auto", margin: 0, lineHeight: 1.6,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {JSON.stringify(generatedData, null, 2)}
              </pre>
            )}

            {courseId && (
              <button onClick={() => navigate(`/courses/${courseId}`)} style={{
                marginTop: 20, padding: "10px 20px", borderRadius: 10,
                border: `1px solid ${C.glassBorder}`, background: C.surface,
                color: C.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>← Back to Course</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
