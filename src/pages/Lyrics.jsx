import { useState, useEffect, useRef } from "react";
import { lyricsApi } from "../api/lyricsApi";
import { useToast } from "../context/ToastContext";

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
  borderFocus: "rgba(232, 168, 56, 0.3)",
  success: "#6DBF73",
  warning: "#D4A84A",
  error: "#D46A6A",
};

const inputStyle = {
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
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  colorScheme: "dark",
};

const cardStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 24,
  marginBottom: 20,
};

const btnBase = {
  border: "none",
  borderRadius: 10,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
  color: C.text,
};

const lyricsToString = (lyrics) => {
  if (!lyrics) return "";
  if (typeof lyrics === "string") return lyrics;
  if (Array.isArray(lyrics)) {
    return lyrics
      .map((s) => {
        const header = s.section_name ? `[${s.section_name}]\n` : "";
        const lines = Array.isArray(s.lines) ? s.lines.join("\n") : s.text || s.content || "";
        return header + lines;
      })
      .join("\n\n");
  }
  return lyrics.text || lyrics.content || JSON.stringify(lyrics);
};

const SectionTitle = ({ children }) => (
  <h2 style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>{children}</h2>
);

const MetaTag = ({ label, value, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
    <span style={{ color: C.textMuted, fontSize: 13, minWidth: 100 }}>{label}</span>
    <span style={{ color: color || C.textSecondary, fontSize: 14, fontWeight: 500 }}>{value}</span>
  </div>
);

const Spinner = () => (
  <span style={{
    display: "inline-block", width: 14, height: 14,
    border: `2px solid rgba(12, 10, 20, 0.3)`, borderTopColor: C.ink,
    borderRadius: "50%", animation: "spin 0.6s linear infinite", marginRight: 8,
  }} />
);

const focusProps = (e) => {
  e.target.style.borderColor = C.borderFocus;
  e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.06)";
};
const blurProps = (e) => {
  e.target.style.borderColor = C.border;
  e.target.style.boxShadow = "none";
};

