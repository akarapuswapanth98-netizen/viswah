import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { worldMusicApi } from "../api/worldMusicApi";
import { onKeyDown } from "../utils/keyboard";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  floating: "#2A2344",
  saffron: "#E8A838",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  success: "#6DBF73",
  warning: "#D4A84A",
};

function ComparisonColumn({ tradition, index }) {
  if (!tradition) return null;
  return (
    <div style={{
      flex: "1 1 0",
      minWidth: 260,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>
          {tradition.name}
        </h3>
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>{tradition.region}</p>
      </div>

      {/* Sections */}
      <div style={{ padding: "16px 24px" }}>
        {/* Difficulty */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Difficulty</p>
          <span style={{
            fontSize: 13, fontWeight: 500, padding: "3px 10px", borderRadius: 8,
            background: tradition.difficulty === "beginner" ? `${C.success}15` : tradition.difficulty === "advanced" ? `${C.warning}15` : `${C.teal}15`,
            color: tradition.difficulty === "beginner" ? C.success : tradition.difficulty === "advanced" ? C.warning : C.teal,
          }}>
            {tradition.difficulty}
          </span>
        </div>

        {/* Instruments */}
        {tradition.instruments && tradition.instruments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Instruments</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tradition.instruments.map((inst, i) => (
                <span key={i} style={{
                  fontSize: 12, color: C.textSecondary, background: `${C.saffron}10`,
                  padding: "3px 10px", borderRadius: 6,
                }}>{inst}</span>
              ))}
            </div>
          </div>
        )}

        {/* Scales */}
        {tradition.scales_or_modes && tradition.scales_or_modes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Scales / Modes</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tradition.scales_or_modes.map((scale, i) => (
                <span key={i} style={{
                  fontSize: 12, color: C.textSecondary, background: `${C.raga}10`,
                  padding: "3px 10px", borderRadius: 6,
                }}>{scale}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rhythms */}
        {tradition.rhythmic_concepts && tradition.rhythmic_concepts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Rhythmic Concepts</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tradition.rhythmic_concepts.map((r, i) => (
                <span key={i} style={{
                  fontSize: 12, color: C.textSecondary, background: `${C.teal}10`,
                  padding: "3px 10px", borderRadius: 6,
                }}>{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Vocal concepts */}
        {tradition.vocal_concepts && tradition.vocal_concepts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Vocal Concepts</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tradition.vocal_concepts.map((v, i) => (
                <span key={i} style={{
                  fontSize: 12, color: C.textSecondary, background: `${C.raga}10`,
                  padding: "3px 10px", borderRadius: 6,
                }}>{v}</span>
              ))}
            </div>
          </div>
        )}

        {/* Characteristics */}
        {tradition.characteristics && tradition.characteristics.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" }}>Characteristics</p>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {tradition.characteristics.map((c, i) => (
                <li key={i} style={{ color: C.textSecondary, fontSize: 13, marginBottom: 4, lineHeight: 1.4 }}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Explore link */}
        <button
          tabIndex={0}
          role="button"
          onClick={() => navigate(`/world-music/${tradition.id}`)}
          onKeyDown={(e) => onKeyDown(e, () => navigate(`/world-music/${tradition.id}`))}
          style={{
            width: "100%", padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.teal}30`,
            background: "transparent", color: C.teal, fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${C.teal}12`; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          Explore {tradition.name} →
        </button>
      </div>
    </div>
  );
}

export default function WorldMusicComparison() {
  const navigate = useNavigate();
  const [traditions, setTraditions] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchTraditions = async () => {
      try {
        const res = await worldMusicApi.getTraditions();
        const data = res.data ?? res;
        setTraditions(data.traditions || []);
      } catch (err) {
        setError(err.message || "Failed to load traditions");
      } finally {
        setLoading(false);
      }
    };
    fetchTraditions();
  }, []);

  const handleCompare = async () => {
    if (selected.length < 2) return;
    try {
      const ids = selected.join(",");
      const res = await worldMusicApi.compare(ids);
      setComparison(res.data ?? res);
    } catch (err) {
      setError(err.message || "Failed to compare traditions");
    }
  };

  const toggleTradition = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  if (loading) {
    return (
      <div style={{ background: C.ink, padding: "0 20px", paddingBottom: 60 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 40 }}>
          <div style={{ height: 40, borderRadius: 14, background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 80, borderRadius: 14, background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.ink, minHeight: "100vh", padding: "0 20px", paddingBottom: 60 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", paddingTop: 40 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>
            Compare <span style={{ color: C.teal }}>Traditions</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
            Select 2–4 traditions to compare side by side
          </p>
        </div>

        {/* Tradition selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {traditions.map((t) => {
              const isSelected = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTradition(t.id)}
                  style={{
                    padding: "8px 16px", borderRadius: 10,
                    border: `1px solid ${isSelected ? C.teal : C.border}`,
                    background: isSelected ? `${C.teal}15` : C.surface,
                    color: isSelected ? C.teal : C.textSecondary,
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          {selected.length >= 2 && (
            <button
              onClick={handleCompare}
              style={{
                marginTop: 12, padding: "10px 24px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                color: C.ink, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Compare ({selected.length})
            </button>
          )}
        </div>

        {/* Comparison results */}
        {comparison && comparison.traditions && (
          <div style={{
            display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16,
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease-out 0.2s",
          }}>
            {comparison.traditions.map((t, i) => (
              <ComparisonColumn key={t.id} tradition={t} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!comparison && selected.length < 2 && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: "48px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>🌍</div>
            <p style={{ color: C.textSecondary, fontSize: 16, margin: "0 0 8px" }}>
              Select at least 2 traditions to compare
            </p>
            <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
              You can compare up to 4 traditions at once
            </p>
          </div>
        )}

        {error && (
          <div style={{
            background: C.surface, border: `1px solid ${C.warning}30`,
            borderRadius: 14, padding: "16px 20px", marginTop: 16,
          }}>
            <p style={{ color: C.warning, fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
