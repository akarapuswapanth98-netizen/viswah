import { useState, useEffect, useCallback, useRef } from "react";
import { indianMusicApi } from "../api/indianMusicApi";
import { useToast } from "../context/ToastContext";
import { onKeyDown } from "../utils/keyboard";

const COLORS = {
  primary: "#6C63FF",
  secondary: "#4ECDC4",
  neon: "#00FF88",
  background: "#0F0F23",
  surface: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  secondaryText: "#B0B0CC",
  mutedText: "#6B6B8D",
  success: "#34C759",
};

const NOTE_FREQS = {
  Sa: 261.63,
  Re: 293.66,
  "Re♭": 277.18,
  "Re#": 311.13,
  Ga: 329.63,
  "Ga♭": 311.13,
  "Ga#": 349.23,
  Ma: 349.23,
  "Ma♭": 329.63,
  "Ma#": 369.99,
  Pa: 392.00,
  Dha: 440.00,
  "Dha♭": 415.30,
  "Dha#": 466.16,
  Ni: 493.88,
  "Ni♭": 466.16,
  "Ni#": 523.25,
  "Sa'": 523.25,
};

const WESTERN_MAP = {
  Sa: "C",
  Re: "D",
  Ga: "E",
  Ma: "F",
  Pa: "G",
  Dha: "A",
  Ni: "B",
  "Sa'": "C'",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.background,
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  title: {
    color: COLORS.text,
    fontSize: "2rem",
    marginBottom: "4px",
    fontWeight: 700,
  },
  subtitle: {
    color: COLORS.secondaryText,
    marginBottom: "24px",
    fontSize: "0.95rem",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  panel: {
    background: COLORS.glass,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  panelTitle: {
    color: COLORS.neon,
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "16px",
  },
  notesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
    gap: "10px",
  },
  noteBtn: {
    padding: "16px 8px",
    borderRadius: "12px",
    border: `2px solid ${COLORS.glassBorder}`,
    background: COLORS.surface,
    color: COLORS.text,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
  },
  noteBtnActive: {
    background: `${COLORS.primary}33`,
    borderColor: COLORS.primary,
    boxShadow: `0 0 24px ${COLORS.primary}44`,
    transform: "scale(1.05)",
  },
  noteBtnHover: {
    borderColor: COLORS.primary,
    background: `${COLORS.primary}15`,
  },
  noteSargam: {
    fontSize: "1.3rem",
    fontWeight: 700,
    display: "block",
    marginBottom: "4px",
  },
  noteWestern: {
    fontSize: "0.75rem",
    color: COLORS.mutedText,
    fontWeight: 600,
  },
  scaleContainer: {
    position: "relative",
    height: "80px",
    background: COLORS.surface,
    borderRadius: "12px",
    border: `1px solid ${COLORS.glassBorder}`,
    marginBottom: "16px",
    overflow: "hidden",
  },
  scaleTrack: {
    position: "absolute",
    top: "50%",
    left: "20px",
    right: "20px",
    height: "2px",
    background: COLORS.glassBorder,
    transform: "translateY(-50%)",
  },
  scaleNote: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    background: COLORS.surface,
    border: `2px solid ${COLORS.glassBorder}`,
    color: COLORS.secondaryText,
    cursor: "pointer",
    transition: "all 0.2s",
    zIndex: 1,
  },
  scaleNoteActive: {
    background: `${COLORS.primary}44`,
    borderColor: COLORS.primary,
    color: COLORS.primary,
    boxShadow: `0 0 16px ${COLORS.primary}44`,
    transform: "translate(-50%, -50%) scale(1.2)",
  },
  scaleLabel: {
    position: "absolute",
    bottom: "6px",
    fontSize: "0.6rem",
    color: COLORS.mutedText,
    transform: "translateX(-50%)",
  },
  patternSection: {
    background: COLORS.glass,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  patternGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  patternCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "12px",
    padding: "16px",
  },
  patternLabel: {
    color: COLORS.neon,
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "10px",
  },
  patternChain: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  patternNote: {
    padding: "5px 12px",
    borderRadius: "8px",
    background: COLORS.glass,
    border: `1px solid ${COLORS.glassBorder}`,
    color: COLORS.text,
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  patternNoteActive: {
    background: `${COLORS.secondary}33`,
    borderColor: COLORS.secondary,
    color: COLORS.secondary,
  },
  infoPanel: {
    background: COLORS.glass,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  infoCard: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "10px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  infoEmoji: {
    fontSize: "1.5rem",
  },
  infoName: {
    color: COLORS.text,
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  infoDetail: {
    color: COLORS.mutedText,
    fontSize: "0.78rem",
  },
  skeleton: {
    background: `linear-gradient(90deg, ${COLORS.surface} 25%, ${COLORS.glass} 50%, ${COLORS.surface} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: "10px",
    animation: "shimmer 1.5s infinite",
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
    background: COLORS.primary,
    color: COLORS.text,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: COLORS.mutedText,
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "1rem",
    color: COLORS.secondaryText,
  },
  volumeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: COLORS.glass,
    border: `1px solid ${COLORS.glassBorder}`,
    borderRadius: "10px",
    padding: "10px 16px",
    marginBottom: "20px",
  },
  volumeLabel: {
    color: COLORS.secondaryText,
    fontSize: "0.85rem",
  },
};

const SARGAM_NOTES = [
  { name: "Sa", octave: 0, variant: "" },
  { name: "Re♭", octave: 0, variant: "komal" },
  { name: "Re", octave: 0, variant: "shuddha" },
  { name: "Re#", octave: 0, variant: "tivra" },
  { name: "Ga", octave: 0, variant: "shuddha" },
  { name: "Ga♭", octave: 0, variant: "komal" },
  { name: "Ma", octave: 0, variant: "shuddha" },
  { name: "Ma#", octave: 0, variant: "tivra" },
  { name: "Pa", octave: 0, variant: "shuddha" },
  { name: "Dha♭", octave: 0, variant: "komal" },
  { name: "Dha", octave: 0, variant: "shuddha" },
  { name: "Dha#", octave: 0, variant: "tivra" },
  { name: "Ni", octave: 0, variant: "shuddha" },
  { name: "Ni♭", octave: 0, variant: "komal" },
  { name: "Sa'", octave: 1, variant: "upper" },
];

const SCALE_NOTES = [
  { name: "Sa", label: "Sa", western: "C" },
  { name: "Re", label: "Re", western: "D" },
  { name: "Ga", label: "Ga", western: "E" },
  { name: "Ma", label: "Ma", western: "F" },
  { name: "Pa", label: "Pa", western: "G" },
  { name: "Dha", label: "Dha", western: "A" },
  { name: "Ni", label: "Ni", western: "B" },
  { name: "Sa'", label: "Sa'", western: "C'" },
];

function NoteScale({ activeNote, onNoteClick }) {
  return (
    <div style={styles.scaleContainer}>
      <div style={styles.scaleTrack} />
      {SCALE_NOTES.map((note, i) => {
        const pct = (i / (SCALE_NOTES.length - 1)) * 100;
        const left = `calc(20px + (100% - 40px) * ${i / (SCALE_NOTES.length - 1)})`;
        const isActive = activeNote === note.name;
        return (
          <div key={note.name} style={{ position: "absolute", left, top: 0, bottom: 0 }}>
            <div
              tabIndex={0}
              role="button"
              onClick={() => onNoteClick(note.name)}
              onKeyDown={(e) => onKeyDown(e, () => onNoteClick(note.name))}
              style={{
                ...styles.scaleNote,
                ...(isActive ? styles.scaleNoteActive : {}),
                left: "0",
              }}
            >
              {note.label}
            </div>
            <div style={{ ...styles.scaleLabel, left: "0", whiteSpace: "nowrap" }}>
              {note.western}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Sargam() {
  const { addToast } = useToast();
  const [sargamData, setSargamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [volume, setVolume] = useState(0.6);
  const audioCtxRef = useRef(null);
  const activeOscRef = useRef(null);
  const noteTimeoutRef = useRef(null);

  const fetchSargam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indianMusicApi.getSargam();
      setSargamData(res.data?.data || res.data || null);
    } catch (err) {
      setError(err.message || "Failed to load sargam data");
      addToast({ type: "error", message: "Failed to load sargam data" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSargam();
  }, [fetchSargam]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback((noteName) => {
    const ctx = getAudioCtx();
    if (activeOscRef.current) {
      try { activeOscRef.current.osc.stop(); } catch (e) {}
      activeOscRef.current = null;
    }

    const cleanName = noteName.replace(/[♭#']/g, "").replace(/[""]/g, "");
    const freq = NOTE_FREQS[noteName] || NOTE_FREQS[cleanName] || 261.63;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);

    activeOscRef.current = { osc, gain };
    setActiveNote(noteName);
    noteTimeoutRef.current = setTimeout(() => setActiveNote(null), 1200);
  }, [getAudioCtx, volume]);

  const playPattern = useCallback(async (notes) => {
    if (!notes || notes.length === 0) return;
    for (let i = 0; i < notes.length; i++) {
      if (!audioCtxRef.current) break;
      playNote(notes[i]);
      await new Promise((r) => setTimeout(r, 450));
    }
  }, [playNote]);

  useEffect(() => {
    return () => {
      if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
      if (activeOscRef.current) {
        try { activeOscRef.current.osc.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const notes = sargamData?.notes || sargamData?.sargam_notes || SARGAM_NOTES;
  const arohana = sargamData?.arohana || sargamData?.ascending || ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", "Sa'"];
  const avarohana = sargamData?.avarohana || sargamData?.descending || ["Sa'", "Ni", "Dha", "Pa", "Ma", "Ga", "Re", "Sa"];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Sargam</h1>
        <p style={styles.subtitle}>Interactive learning for Indian musical notes</p>

        <div style={styles.volumeRow}>
          <span style={styles.volumeLabel}>Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            style={{ width: "120px", accentColor: COLORS.primary }}
          />
          <span style={{ color: COLORS.mutedText, fontSize: "0.8rem", minWidth: "32px" }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p>{error}</p>
            <button onClick={fetchSargam} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        {loading && !error && (
          <>
            <div style={styles.mainGrid}>
              <div style={styles.panel}>
                <div style={styles.panelTitle}>Notes</div>
                <div style={styles.notesGrid}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ ...styles.skeleton, height: "72px", borderRadius: "12px" }} />
                  ))}
                </div>
              </div>
              <div style={styles.panel}>
                <div style={styles.panelTitle}>Scale</div>
                <div style={{ ...styles.skeleton, height: "80px", borderRadius: "12px" }} />
              </div>
            </div>
          </>
        )}

        {!loading && !error && (
          <>
            <div style={styles.mainGrid}>
              <div style={styles.panel}>
                <div style={styles.panelTitle}>Indian Notes (Swaras)</div>
                <div style={styles.notesGrid}>
                  {notes.map((note) => {
                    const name = note.name || note;
                    const western = note.western || WESTERN_MAP[name] || "";
                    const isActive = activeNote === name;
                    return (
                      <div
                        key={name}
                        tabIndex={0}
                        role="button"
                        onClick={() => playNote(name)}
                        onKeyDown={(e) => onKeyDown(e, () => playNote(name))}
                        style={{
                          ...styles.noteBtn,
                          ...(isActive ? styles.noteBtnActive : {}),
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = COLORS.primary;
                            e.currentTarget.style.background = `${COLORS.primary}15`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = COLORS.glassBorder;
                            e.currentTarget.style.background = COLORS.surface;
                          }
                        }}
                      >
                        <span style={styles.noteSargam}>{name}</span>
                        <span style={styles.noteWestern}>{western}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.panel}>
                <div style={styles.panelTitle}>Scale Visualization</div>
                <NoteScale activeNote={activeNote} onNoteClick={playNote} />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                  <button
                    onClick={() => playPattern(arohana)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${COLORS.neon}44`,
                      background: `${COLORS.neon}15`,
                      color: COLORS.neon,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      transition: "all 0.2s",
                    }}
                  >
                    ▶ Play Arohana
                  </button>
                  <button
                    onClick={() => playPattern(avarohana)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: `1px solid ${COLORS.secondary}44`,
                      background: `${COLORS.secondary}15`,
                      color: COLORS.secondary,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      transition: "all 0.2s",
                    }}
                  >
                    ▶ Play Avarohana
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.patternSection}>
              <div style={styles.panelTitle}>Ascending & Descending Patterns</div>
              <div style={styles.patternGrid}>
                <div style={styles.patternCard}>
                  <div style={styles.patternLabel}>▲ Arohana (Ascending)</div>
                  <div style={styles.patternChain}>
                    {(Array.isArray(arohana) ? arohana : []).map((n, i) => {
                      const clean = typeof n === "string" ? n : n.name || n;
                      const isActive = activeNote === clean;
                      return (
                        <span
                          key={i}
                          onClick={() => playNote(clean)}
                          style={{
                            ...styles.patternNote,
                            ...(isActive ? styles.patternNoteActive : {}),
                          }}
                        >
                          {clean}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={styles.patternCard}>
                  <div style={styles.patternLabel}>▼ Avarohana (Descending)</div>
                  <div style={styles.patternChain}>
                    {(Array.isArray(avarohana) ? avarohana : []).map((n, i) => {
                      const clean = typeof n === "string" ? n : n.name || n;
                      const isActive = activeNote === clean;
                      return (
                        <span
                          key={i}
                          onClick={() => playNote(clean)}
                          style={{
                            ...styles.patternNote,
                            ...(isActive ? styles.patternNoteActive : {}),
                          }}
                        >
                          {clean}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.infoPanel, marginTop: "20px" }}>
              <div style={styles.panelTitle}>Swaras Reference</div>
              <div style={styles.infoGrid}>
                {[
                  { emoji: "🎹", name: "Sa (Shadja)", detail: "Root note · C · tonic" },
                  { emoji: "🎵", name: "Re (Rishabh)", detail: "Major 2nd · D" },
                  { emoji: "🎶", name: "Ga (Gandhar)", detail: "Major 3rd · E" },
                  { emoji: "🎶", name: "Ma (Madhyam)", detail: "Perfect 4th · F" },
                  { emoji: "🎹", name: "Pa (Pancham)", detail: "Perfect 5th · G" },
                  { emoji: "🎵", name: "Dha (Dhaivat)", detail: "Major 6th · A" },
                  { emoji: "🎶", name: "Ni (Nishad)", detail: "Major 7th · B" },
                  { emoji: "🎹", name: "Sa' (Upper Sa)", detail: "Octave · C' · 261.63 Hz" },
                ].map((item) => (
                  <div key={item.name} style={styles.infoCard}>
                    <span style={styles.infoEmoji}>{item.emoji}</span>
                    <div>
                      <div style={styles.infoName}>{item.name}</div>
                      <div style={styles.infoDetail}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
