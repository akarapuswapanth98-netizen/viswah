import { useState, useEffect, useCallback } from "react";
import { indianMusicApi } from "../api/indianMusicApi";
import { useToast } from "../context/ToastContext";
import { onKeyDown } from "../utils/keyboard";

import C from "../components/ui/colors";

const styles = {
  page: {
    minHeight: "100vh",
    background: C.ink,
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    color: C.text,
    fontSize: "2rem",
    marginBottom: "4px",
    fontWeight: 700,
  },
  subtitle: {
    color: C.textSecondary,
    marginBottom: "24px",
    fontSize: "0.95rem",
  },
  backBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: `1px solid ${C.glassBorder}`,
    background: C.surfaceGlass,
    color: C.textSecondary,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "all 0.2s",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
  card: {
    background: C.surfaceGlass,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: "14px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.25s ease",
    position: "relative",
  },
  cardHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 8px 32px rgba(232,168,56,0.2)",
    borderColor: C.primary,
  },
  cardName: {
    color: C.text,
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: "10px",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
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
  cardDesc: {
    marginTop: "8px",
    color: C.textSecondary,
    fontSize: "0.82rem",
    lineHeight: "1.4",
  },
  detailPanel: {
    background: C.surfaceGlass,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  detailName: {
    color: C.text,
    fontSize: "1.8rem",
    fontWeight: 700,
    marginBottom: "4px",
  },
  detailMeta: {
    color: C.textSecondary,
    fontSize: "0.95rem",
    marginBottom: "24px",
  },
  statRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  statCard: {
    flex: "1 1 120px",
    background: C.surface,
    border: `1px solid ${C.glassBorder}`,
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  statNumber: {
    color: C.neon,
    fontSize: "1.6rem",
    fontWeight: 700,
    marginBottom: "4px",
  },
  statLabel: {
    color: C.textMuted,
    fontSize: "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  sectionTitle: {
    color: C.neon,
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "12px",
    marginTop: "24px",
  },
  bolPattern: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "16px",
  },
  bolChip: {
    padding: "6px 14px",
    borderRadius: "8px",
    background: C.surface,
    border: `1px solid ${C.glassBorder}`,
    color: C.text,
    fontSize: "0.85rem",
    fontWeight: 600,
    minWidth: "36px",
    textAlign: "center",
  },
  bolSam: {
    background: `${C.primary}33`,
    border: `2px solid ${C.primary}`,
    color: C.primary,
    fontWeight: 700,
  },
  bolKhali: {
    background: `${C.secondary}22`,
    border: `1px dashed ${C.secondary}`,
    color: C.secondary,
  },
  cycleContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 0",
  },
  cycleRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "8px",
  },
  beatCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: 700,
    border: `2px solid ${C.glassBorder}`,
    background: C.surface,
    color: C.textSecondary,
    transition: "all 0.2s",
  },
  beatSam: {
    background: `${C.primary}44`,
    borderColor: C.primary,
    color: C.primary,
    boxShadow: `0 0 16px ${C.primary}44`,
    width: "52px",
    height: "52px",
  },
  beatKhali: {
    background: "transparent",
    borderColor: C.textMuted,
    color: C.textMuted,
    borderStyle: "dashed",
  },
  beatStress: {
    background: `${C.neon}22`,
    borderColor: C.neon,
    color: C.neon,
  },
  cycleLegend: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: C.textSecondary,
    fontSize: "0.8rem",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  usageText: {
    color: C.textSecondary,
    fontSize: "0.9rem",
    lineHeight: "1.6",
  },
  skeleton: {
    background: `linear-gradient(90deg, ${C.surface} 25%, ${C.surfaceGlass} 50%, ${C.surface} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: "10px",
    animation: "shimmer 1.5s infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: C.textMuted,
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "1rem",
    color: C.textSecondary,
  },
  errorBox: {
    background: "rgba(255,69,58,0.1)",
    border: "1px solid rgba(255,69,58,0.3)",
    borderRadius: "12px",
    padding: "20px",
    color: "#FF453A",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: "12px",
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    background: C.primary,
    color: C.text,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
};

function SkeletonCard() {
  return (
    <div style={{ ...styles.card, cursor: "default" }}>
      <div style={{ ...styles.skeleton, height: "24px", width: "50%", marginBottom: "14px" }} />
      <div style={{ ...styles.skeleton, height: "14px", width: "30%", marginBottom: "10px" }} />
      <div style={{ ...styles.skeleton, height: "14px", width: "70%", marginBottom: "10px" }} />
      <div style={{ ...styles.skeleton, height: "14px", width: "40%" }} />
    </div>
  );
}

function TalaCycle({ beats, samPosition, khaliPosition, bolPattern }) {
  const total = beats || 16;
  const sam = samPosition || 0;
  const khali = khaliPosition != null ? khaliPosition : Math.floor(total / 2);
  const bols = bolPattern || [];

  return (
    <div style={styles.cycleContainer}>
      <div style={styles.cycleRow}>
        {Array.from({ length: total }).map((_, i) => {
          let beatStyle = { ...styles.beatCircle };
          if (i === sam) beatStyle = { ...beatStyle, ...styles.beatSam };
          else if (i === khali) beatStyle = { ...beatStyle, ...styles.beatKhali };
          else if (bols[i] && (bols[i].includes("*") || bols[i].includes("X"))) beatStyle = { ...beatStyle, ...styles.beatStress };

          return (
            <div key={i} style={beatStyle} title={`Beat ${i + 1}${i === sam ? " (Sam)" : i === khali ? " (Khali)" : ""}`}>
              {i + 1}
            </div>
          );
        })}
      </div>
      <div style={styles.cycleLegend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: C.primary }} />
          <span>Sam (downbeat)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: "transparent", border: `2px dashed ${C.textMuted}` }} />
          <span>Khali (empty)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: C.neon }} />
          <span>Stressed beat</span>
        </div>
      </div>
    </div>
  );
}

export default function Talas() {
  const { addToast } = useToast();
  const [talas, setTalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const fetchTalas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indianMusicApi.getTalas();
      setTalas(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load talas");
      addToast({ type: "error", message: "Failed to load talas" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTalas();
  }, [fetchTalas]);

  const handleSelect = (tala) => {
    setSelectedId(tala.id || tala._id);
    setDetail(tala);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Talas</h1>
        <p style={styles.subtitle}>Master the rhythmic cycles of Indian classical music</p>

        {selectedId && (
          <button onClick={() => { setSelectedId(null); setDetail(null); }} style={styles.backBtn}>
            ← Back to All Talas
          </button>
        )}

        {selectedId && detailLoading && (
          <div style={styles.detailPanel}>
            <div style={{ ...styles.skeleton, height: "32px", width: "200px", marginBottom: "12px" }} />
            <div style={{ ...styles.skeleton, height: "16px", width: "300px", marginBottom: "20px" }} />
          </div>
        )}

        {selectedId && detail && !detailLoading && (
          <div style={styles.detailPanel}>
            <div style={styles.detailName}>{detail.name}</div>
            <div style={styles.detailMeta}>
              {detail.description || "A rhythmic cycle in Indian classical music"}
            </div>

            <div style={styles.statRow}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{detail.beats || detail.matras || "?"}</div>
                <div style={styles.statLabel}>Beats (Matras)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{detail.vibhags || detail.sections || "?"}</div>
                <div style={styles.statLabel}>Vibhags (Sections)</div>
              </div>
              {detail.bol_pattern && (
                <div style={styles.statCard}>
                  <div style={{ ...styles.statNumber, fontSize: "1rem" }}>
                    {Array.isArray(detail.bol_pattern) ? detail.bol_pattern[0] : (detail.bol_pattern || "").split(",")[0]?.trim()}
                  </div>
                  <div style={styles.statLabel}>Sam (Start)</div>
                </div>
              )}
            </div>

            <div style={styles.sectionTitle}>Visual Cycle</div>
            <TalaCycle
              beats={detail.beats || detail.matras}
              samPosition={detail.sam_position || detail.samPosition || 0}
              khaliPosition={detail.khali_position || detail.khaliPosition}
              bolPattern={detail.bol_pattern}
            />

            {detail.bol_pattern && (
              <>
                <div style={styles.sectionTitle}>Bol Pattern</div>
                <div style={styles.bolPattern}>
                  {(Array.isArray(detail.bol_pattern) ? detail.bol_pattern : detail.bol_pattern.split(/[\s,]+/)).map((bol, i) => {
                    const clean = bol.replace(/[*X]/g, "").trim();
                    const isSam = i === 0;
                    const isKhali = i === Math.floor((detail.beats || detail.matras || 16) / 2);
                    return (
                      <span
                        key={i}
                        style={{
                          ...styles.bolChip,
                          ...(isSam ? styles.bolSam : {}),
                          ...(isKhali ? styles.bolKhali : {}),
                        }}
                      >
                        {clean || bol}
                      </span>
                    );
                  })}
                </div>
              </>
            )}

            {detail.sam_position != null && (
              <>
                <div style={styles.sectionTitle}>Sam Position</div>
                <p style={styles.usageText}>
                  The Sam (downbeat) is at beat {detail.sam_position + 1}. This is where the tala cycle begins and where performers typically emphasize the most important rhythmic resolution.
                </p>
              </>
            )}

            {detail.khali_position != null && (
              <>
                <div style={styles.sectionTitle}>Khali Position</div>
                <p style={styles.usageText}>
                  The Khali (empty beat) is at beat {detail.khali_position + 1}. This represents the "empty" or "open" section of the cycle, traditionally marked by a wave of the hand or a lighter stroke.
                </p>
              </>
            )}

            {(detail.usage || detail.notes) && (
              <>
                <div style={styles.sectionTitle}>Usage Notes</div>
                <p style={styles.usageText}>{detail.usage || detail.notes}</p>
              </>
            )}
          </div>
        )}

        {!selectedId && (
          <>
            {error && (
              <div style={styles.errorBox}>
                <p>{error}</p>
                <button onClick={fetchTalas} style={styles.retryBtn}>Retry</button>
              </div>
            )}

            {!error && loading && (
              <div style={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!error && !loading && talas.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🥁</div>
                <p style={styles.emptyText}>No talas found</p>
              </div>
            )}

            {!error && !loading && talas.length > 0 && (
              <div style={styles.grid}>
                {talas.map((tala) => {
                  const id = tala.id || tala._id;
                  const isHovered = hoveredCard === id;
                  return (
                    <div
                      key={id}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleSelect(tala)}
                      onKeyDown={(e) => onKeyDown(e, () => handleSelect(tala))}
                      onMouseEnter={() => setHoveredCard(id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{ ...styles.card, ...(isHovered ? styles.cardHover : {}) }}
                    >
                      <div style={styles.cardName}>{tala.name}</div>
                      <div style={styles.cardRow}>
                        <span style={styles.cardLabel}>Beats</span>
                        <span style={{ color: C.neon, fontWeight: 700, fontSize: "0.9rem" }}>
                          {tala.beats || tala.matras || "?"}
                        </span>
                      </div>
                      <div style={styles.cardRow}>
                        <span style={styles.cardLabel}>Vibhags</span>
                        <span style={styles.cardValue}>{tala.vibhags || tala.sections || "?"}</span>
                      </div>
                      {tala.description && (
                        <div style={styles.cardDesc}>
                          {tala.description.length > 80 ? tala.description.slice(0, 80) + "..." : tala.description}
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