export default function Lyrics() {
  const { addToast } = useToast();
  const lyricsRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("English");

  const [generatedLyrics, setGeneratedLyrics] = useState(null);
  const [improveInstruction, setImproveInstruction] = useState("make it more emotional");
  const [formatType, setFormatType] = useState("text");
  const [formattedLyrics, setFormattedLyrics] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingImprove, setLoadingImprove] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [gRes, mRes] = await Promise.all([lyricsApi.getGenres(), lyricsApi.getMoods()]);
        setGenres(gRes.data ?? gRes ?? []);
        setMoods(mRes.data ?? mRes ?? []);
      } catch {
        addToast({ type: "error", message: "Failed to load genres/moods" });
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, [addToast]);

  const handleGenerate = async () => {
    if (!topic.trim()) return addToast({ type: "warning", message: "Please enter a topic" });
    setLoadingGen(true);
    setAnalysis(null);
    setFormattedLyrics(null);
    try {
      const res = await lyricsApi.generate({ topic, genre, mood, language });
      const data = res.data ?? res;
      setGeneratedLyrics(data);
      addToast({ type: "success", message: "Lyrics generated!" });
    } catch (err) {
      addToast({ type: "error", message: err.response?.data?.message || err.message || "Generation failed" });
    } finally {
      setLoadingGen(false);
    }
  };

  const handleImprove = async () => {
    if (!generatedLyrics) return;
    setLoadingImprove(true);
    try {
      const lyricsText = lyricsToString(generatedLyrics.lyrics || generatedLyrics.text);
      const res = await lyricsApi.improve({ lyrics: lyricsText, instruction: improveInstruction });
      const data = res.data ?? res;
      setGeneratedLyrics((prev) => ({
        ...prev,
        ...(data.lyrics ? { lyrics: data.lyrics } : {}),
        ...(data.text ? { text: data.text } : {}),
        ...(data.title ? { title: data.title } : {}),
      }));
      addToast({ type: "success", message: "Lyrics improved!" });
    } catch (err) {
      addToast({ type: "error", message: err.response?.data?.message || err.message || "Improve failed" });
    } finally {
      setLoadingImprove(false);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedLyrics) return;
    setLoadingAnalyze(true);
    try {
      const lyricsText = lyricsToString(generatedLyrics.lyrics || generatedLyrics.text);
      const res = await lyricsApi.analyze({ lyrics: lyricsText });
      setAnalysis(res.data ?? res);
      addToast({ type: "success", message: "Analysis complete!" });
    } catch (err) {
      addToast({ type: "error", message: err.response?.data?.message || err.message || "Analysis failed" });
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const handleFormat = async () => {
    if (!generatedLyrics) return;
    setLoadingFormat(true);
    try {
      const res = await lyricsApi.format({ lyrics_data: generatedLyrics, format_type: formatType });
      setFormattedLyrics(res.data ?? res);
      addToast({ type: "success", message: "Lyrics formatted!" });
    } catch (err) {
      addToast({ type: "error", message: err.response?.data?.message || err.message || "Format failed" });
    } finally {
      setLoadingFormat(false);
    }
  };

  const handleCopy = () => {
    const text = lyricsToString(generatedLyrics?.lyrics || generatedLyrics?.text);
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => addToast({ type: "success", message: "Copied to clipboard!" }),
      () => addToast({ type: "error", message: "Copy failed" })
    );
  };

  const handleClear = () => {
    setTopic(""); setGenre(""); setMood(""); setLanguage("English");
    setGeneratedLyrics(null); setFormattedLyrics(null); setAnalysis(null);
    setImproveInstruction("make it more emotional"); setFormatType("text");
  };

  const lyricsText = lyricsToString(generatedLyrics?.lyrics || generatedLyrics?.text);

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80, position: "relative" }}>
      {/* Ambient creative workspace light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 20%, rgba(199, 125, 186, 0.04), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>
            Lyrics <span style={{ color: C.raga }}>Generator</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
            AI-powered lyrics creation, analysis, and formatting
          </p>
        </div>

        {/* Input Form */}
        <div style={cardStyle}>
          <SectionTitle>Generate Lyrics</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: C.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Topic</label>
              <input
                type="text"
                placeholder="e.g. Moonlight over the river"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={inputStyle}
                onFocus={focusProps}
                onBlur={blurProps}
              />
            </div>
            <div>
              <label style={{ color: C.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Genre</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} style={selectStyle} disabled={loadingMeta}>
                <option value="">Select Genre</option>
                {genres.map((g) => (
                  <option key={typeof g === "string" ? g : g.id} value={typeof g === "string" ? g : g.name || g.id}>
                    {typeof g === "string" ? g : g.name || g.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: C.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)} style={selectStyle} disabled={loadingMeta}>
                <option value="">Select Mood</option>
                {moods.map((m) => (
                  <option key={typeof m === "string" ? m : m.id} value={typeof m === "string" ? m : m.name || m.id}>
                    {typeof m === "string" ? m : m.name || m.id}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: C.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={inputStyle}
                onFocus={focusProps}
                onBlur={blurProps}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleGenerate}
              disabled={loadingGen}
              style={{
                ...btnBase,
                background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                color: C.ink,
                opacity: loadingGen ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 12px rgba(232, 168, 56, 0.15)",
              }}
            >
              {loadingGen && <Spinner />}
              {loadingGen ? "Generating..." : "Generate Lyrics"}
            </button>
            <button onClick={handleClear} style={{ ...btnBase, background: C.elevated, border: `1px solid ${C.border}` }}>
              Clear
            </button>
          </div>
        </div>

        {/* Generated Lyrics */}
        {generatedLyrics && (
          <>
            <div style={cardStyle} ref={lyricsRef}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionTitle>{generatedLyrics.title || "Generated Lyrics"}</SectionTitle>
                <button onClick={handleCopy} style={{ ...btnBase, background: C.elevated, border: `1px solid ${C.border}`, padding: "8px 16px", fontSize: 13 }}>
                  Copy
                </button>
              </div>
              <div style={{
                background: C.ink,
                borderRadius: 10,
                padding: 20,
                marginBottom: 16,
                whiteSpace: "pre-wrap",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 14,
                lineHeight: 1.7,
                color: C.text,
                maxHeight: 400,
                overflowY: "auto",
                border: `1px solid ${C.border}`,
              }}>
                {lyricsText}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {generatedLyrics.rhyme_scheme && <MetaTag label="Rhyme Scheme" value={generatedLyrics.rhyme_scheme} />}
                {generatedLyrics.word_count != null && <MetaTag label="Word Count" value={generatedLyrics.word_count} />}
                {generatedLyrics.suggested_tempo && <MetaTag label="Suggested Tempo" value={`${generatedLyrics.suggested_tempo} BPM`} color={C.teal} />}
                {generatedLyrics.suggested_key && <MetaTag label="Suggested Key" value={generatedLyrics.suggested_key} color={C.teal} />}
              </div>
            </div>

            {/* Improve */}
            <div style={cardStyle}>
              <SectionTitle>Improve Lyrics</SectionTitle>
              <input
                type="text"
                placeholder="e.g. make it more emotional"
                value={improveInstruction}
                onChange={(e) => setImproveInstruction(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
                onFocus={focusProps}
                onBlur={blurProps}
              />
              <button
                onClick={handleImprove}
                disabled={loadingImprove}
                style={{
                  ...btnBase,
                  background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                  color: C.ink,
                  opacity: loadingImprove ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 2px 12px rgba(91, 168, 160, 0.15)",
                }}
              >
                {loadingImprove && <Spinner />}
                {loadingImprove ? "Improving..." : "Improve Lyrics"}
              </button>
            </div>

            {/* Analyze */}
            <div style={cardStyle}>
              <SectionTitle>Analyze Lyrics</SectionTitle>
              <button
                onClick={handleAnalyze}
                disabled={loadingAnalyze}
                style={{
                  ...btnBase,
                  background: `${C.raga}18`,
                  color: C.raga,
                  border: `1px solid ${C.raga}30`,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {loadingAnalyze && <Spinner />}
                {loadingAnalyze ? "Analyzing..." : "Analyze Lyrics"}
              </button>
              {analysis && (
                <div style={{ background: C.ink, borderRadius: 10, padding: 20, border: `1px solid ${C.border}` }}>
                  {typeof analysis === "string" ? (
                    <pre style={{ color: C.text, fontSize: 14, margin: 0, whiteSpace: "pre-wrap" }}>{analysis}</pre>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {Object.entries(analysis).map(([key, val]) => (
                        <div key={key}>
                          <span style={{ color: C.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                            {key.replace(/_/g, " ")}
                          </span>
                          <div style={{ color: C.textSecondary, fontSize: 14, marginTop: 4 }}>
                            {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Format */}
            <div style={cardStyle}>
              <SectionTitle>Format Lyrics</SectionTitle>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <select
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value)}
                  style={{ ...selectStyle, width: "auto", minWidth: 140 }}
                >
                  <option value="text">Plain Text</option>
                  <option value="chords">Chords</option>
                  <option value="lrc">LRC</option>
                </select>
                <button
                  onClick={handleFormat}
                  disabled={loadingFormat}
                  style={{
                    ...btnBase,
                    background: `${C.saffron}15`,
                    color: C.saffron,
                    border: `1px solid ${C.saffron}25`,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {loadingFormat && <Spinner />}
                  {loadingFormat ? "Formatting..." : "Format Lyrics"}
                </button>
              </div>
              {formattedLyrics && (
                <div style={{
                  background: C.ink,
                  borderRadius: 10,
                  padding: 20,
                  whiteSpace: "pre-wrap",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: C.text,
                  maxHeight: 300,
                  overflowY: "auto",
                  border: `1px solid ${C.border}`,
                }}>
                  {typeof formattedLyrics === "string"
                    ? formattedLyrics
                    : formattedLyrics.formatted || formattedLyrics.text || JSON.stringify(formattedLyrics, null, 2)}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
