import { useState, useEffect, useRef } from "react";
import { indianMusicApi } from "../api/indianMusicApi";
import { useToast } from "../context/ToastContext";

import C from "../components/ui/colors";

const cardStyle = {
  background: C.surfaceGlass,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};

const btnBase = {
  border: "none",
  borderRadius: 12,
  padding: "12px 24px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
  color: C.text,
};

const timeSignatures = [
  { label: "2/4", beats: 2 },
  { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 },
  { label: "6/8", beats: 6 },
];

const beatKeyframes = `
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes beatPulse {
  0% { filter: drop-shadow(0 0 6px ${C.primary}44); }
  50% { filter: drop-shadow(0 0 18px ${C.primary}88); }
  100% { filter: drop-shadow(0 0 6px ${C.primary}44); }
}
`;

export default function Metronome() {
  const { addToast } = useToast();

  const [talas, setTalas] = useState([]);
  const [selectedTala, setSelectedTala] = useState(null);

  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMobile, setIsMobile] = useState(false);

  const audioCtxRef = useRef(null);
  const nextBeatTimeRef = useRef(0);
  const timerRef = useRef(null);
  const beatCountRef = useRef(0);
  const beatCountRefForReset = useRef(0);

  const tapTimesRef = useRef([]);
  const activeNodesRef = useRef([]);
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const startTimeoutRef = useRef(null);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch talas
  useEffect(() => {
    const fetchTalas = async () => {
      try {
        const res = await indianMusicApi.getTalas();
        setTalas(res.data ?? res ?? []);
      } catch {
        addToast({ type: "error", message: "Failed to load talas" });
      }
    };
    fetchTalas();
  }, [addToast]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playClick = (time, isAccent) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = isAccent ? 1000 : 800;
    const vol = volumeRef.current * (isAccent ? 1.0 : 0.6);
    gain.gain.setValueAtTime(Math.max(vol, 0.001), time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);

    activeNodesRef.current.push({ osc, gain });
    osc.onended = () => {
      activeNodesRef.current = activeNodesRef.current.filter((n) => n.osc !== osc);
      try { gain.disconnect(); } catch {}
    };
  };

  const scheduleBeat = (time) => {
    const beat = beatCountRef.current % beatsPerMeasureRef.current;
    const isAccent = beat === 0;

    playClick(time, isAccent);

    const delay = Math.max(0, (time - getAudioCtx().currentTime) * 1000);
    setTimeout(() => {
      setCurrentBeat(isAccent ? 1 : beat + 1);
    }, delay);

    beatCountRef.current++;
  };

  const metronomeLoop = () => {
    const ctx = getAudioCtx();
    const secondsPerBeat = 60.0 / bpmRef.current;

    while (nextBeatTimeRef.current < ctx.currentTime + 0.1) {
      scheduleBeat(nextBeatTimeRef.current);
      nextBeatTimeRef.current += secondsPerBeat;
    }

    timerRef.current = requestAnimationFrame(metronomeLoop);
  };

  const startMetronome = () => {
    const ctx = getAudioCtx();
    beatCountRef.current = 0;
    beatCountRefForReset.current = 0;
    setCurrentBeat(0);
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);
    timerRef.current = requestAnimationFrame(metronomeLoop);
  };

  const stopMetronome = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    activeNodesRef.current.forEach(({ osc, gain }) => {
      try { osc.stop(); } catch {}
      try { gain.disconnect(); } catch {}
    });
    activeNodesRef.current = [];
    setIsPlaying(false);
    setCurrentBeat(0);
    beatCountRef.current = 0;
    beatCountRefForReset.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
      stopMetronome();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);

    // Keep only last 8 taps
    if (tapTimesRef.current.length > 8) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      const times = tapTimesRef.current;
      let totalDiff = 0;
      for (let i = 1; i < times.length; i++) {
        totalDiff += times[i] - times[i - 1];
      }
      const avgMs = totalDiff / (times.length - 1);
      const tapBpm = Math.round(60000 / avgMs);
      const clamped = Math.min(240, Math.max(40, tapBpm));
      setBpm(clamped);
    }
  };

  const handleBpmChange = (val) => {
    const n = parseInt(val, 10);
    if (!isNaN(n)) setBpm(Math.min(240, Math.max(40, n)));
  };

  const selectTala = (tala) => {
    setSelectedTala(tala);
    const beats = tala.beats || tala.matras || tala.beats_per_measure || 4;
    setBeatsPerMeasure(beats);
    if (tala.tempo || tala.default_bpm) {
      setBpm(tala.tempo || tala.default_bpm);
    }
    if (isPlaying) {
      stopMetronome();
      startTimeoutRef.current = setTimeout(startMetronome, 50);
    }
    addToast({ type: "info", message: `${tala.name || tala.tala_name} selected — ${beats} beats` });
  };

  const beatDots = Array.from({ length: beatsPerMeasure }, (_, i) => i);
  const ringSize = isMobile ? 220 : 280;
  const ringCx = ringSize / 2;
  const ringCy = ringSize / 2;
  const ringR = isMobile ? 90 : 120;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80 }}>
      <style>{beatKeyframes}</style>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px 0" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>
            Metronome
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>
            Precise timing with Web Audio API and Indian Tala support
          </p>
        </div>

        {/* Premium BPM Ring */}
        <div className="metronome-ring" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 20 }}>
          <svg
            key={`ring-${currentBeat}`}
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            style={{
              display: "block",
              margin: "0 auto",
              animation: isPlaying ? "beatPulse 0.3s ease-out" : "none",
            }}
          >
            <defs>
              <radialGradient id="ringInner" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor={C.elevated || C.surfaceGlass} />
                <stop offset="100%" stopColor={C.surface || C.ink} />
              </radialGradient>
              <filter id="glowNeon">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={C.neon} floodOpacity="0.8" />
              </filter>
              <filter id="glowPrimary">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={C.primary} floodOpacity="0.8" />
              </filter>
            </defs>
            <circle cx={ringCx} cy={ringCy} r={ringR} fill="none" stroke={C.glassBorder} strokeWidth="2" />
            <circle cx={ringCx} cy={ringCy} r={ringR - 2} fill="url(#ringInner)" />
            <ellipse cx={ringCx} cy={ringCy - ringR * 0.3} rx={ringR * 0.5} ry={ringR * 0.15} fill="white" opacity="0.03" />
            {beatDots.map((i) => {
              const angle = (i / beatsPerMeasure) * 2 * Math.PI - Math.PI / 2;
              const dx = ringCx + ringR * Math.cos(angle);
              const dy = ringCy + ringR * Math.sin(angle);
              const isActive = isPlaying && currentBeat === i + 1;
              const isAccent = i === 0;
              return (
                <circle
                  key={i}
                  cx={dx}
                  cy={dy}
                  r={isAccent ? 10 : 7}
                  fill={isActive ? (isAccent ? C.neon : C.primary) : C.glassBorder}
                  filter={isActive ? (isAccent ? "url(#glowNeon)" : "url(#glowPrimary)") : "none"}
                  style={{ transition: "all 0.05s ease-out" }}
                />
              );
            })}
            <text x={ringCx} y={ringCy - 8} textAnchor="middle" dominantBaseline="central" fill={C.text} fontSize="72" fontWeight="800" fontFamily="'SF Mono', 'Fira Code', monospace">
              {bpm}
            </text>
            <text x={ringCx} y={ringCy + 36} textAnchor="middle" dominantBaseline="central" fill={C.textMuted} fontSize="18">
              BPM
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={toggleMetronome}
            className="btn-depth btn-depth--primary"
            style={{
              ...btnBase,
              padding: "16px 48px",
              fontSize: 18,
              background: isPlaying ? C.error : C.neon,
              color: isPlaying ? C.text : C.ink,
            }}
          >
            {isPlaying ? "Stop" : "Start"}
          </button>
          <button
            onClick={handleTapTempo}
            className="btn-depth"
            style={{
              ...btnBase,
              background: C.surfaceGlass,
              border: `1px solid ${C.glassBorder}`,
            }}
          >
            Tap Tempo
          </button>
        </div>

        {/* Volume */}
        <div className="studio-surface">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: C.textSecondary, fontSize: 14, minWidth: 60 }}>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                appearance: "none",
                background: `linear-gradient(to right, ${C.textMuted}, ${C.secondary})`,
                outline: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ color: C.textMuted, fontSize: 13, minWidth: 36, textAlign: "right" }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* Time Signature */}
        <div className="studio-surface">
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Time Signature</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {timeSignatures.map((ts) => {
              const isActive = beatsPerMeasure === ts.beats && !selectedTala;
              return (
                <button
                  key={ts.label}
                  onClick={() => {
                    setSelectedTala(null);
                    setBeatsPerMeasure(ts.beats);
                    if (isPlaying) {
                      stopMetronome();
                      startTimeoutRef.current = setTimeout(startMetronome, 50);
                    }
                  }}
                  style={{
                    ...btnBase,
                    background: isActive ? C.primary : C.surfaceGlass,
                    border: `1px solid ${isActive ? C.primary : C.glassBorder}`,
                    minWidth: 64,
                    padding: "10px 16px",
                  }}
                >
                  {ts.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Indian Tala */}
        <div className="studio-surface">
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
            Indian Tala
          </h3>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 16px" }}>
            Select a tala to set beats and tempo
          </p>
          {talas.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 14 }}>Loading talas...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {talas.map((tala, idx) => {
                const name = tala.name || tala.tala_name || `Tala ${idx + 1}`;
                const beats = tala.beats || tala.matras || tala.beats_per_measure;
                const isSelected = selectedTala && (selectedTala.name || selectedTala.tala_name) === name;
                return (
                  <button
                    key={idx}
                    onClick={() => selectTala(tala)}
                    style={{
                      ...btnBase,
                      background: isSelected ? `${C.secondary}33` : C.surfaceGlass,
                      border: `1px solid ${isSelected ? C.secondary : C.glassBorder}`,
                      textAlign: "left",
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                    {beats && (
                      <span style={{ fontSize: 12, color: C.textMuted }}>{beats} beats</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
