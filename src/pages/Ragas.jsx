import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { indianMusicApi } from "../api/indianMusicApi";
import { useToast } from "../context/ToastContext";
import { onKeyDown } from "../utils/keyboard";

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

const styles = {
  page: {
    minHeight: "100vh",
    background: C.ink,
    padding: "20px",
    position: "relative",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  title: {
    color: C.text,
    fontSize: "2rem",
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    color: C.textMuted,
    marginBottom: 24,
    fontSize: "0.95rem",
  },
  controls: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchBox: {
    flex: "1 1 260px",
    maxWidth: 400,
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  backBtn: {
    padding: "10px 18px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.textSecondary,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "all 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 20,
    cursor: "pointer",
    transition: "all 0.25s ease",
    position: "relative",
    overflow: "hidden",
  },
  cardName: {
    color: C.text,
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: 10,
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    color: C.textMuted,
    fontSize: "0.8rem",
  },
  cardValue: {
    color: C.textSecondary,
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  detailPanel: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: 28,
    marginBottom: 24,
    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  detailName: {
    color: C.text,
    fontSize: "1.8rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  detailSubtitle: {
    color: C.textSecondary,
    fontSize: "0.95rem",
    marginBottom: 20,
  },
  sectionTitle: {
    color: C.saffron,
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  noteChain: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  noteChip: {
    padding: "5px 12px",
    borderRadius: 8,
    background: C.elevated,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  noteChipRoot: {
    padding: "5px 12px",
    borderRadius: 8,
    background: `${C.saffron}18`,
    border: `1px solid ${C.saffron}35`,
    color: C.saffron,
    fontSize: "0.85rem",
    fontWeight: 700,
  },
  description: {
    color: C.textSecondary,
    fontSize: "0.9rem",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  phraseChip: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: 8,
    background: `${C.teal}10`,
    border: `1px solid ${C.teal}25`,
    color: C.teal,
    fontSize: "0.85rem",
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 6,
  },
  skeleton: {
    background: `linear-gradient(90deg, ${C.surface} 25%, ${C.elevated} 50%, ${C.surface} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: 10,
    animation: "shimmer 1.5s infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: C.textMuted,
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: "1rem",
    color: C.textSecondary,
  },
  errorBox: {
    background: `${C.error}10`,
    border: `1px solid ${C.error}25`,
    borderRadius: 12,
    padding: 20,
    color: C.error,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: C.saffron,
    color: C.ink,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
};

function SkeletonCard() {
  return (
    <div style={{ ...styles.card, cursor: "default" }}>
      <div style={{ ...styles.skeleton, height: 24, width: "60%", marginBottom: 14 }} />
      <div style={{ ...styles.skeleton, height: 14, width: "40%", marginBottom: 10 }} />
      <div style={{ ...styles.skeleton, height: 14, width: "80%", marginBottom: 10 }} />
      <div style={{ ...styles.skeleton, height: 14, width: "50%" }} />
    </div>
  );
}

const getTimeBadgeStyle = (time) => {
  const t = (time || "").toLowerCase();
  if (t === "day" || t === "morning") return { background: `${C.saffron}15`, color: C.saffron };
  if (t === "night" || t === "evening") return { background: `${C.raga}15`, color: C.raga };
  return { background: `${C.teal}15`, color: C.teal };
};

export default function Ragas() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [ragas, setRagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [thaatFilter, setThaatFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchRagas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indianMusicApi.getRagas();
      const data = res.data ?? res;
      setRagas(data?.ragas || data?.data?.ragas || []);
    } catch (err) {
      setError(err.message || "Failed to load ragas");
      addToast({ type: "error", message: "Failed to load ragas" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchRagas(); }, [fetchRagas]);

  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true);
    try {
      const res = await indianMusicApi.getRaga(id);
      const data = res.data ?? res;
      setDetail(data?.data || data || {});
    } catch (err) {
      addToast({ type: "error", message: "Failed to load raga details" });
    } finally {
      setDetailLoading(false);
    }
  }, [addToast]);

  const handleSelect = (raga) => {
    setSelectedId(raga.id || raga._id);
    setDetail(null);
    fetchDetail(raga.id || raga._id);
  };

  const thaats = [...new Set(ragas.map((r) => r.thaat).filter(Boolean))];
  const timeOptions = ["Morning", "Afternoon", "Evening", "Night"];

  const filtered = ragas.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (r.name || "").toLowerCase().includes(q) ||
        (r.thaat || "").toLowerCase().includes(q) ||
        (r.mood || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (thaatFilter && r.thaat !== thaatFilter) return false;
    if (timeFilter) {
      const t = (r.time || "").toLowerCase();
      if (!t.includes(timeFilter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div style={styles.page}>
      {/* Ambient raga light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 70% 15%, rgba(199, 125, 186, 0.05), transparent 70%)`,
      }} />

      <div style={styles.container}>
        <h1 style={{
          ...styles.title,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <span style={{ color: C.raga }}>Ragas</span>
        </h1>
        <p style={styles.subtitle}>Explore the melodic framework of Indian classical music</p>

        {selectedId && (
          <button onClick={() => { setSelectedId(null); setDetail(null); }} style={styles.backBtn}>
            ← Back to All Ragas
          </button>
        )}

        {/* Detail panel — Loading */}
        {selectedId && detailLoading && (
          <div style={styles.detailPanel}>
            <div style={{ ...styles.skeleton, height: 32, width: 200, marginBottom: 12 }} />
            <div style={{ ...styles.skeleton, height: 16, width: 300, marginBottom: 20 }} />
            <div style={{ ...styles.skeleton, height: 14, width: 100, marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} style={{ ...styles.skeleton, height: 30, width: 40, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}

        {/* Detail panel — Active */}
        {selectedId && detail && !detailLoading && (
          <div style={styles.detailPanel}>
            {/* Top accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${C.raga}, ${C.saffron})`,
            }} />

            <div style={styles.detailName}>{detail.name}</div>
            <div style={styles.detailSubtitle}>
              {detail.thaat && `Thaat: ${detail.thaat}`}
              {detail.thaat && detail.time && " · "}
              {detail.time && `Time: ${detail.time}`}
            </div>

            {(detail.vadi || detail.samvadi) && (
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {detail.vadi && (
                  <span style={{ ...styles.badge, background: `${C.saffron}18`, color: C.saffron, border: `1px solid ${C.saffron}35` }}>
                    Vadi: {detail.vadi}
                  </span>
                )}
                {detail.samvadi && (
                  <span style={{ ...styles.badge, background: `${C.raga}18`, color: C.raga, border: `1px solid ${C.raga}35` }}>
                    Samvadi: {detail.samvadi}
                  </span>
                )}
              </div>
            )}

            {detail.mood && (
              <div style={{ marginBottom: 16 }}>
                <span style={styles.sectionTitle}>Mood</span>
                <p style={styles.description}>{detail.mood}</p>
              </div>
            )}

            {detail.arohana && (
              <>
                <div style={styles.sectionTitle}>Ascending (Arohana)</div>
                <div style={styles.noteChain}>
                  {(Array.isArray(detail.arohana) ? detail.arohana : (detail.arohana || "").split(/[\s,]+/)).map((n, i) => (
                    <span key={i} style={i === 0 ? styles.noteChipRoot : styles.noteChip}>{n}</span>
                  ))}
                </div>
              </>
            )}

            {detail.avarohana && (
              <>
                <div style={styles.sectionTitle}>Descending (Avarohana)</div>
                <div style={styles.noteChain}>
                  {(Array.isArray(detail.avarohana) ? detail.avarohana : (detail.avarohana || "").split(/[\s,]+/)).map((n, i) => (
                    <span key={i} style={i === 0 ? styles.noteChipRoot : styles.noteChip}>{n}</span>
                  ))}
                </div>
              </>
            )}

            {(detail.character || detail.description) && (
              <>
                <div style={styles.sectionTitle}>Character</div>
                <p style={styles.description}>{detail.character || detail.description}</p>
              </>
            )}

            {detail.key_phrases && detail.key_phrases.length > 0 && (
              <>
                <div style={styles.sectionTitle}>Key Phrases</div>
                <div>
                  {detail.key_phrases.map((phrase, i) => (
                    <span key={i} style={styles.phraseChip}>{phrase}</span>
                  ))}
                </div>
              </>
            )}

            {detail.phrases && detail.phrases.length > 0 && (
              <>
                <div style={styles.sectionTitle}>Characteristic Phrases</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {detail.phrases.map((phrase, i) => (
                    <div key={i} style={{
                      background: C.elevated, borderRadius: 8, padding: "10px 14px",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.text,
                      border: `1px solid ${C.border}`,
                    }}>
                      {phrase}
                    </div>
                  ))}
                </div>
              </>
            )}

            {detail.lessons && detail.lessons.length > 0 && (
              <>
                <div style={styles.sectionTitle}>Practice Guide</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {detail.lessons.map((lesson, i) => (
                    <div key={i} style={{
                      background: C.elevated, borderRadius: 10, padding: "14px 16px",
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          ...styles.badge,
                          background: lesson.difficulty === "beginner" ? `${C.success}15`
                            : lesson.difficulty === "intermediate" ? `${C.warning}15` : `${C.error}15`,
                          color: lesson.difficulty === "beginner" ? C.success
                            : lesson.difficulty === "intermediate" ? C.warning : C.error,
                          fontSize: "0.7rem",
                        }}>{lesson.difficulty}</span>
                        <span style={{ color: C.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                          {lesson.type}
                        </span>
                      </div>
                      {lesson.pattern && (
                        <div style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.text, lineHeight: 1.6,
                        }}>{lesson.pattern}</div>
                      )}
                      {lesson.description && (
                        <div style={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
                          {lesson.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {detail.notes_count !== undefined && (
              <>
                <div style={styles.sectionTitle}>Notes Used</div>
                <span style={{ color: C.textSecondary, fontSize: "0.9rem" }}>
                  {detail.notes_count} notes in this raga
                </span>
              </>
            )}

            {/* Begin Learning CTA */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => navigate(`/ragas/${selectedId}/learn`)}
                style={{
                  padding: "14px 32px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.raga}, ${C.raga}CC)`,
                  border: "none", color: "#fff", fontSize: "1rem", fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 4px 16px rgba(199, 125, 186, 0.2)",
                  width: "100%",
                }}
                onKeyDown={(e) => onKeyDown(e, () => navigate(`/ragas/${selectedId}/learn`))}
              >
                Begin Learning Journey →
              </button>
            </div>
          </div>
        )}

        {/* Grid view */}
        {!selectedId && (
          <>
            <div style={styles.controls}>
              <input
                type="text"
                placeholder="Search ragas by name, thaat, or mood..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchBox}
                onFocus={(e) => {
                  e.target.style.borderColor = C.borderFocus;
                  e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.06)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = C.border;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Thaat filter chips */}
            {thaats.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => setThaatFilter("")}
                  style={{
                    ...styles.backBtn,
                    background: !thaatFilter ? `${C.saffron}20` : C.surface,
                    borderColor: !thaatFilter ? C.saffron + "40" : C.border,
                    color: !thaatFilter ? C.saffron : C.textSecondary,
                    padding: "6px 14px",
                    fontSize: 12,
                  }}
                >All Thaats</button>
                {thaats.map((t) => (
                  <button
                    key={t}
                    onClick={() => setThaatFilter(thaatFilter === t ? "" : t)}
                    style={{
                      ...styles.backBtn,
                      background: thaatFilter === t ? `${C.saffron}20` : C.surface,
                      borderColor: thaatFilter === t ? C.saffron + "40" : C.border,
                      color: thaatFilter === t ? C.saffron : C.textSecondary,
                      padding: "6px 14px",
                      fontSize: 12,
                    }}
                  >{t}</button>
                ))}
              </div>
            )}

            {/* Time filter chips */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {timeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(timeFilter === t ? "" : t)}
                  style={{
                    ...styles.backBtn,
                    background: timeFilter === t ? `${C.raga}18` : C.surface,
                    borderColor: timeFilter === t ? C.raga + "35" : C.border,
                    color: timeFilter === t ? C.raga : C.textSecondary,
                    padding: "6px 14px",
                    fontSize: 12,
                  }}
                >{t}</button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
                <button onClick={fetchRagas} style={styles.retryBtn}>Retry</button>
              </div>
            )}

            {/* Loading skeleton */}
            {!error && loading && (
              <div style={styles.grid}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty state */}
            {!error && !loading && filtered.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🎵</div>
                <p style={styles.emptyText}>{search ? "No ragas match your search" : "No ragas found"}</p>
              </div>
            )}

            {/* Raga grid */}
            {!error && !loading && filtered.length > 0 && (
              <div style={styles.grid}>
                {filtered.map((raga, i) => {
                  const id = raga.id || raga._id;
                  const notesCount = raga.notes_count || raga.notesCount ||
                    (raga.arohana ? (Array.isArray(raga.arohana) ? raga.arohana.length : raga.arohana.split(/[\s,]+/).length) : null);
                  return (
                    <div
                      key={id}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleSelect(raga)}
                      onKeyDown={(e) => onKeyDown(e, () => handleSelect(raga))}
                      style={{
                        ...styles.card,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? "translateY(0)" : "translateY(12px)",
                        transition: `all 0.25s ease-out`,
                        transitionDelay: `${Math.min(i * 40, 200)}ms`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.borderColor = C.raga + "35";
                        e.currentTarget.style.boxShadow = "0 8px 32px rgba(199, 125, 186, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={styles.cardName}>{raga.name}</div>
                      {raga.thaat && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardLabel}>Thaat</span>
                          <span style={styles.cardValue}>{raga.thaat}</span>
                        </div>
                      )}
                      {raga.time && (
                        <div style={styles.cardRow}>
                          <span style={styles.cardLabel}>Time</span>
                          <span style={{ ...styles.badge, ...getTimeBadgeStyle(raga.time) }}>
                            {raga.time}
                          </span>
                        </div>
                      )}
                      {(raga.character || raga.description) && (
                        <div style={{ ...styles.cardLabel, marginTop: 8, lineHeight: 1.4, color: C.textSecondary, fontSize: "0.82rem" }}>
                          {(raga.character || raga.description || "").slice(0, 80)}{(raga.character || raga.description || "").length > 80 ? "..." : ""}
                        </div>
                      )}
                      {notesCount !== null && (
                        <div style={{ ...styles.cardRow, marginTop: 8 }}>
                          <span style={styles.cardLabel}>Notes</span>
                          <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.85rem" }}>{notesCount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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
