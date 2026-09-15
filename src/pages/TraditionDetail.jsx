import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { worldMusicApi } from "../api/worldMusicApi";
import { onKeyDown } from "../utils/keyboard";
import C from "../components/ui/colors";

const REGION_COLORS = {
  south_asia: C.primary,
  middle_east: C.raga,
  east_asia: C.secondary,
  southeast_asia: "#6DBF73",
  africa: "#D4A84A",
  europe: "#5B8EC7",
  north_america: C.primaryMuted,
  latin_america: C.error,
};

const FAMILY_ICONS = {
  strings: "\uD83C\uDFB6",
  percussion: "\uD83C\uDFB5",
  winds: "\uD83C\uDF43",
  keyboards: "\uD83C\uDFB9",
  voice: "\uD83C\uDFA4",
};

function SkeletonDetail() {
  const sk = {
    background: `linear-gradient(90deg, ${C.surface} 25%, ${C.elevated} 50%, ${C.surface} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: 8,
    animation: "shimmer 1.5s infinite",
  };
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
      <div style={{ ...sk, height: 32, width: 250, marginBottom: 12 }} />
      <div style={{ ...sk, height: 16, width: 350, marginBottom: 20 }} />
      <div style={{ ...sk, height: 14, width: "100%", marginBottom: 8 }} />
      <div style={{ ...sk, height: 14, width: "80%", marginBottom: 8 }} />
      <div style={{ ...sk, height: 14, width: "60%" }} />
    </div>
  );
}

export default function TraditionDetail() {
  const { traditionId } = useParams();
  const navigate = useNavigate();
  const [tradition, setTradition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchTradition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await worldMusicApi.getTradition(traditionId);
      setTradition(data);
    } catch (err) {
      setError(err.message || "Failed to load tradition");
    } finally {
      setLoading(false);
    }
  }, [traditionId]);

  useEffect(() => { fetchTradition(); }, [fetchTradition]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 20 }}>
          <SkeletonDetail />
        </div>
      </div>
    );
  }

  if (error || !tradition) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>{error || "Tradition not found"}</p>
          <button onClick={() => navigate("/world-music")} style={{
            padding: "10px 24px", borderRadius: 10, border: "none",
            background: C.primary, color: C.ink, fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>Back to World Music</button>
        </div>
      </div>
    );
  }

  const regionColor = REGION_COLORS[tradition.region] || C.primary;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 70% 10%, ${regionColor}08, transparent 70%)`,
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px", position: "relative", zIndex: 1 }}>
        {/* Back */}
        <button
          onClick={() => navigate("/world-music")}
          style={{
            padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`,
            background: C.surface, color: C.textSecondary, cursor: "pointer", fontSize: 13, fontWeight: 500,
            marginBottom: 20, transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = regionColor + "40"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
        >← Back to World Music</button>

        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{
              background: `${regionColor}15`,
              color: regionColor,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}>{tradition.region?.replace(/_/g, " ")}</span>
            <span style={{
              background: tradition.difficulty === "beginner" ? `${C.success}15` : tradition.difficulty === "advanced" ? `${C.warning}15` : `${C.secondary}15`,
              color: tradition.difficulty === "beginner" ? C.success : tradition.difficulty === "advanced" ? C.warning : C.secondary,
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}>{tradition.difficulty}</span>
          </div>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{tradition.name}</h1>
          {tradition.country_or_area && (
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>{tradition.country_or_area}</p>
          )}
        </div>

        {/* Overview */}
        <section style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
        }}>
          <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Overview</h2>
          <p style={{ color: C.textSecondary, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{tradition.description}</p>
        </section>

        {/* Key Characteristics */}
        {tradition.characteristics && tradition.characteristics.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>What Makes This Tradition Distinctive</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {tradition.characteristics.map((char, i) => (
                <li key={i} style={{
                  color: C.textSecondary,
                  fontSize: 14,
                  lineHeight: 1.6,
                  padding: "6px 0",
                  borderBottom: i < tradition.characteristics.length - 1 ? `1px solid ${C.border}` : "none",
                  display: "flex",
                  gap: 10,
                }}>
                  <span style={{ color: regionColor, flexShrink: 0 }}>•</span>
                  {char}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Instruments */}
        {tradition.instruments_detail && tradition.instruments_detail.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Instruments</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {tradition.instruments_detail.map((inst) => (
                <div key={inst.id} style={{
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{FAMILY_ICONS[inst.family] || "\uD83C\uDFB5"}</span>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{inst.name}</span>
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: "0 0 4px" }}>{inst.role}</p>
                  <p style={{ color: C.textSecondary, fontSize: 12, margin: 0, lineHeight: 1.4 }}>{inst.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scales & Modes */}
        {tradition.scales_detail && tradition.scales_detail.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Scales & Modes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {tradition.scales_detail.map((scale) => (
                <div key={scale.id} style={{
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 14,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{scale.name}</span>
                    {scale.equivalent && (
                      <span style={{ color: C.textMuted, fontSize: 12 }}>≈ {scale.equivalent}</span>
                    )}
                  </div>
                  <p style={{ color: C.textSecondary, fontSize: 12, margin: 0, lineHeight: 1.4 }}>{scale.description}</p>
                  {scale.notes && scale.notes.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                      {scale.notes.map((note, i) => (
                        <span key={i} style={{
                          background: i === 0 ? `${regionColor}18` : C.surface,
                          color: i === 0 ? regionColor : C.textSecondary,
                          border: `1px solid ${i === 0 ? regionColor + "35" : C.border}`,
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: i === 0 ? 700 : 500,
                        }}>{note}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rhythmic Concepts */}
        {tradition.rhythms_detail && tradition.rhythms_detail.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Rhythm</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {tradition.rhythms_detail.map((rhythm) => (
                <div key={rhythm.id} style={{
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: 12,
                }}>
                  <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{rhythm.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ color: regionColor, fontSize: 18, fontWeight: 700 }}>{rhythm.beats}</span>
                    <span style={{ color: C.textMuted, fontSize: 11 }}>beats</span>
                  </div>
                  <p style={{ color: C.textSecondary, fontSize: 11, margin: "6px 0 0", lineHeight: 1.3 }}>{rhythm.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vocal Concepts */}
        {tradition.vocal_concepts && tradition.vocal_concepts.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Vocal Traditions</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tradition.vocal_concepts.map((vc, i) => (
                <span key={i} style={{
                  background: `${regionColor}10`,
                  border: `1px solid ${regionColor}25`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: regionColor,
                  fontSize: 13,
                  fontWeight: 500,
                }}>{vc}</span>
              ))}
            </div>
          </section>
        )}

        {/* Terminology */}
        {tradition.terminology && tradition.terminology.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Musical Vocabulary</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tradition.terminology.map((term, i) => (
                <div key={i} style={{
                  background: C.elevated,
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: regionColor, fontSize: 13, fontWeight: 700 }}>{term.term}</span>
                  <span style={{ color: C.textSecondary, fontSize: 13, marginLeft: 8 }}>{term.definition}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Traditions */}
        {tradition.related_traditions_detail && tradition.related_traditions_detail.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Related Traditions</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {tradition.related_traditions_detail.map((rel) => {
                const relColor = REGION_COLORS[rel.region] || C.primary;
                return (
                  <div
                    key={rel.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => navigate(`/world-music/${rel.id}`)}
                    onKeyDown={(e) => onKeyDown(e, () => navigate(`/world-music/${rel.id}`))}
                    style={{
                      background: C.elevated,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "10px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = relColor + "40";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <span style={{ color: relColor, fontSize: 13, fontWeight: 600 }}>{rel.name}</span>
                    <span style={{ color: C.textMuted, fontSize: 12 }}>→</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Practice Actions */}
        {tradition.available_practice_routes && tradition.available_practice_routes.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Practice This Tradition</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tradition.available_practice_routes.map((route, i) => {
                const labels = {
                  "/ragas": { label: "Explore Ragas", icon: "\uD83C\uDFB5" },
                  "/talas": { label: "Explore Talas", icon: "\uD83C\uDFB6" },
                  "/sargam": { label: "Practice Sargam", icon: "\uD83C\uDFBC" },
                  "/vocal-guru": { label: "Vocal Guru", icon: "\uD83C\uDFA4" },
                  "/piano": { label: "Piano Practice", icon: "\uD83C\uDFB9" },
                  "/drums": { label: "Drum Practice", icon: "\uD83C\uDFB5" },
                  "/metronome": { label: "Metronome", icon: "\u23F1" },
                };
                const info = labels[route] || { label: route, icon: "\uD83C\uDFB5" };
                return (
                  <div
                    key={route}
                    tabIndex={0}
                    role="button"
                    onClick={() => navigate(route)}
                    onKeyDown={(e) => onKeyDown(e, () => navigate(route))}
                    style={{
                      background: C.elevated,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = regionColor + "40";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{info.icon}</span>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{info.label}</span>
                    <span style={{ color: C.textMuted, fontSize: 13, marginLeft: "auto" }}>→</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Learning Path */}
        {tradition.learning_topics && tradition.learning_topics.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ color: regionColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Learning Topics</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tradition.learning_topics.map((topic, i) => (
                <span key={i} style={{
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: C.textSecondary,
                  fontSize: 13,
                }}>{topic.replace(/_/g, " ")}</span>
              ))}
            </div>
          </section>
        )}

        {/* AI Coach CTA */}
        <section style={{
          background: `linear-gradient(135deg, ${C.elevated}, ${C.surface})`,
          border: `1px solid ${C.secondary}25`,
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
        }}>
          <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Want personalized guidance?</p>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 16px" }}>AI Coach can recommend exercises based on your exploration</p>
          <button
            onClick={() => navigate("/ai-coach")}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${C.secondary}, ${C.secondary}CC)`,
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(91, 168, 160, 0.2)",
            }}
          >Open AI Coach</button>
        </section>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
