import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { onKeyDown } from "../utils/keyboard";

import C from "../components/ui/colors";

const BASE_FREQUENCIES = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63, F: 349.23,
  "F#": 369.99, G: 392.00, "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88,
};

const KEY_MAP = {
  a: { note: "C", isBlack: false }, w: { note: "C#", isBlack: true },
  s: { note: "D", isBlack: false }, e: { note: "D#", isBlack: true },
  d: { note: "E", isBlack: false }, f: { note: "F", isBlack: false },
  t: { note: "F#", isBlack: true }, g: { note: "G", isBlack: false },
  y: { note: "G#", isBlack: true }, h: { note: "A", isBlack: false },
  u: { note: "A#", isBlack: true }, j: { note: "B", isBlack: false },
  k: { note: "C", isBlack: false }, o: { note: "C#", isBlack: true },
  l: { note: "D", isBlack: false }, p: { note: "D#", isBlack: true },
  ";": { note: "E", isBlack: false },
};

const OCTAVE_OFFSETS = {
  a: 0, w: 0, s: 0, e: 0, d: 0,
  f: 0, t: 0, g: 0, y: 0, h: 0, u: 0, j: 0,
  k: 1, o: 1, l: 1, p: 1, ";": 1,
};

const EXERCISES = [
  {
    id: "piano_note_recognition",
    title: "Note Recognition",
    description: "Play the target note shown on screen",
    difficulty: "Beginner",
    type: "note_recognition",
    instructions: ["A note name will appear", "Play the matching piano key", "10 notes to complete"],
    generateTargets: () => {
      const notes = ["C", "D", "E", "F", "G", "A", "B"];
      return Array.from({ length: 10 }, () => ({
        note: notes[Math.floor(Math.random() * notes.length)],
        octave: 4,
      }));
    },
  },
  {
    id: "piano_c_major_scale",
    title: "C Major Scale (Ascending)",
    description: "Play the C major scale going up",
    difficulty: "Beginner",
    type: "scale",
    instructions: ["Play each note of the C major scale", "Go in ascending order", "8 notes total"],
    generateTargets: () => [
      { note: "C", octave: 4 }, { note: "D", octave: 4 }, { note: "E", octave: 4 },
      { note: "F", octave: 4 }, { note: "G", octave: 4 }, { note: "A", octave: 4 },
      { note: "B", octave: 4 }, { note: "C", octave: 5 },
    ],
  },
  {
    id: "piano_c_major_desc",
    title: "C Major Scale (Descending)",
    description: "Play the C major scale going down",
    difficulty: "Beginner",
    type: "scale",
    instructions: ["Start from high C", "Play each note descending", "8 notes total"],
    generateTargets: () => [
      { note: "C", octave: 5 }, { note: "B", octave: 4 }, { note: "A", octave: 4 },
      { note: "G", octave: 4 }, { note: "F", octave: 4 }, { note: "E", octave: 4 },
      { note: "D", octave: 4 }, { note: "C", octave: 4 },
    ],
  },
  {
    id: "piano_melody_ode",
    title: "Melody: Ode to Joy",
    description: "Play the famous Beethoven melody",
    difficulty: "Beginner",
    type: "melody",
    instructions: ["Follow the note sequence", "Play each note in order", "15 notes total"],
    generateTargets: () => [
      { note: "E", octave: 4 }, { note: "E", octave: 4 }, { note: "F", octave: 4 },
      { note: "G", octave: 4 }, { note: "G", octave: 4 }, { note: "F", octave: 4 },
      { note: "E", octave: 4 }, { note: "D", octave: 4 }, { note: "C", octave: 4 },
      { note: "C", octave: 4 }, { note: "D", octave: 4 }, { note: "E", octave: 4 },
      { note: "E", octave: 4 }, { note: "D", octave: 4 }, { note: "D", octave: 4 },
    ],
  },
  {
    id: "piano_melody_twinkle",
    title: "Melody: Twinkle Twinkle",
    description: "Play the classic melody",
    difficulty: "Beginner",
    type: "melody",
    instructions: ["Follow the note sequence", "Play each note in order", "14 notes total"],
    generateTargets: () => [
      { note: "C", octave: 4 }, { note: "C", octave: 4 }, { note: "G", octave: 4 },
      { note: "G", octave: 4 }, { note: "A", octave: 4 }, { note: "A", octave: 4 },
      { note: "G", octave: 4 }, { note: "F", octave: 4 }, { note: "F", octave: 4 },
      { note: "E", octave: 4 }, { note: "E", octave: 4 }, { note: "D", octave: 4 },
      { note: "D", octave: 4 }, { note: "C", octave: 4 },
    ],
  },
  {
    id: "piano_five_finger",
    title: "Five-Finger Pattern",
    description: "C-D-E-F-G and back down",
    difficulty: "Beginner",
    type: "sequence",
    instructions: ["Play the five-finger pattern", "Ascending then descending", "9 notes total"],
    generateTargets: () => [
      { note: "C", octave: 4 }, { note: "D", octave: 4 }, { note: "E", octave: 4 },
      { note: "F", octave: 4 }, { note: "G", octave: 4 }, { note: "F", octave: 4 },
      { note: "E", octave: 4 }, { note: "D", octave: 4 }, { note: "C", octave: 4 },
    ],
  },
];

function scoreToGrade(score) {
  if (score >= 90) return { letter: "A+", color: C.success, label: "Excellent" };
  if (score >= 80) return { letter: "A", color: C.success, label: "Great" };
  if (score >= 70) return { letter: "B", color: C.teal, label: "Good" };
  if (score >= 60) return { letter: "C", color: C.warning, label: "Fair" };
  return { letter: "D", color: C.error, label: "Needs Practice" };
}

function noteLabel(note, octave) {
  if (note.includes("#")) return `${note.replace("#", "\u266F")}${octave}`;
  return `${note}${octave}`;
}

export default function Piano() {
  const [octave, setOctave] = useState(4);
  const [sustain, setSustain] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const activeOscillators = useRef({});
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sustainTimeouts = useRef({});
  const [isMobile, setIsMobile] = useState(false);

  const [mode, setMode] = useState("free");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [targets, setTargets] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const { startSession, endSession } = usePracticeSession("piano");
  const { buttonClick, completion, error: errorTone } = useAudioFeedback();
  const practiceStartTime = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume;
    }
    if (audioContextRef.current.state === "suspended") audioContextRef.current.resume();
    return audioContextRef.current;
  }, [volume]);

  const getFrequency = useCallback((note, oct) => {
    return BASE_FREQUENCIES[note] * Math.pow(2, oct - 4);
  }, []);

  const playNote = useCallback((note, oct) => {
    const ctx = getAudioContext();
    const key = `${note}${oct}`;
    if (activeOscillators.current[key]) return;

    const freq = getFrequency(note, oct);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(volume * 0.15, now + 0.15);
    osc.connect(gain);
    gain.connect(gainNodeRef.current);
    osc.start(now);
    activeOscillators.current[key] = { osc, gain };
    setPressedKeys((prev) => new Set(prev).add(key));
  }, [getAudioContext, getFrequency, volume]);

  const stopNote = useCallback((note, oct) => {
    const key = `${note}${oct}`;
    const entry = activeOscillators.current[key];
    if (!entry) return;
    if (sustain) {
      clearTimeout(sustainTimeouts.current[key]);
      sustainTimeouts.current[key] = setTimeout(() => {
        const ctx = audioContextRef.current;
        if (!ctx) return;
        const now = ctx.currentTime;
        entry.gain.gain.cancelScheduledValues(now);
        entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
        entry.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        entry.osc.stop(now + 0.55);
        delete activeOscillators.current[key];
        setPressedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
      }, 300);
    } else {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
      entry.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      entry.osc.stop(now + 0.35);
      delete activeOscillators.current[key];
      setPressedKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [sustain]);

  const measureNote = useCallback((note, oct) => {
    if (!selectedExercise || currentIdx >= targets.length) return;
    const target = targets[currentIdx];
    const isCorrect = note === target.note && oct === target.octave;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      buttonClick();
    } else {
      setIncorrectCount((c) => c + 1);
      errorTone();
    }
    const nextIdx = currentIdx + 1;
    setCurrentIdx(nextIdx);

    if (nextIdx >= targets.length) {
      const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
      const total = targets.length;
      const accuracy = Math.round((finalCorrect / total) * 100);
      const score = Math.round(accuracy * 0.7 + 30);
      setResult({ score, accuracy, correct: finalCorrect, total, completed: true });
    }
  }, [selectedExercise, currentIdx, targets, correctCount, buttonClick, errorTone]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const mapping = KEY_MAP[e.key.toLowerCase()];
      if (!mapping) return;
      e.preventDefault();
      const oct = octave + OCTAVE_OFFSETS[e.key.toLowerCase()];
      playNote(mapping.note, oct);
      if (mode === "practice" && selectedExercise) {
        measureNote(mapping.note, oct);
      }
    };
    const handleKeyUp = (e) => {
      const mapping = KEY_MAP[e.key.toLowerCase()];
      if (!mapping) return;
      e.preventDefault();
      const oct = octave + OCTAVE_OFFSETS[e.key.toLowerCase()];
      stopNote(mapping.note, oct);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [octave, playNote, stopNote, mode, selectedExercise, currentIdx, targets, correctCount]);

  useEffect(() => {
    return () => {
      Object.values(activeOscillators.current).forEach(({ osc }) => {
        try { osc.stop(); } catch (e) {}
      });
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
  }, [volume]);

  const handleNoteClick = useCallback((note, oct) => {
    playNote(note, oct);
    if (mode === "practice" && selectedExercise) {
      measureNote(note, oct);
    }
  }, [playNote, mode, selectedExercise, measureNote]);

  const startExercise = useCallback((exercise) => {
    const t = exercise.generateTargets();
    setSelectedExercise(exercise);
    setTargets(t);
    setCurrentIdx(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setResult(null);
    setShowHint(false);
    setMode("practice");
    practiceStartTime.current = Date.now();
    startSession(exercise.id);
    buttonClick();
  }, [startSession, buttonClick]);

  const practiceAgain = useCallback(() => {
    if (selectedExercise) {
      const t = selectedExercise.generateTargets();
      setTargets(t);
      setCurrentIdx(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setResult(null);
      setShowHint(false);
      practiceStartTime.current = Date.now();
      startSession(selectedExercise.id);
    }
  }, [selectedExercise, startSession]);

  const saveAndReturn = useCallback(async () => {
    if (result) {
      await endSession({
        activityId: selectedExercise?.id || "piano_practice",
        score: result.score,
        completed: true,
        metadata: {
          exercise_type: selectedExercise?.type,
          exercise_id: selectedExercise?.id,
          difficulty: selectedExercise?.difficulty,
          correct_notes: result.correct,
          total_notes: result.total,
          accuracy: result.accuracy,
          incorrect_notes: incorrectCount,
        },
      });
      completion();
    }
    setMode("free");
    setSelectedExercise(null);
    setResult(null);
  }, [result, selectedExercise, incorrectCount, endSession, completion]);

  const exitPractice = useCallback(() => {
    setMode("free");
    setSelectedExercise(null);
    setResult(null);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const octaveCount = isMobile ? 1 : 2;
  const keys = [];
  const notePattern = [
    { note: "C", isBlack: false }, { note: "C#", isBlack: true },
    { note: "D", isBlack: false }, { note: "D#", isBlack: true },
    { note: "E", isBlack: false }, { note: "F", isBlack: false },
    { note: "F#", isBlack: true }, { note: "G", isBlack: false },
    { note: "G#", isBlack: true }, { note: "A", isBlack: false },
    { note: "A#", isBlack: true }, { note: "B", isBlack: false },
  ];
  for (let o = octave; o < octave + octaveCount; o++) {
    notePattern.forEach(({ note, isBlack }) => keys.push({ note, octave: o, isBlack }));
  }
  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  const blackKeyStyle = {
    position: "absolute", width: "3.5%", height: "60%",
    background: "#1a1a2e", borderRadius: "0 0 5px 5px",
    border: `1px solid ${C.border}`, zIndex: 2, cursor: "pointer",
    transition: "background 0.1s, box-shadow 0.1s",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "flex-end", paddingBottom: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.4)", userSelect: "none",
  };

  const getBlackKeyPosition = (idx) => {
    const offsets = [0.85, 1.9, 3.85, 4.9, 5.95];
    return `${(offsets[idx % 5] + Math.floor(idx / 5) * 7) * (100 / 14) + 0.3}%`;
  };

  const renderPianoKeys = () => (
    <div style={{
      background: C.elevated, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "24px 16px", position: "relative",
      height: "220px", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
    }}>
      {whiteKeys.map((k, i) => {
        const keyId = `${k.note}${k.octave}`;
        const isPressed = pressedKeys.has(keyId);
        const isTarget = mode === "practice" && currentIdx < targets.length
          && targets[currentIdx].note === k.note && targets[currentIdx].octave === k.octave;
        return (
          <div
            key={keyId}
            data-testid={`piano-key-${k.note}${k.octave}`}
            onMouseDown={() => handleNoteClick(k.note, k.octave)}
            onMouseUp={() => stopNote(k.note, k.octave)}
            onMouseLeave={() => stopNote(k.note, k.octave)}
            onTouchStart={(e) => { e.preventDefault(); handleNoteClick(k.note, k.octave); }}
            onTouchEnd={(e) => { e.preventDefault(); stopNote(k.note, k.octave); }}
            role="button"
            aria-label={`${k.note} ${k.octave}`}
            tabIndex={0}
            style={{
              position: "absolute",
              left: `${(i / whiteKeys.length) * 100}%`,
              width: `${100 / whiteKeys.length}%`,
              height: "100%",
              background: isPressed
                ? `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryMuted} 100%)`
                : isTarget
                ? `linear-gradient(180deg, ${C.teal}40 0%, ${C.teal}20 100%)`
                : "linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)",
              borderRadius: "0 0 6px 6px",
              border: `1px solid ${isPressed ? C.primary : isTarget ? C.teal : "#ccc"}`,
              borderRight: "1px solid #aaa",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "flex-end", paddingBottom: "12px",
              transition: "background 0.08s, transform 0.05s, border-color 0.15s",
              transform: isPressed ? "scaleY(0.97)" : "scaleY(1)",
              transformOrigin: "top",
              boxShadow: isPressed ? `0 0 20px ${C.primary}66` : isTarget ? `0 0 16px ${C.teal}33` : "0 4px 8px rgba(0,0,0,0.15)",
              userSelect: "none", zIndex: 1,
            }}
          >
            <span style={{ fontSize: "0.7rem", color: isTarget ? C.teal : "#555", fontWeight: 600 }}>
              {k.note}{k.octave}
            </span>
          </div>
        );
      })}
      {blackKeys.map((k, i) => {
        const keyId = `${k.note}${k.octave}`;
        const isPressed = pressedKeys.has(keyId);
        const isTarget = mode === "practice" && currentIdx < targets.length
          && targets[currentIdx].note === k.note && targets[currentIdx].octave === k.octave;
        return (
          <div
            key={keyId}
            data-testid={`piano-key-${k.note}${k.octave}`}
            onMouseDown={() => handleNoteClick(k.note, k.octave)}
            onMouseUp={() => stopNote(k.note, k.octave)}
            onMouseLeave={() => stopNote(k.note, k.octave)}
            onTouchStart={(e) => { e.preventDefault(); handleNoteClick(k.note, k.octave); }}
            onTouchEnd={(e) => { e.preventDefault(); stopNote(k.note, k.octave); }}
            role="button"
            aria-label={`${k.note} ${k.octave}`}
            tabIndex={0}
            style={{
              ...blackKeyStyle,
              left: getBlackKeyPosition(i),
              background: isPressed
                ? `linear-gradient(180deg, ${C.primary} 0%, ${C.primaryMuted} 100%)`
                : isTarget
                ? `linear-gradient(180deg, ${C.teal} 0%, ${C.teal}aa 100%)`
                : "linear-gradient(180deg, #1a1a2e 0%, #111 100%)",
              border: `1px solid ${isPressed ? C.primary : isTarget ? C.teal : C.border}`,
              transform: isPressed ? "scaleY(0.96)" : "scaleY(1)",
              transformOrigin: "top",
              boxShadow: isPressed ? `0 0 20px ${C.primary}88` : isTarget ? `0 0 16px ${C.teal}44` : "0 4px 6px rgba(0,0,0,0.4)",
            }}
          >
            <span style={{ fontSize: "0.6rem", color: isPressed ? C.text : isTarget ? C.teal : C.textMuted, fontWeight: 600 }}>
              {k.note}
            </span>
          </div>
        );
      })}
    </div>
  );

  if (mode === "practice" && selectedExercise && !result) {
    const target = currentIdx < targets.length ? targets[currentIdx] : null;
    const progress = targets.length > 0 ? (currentIdx / targets.length) * 100 : 0;
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={exitPractice} style={{
                padding: "8px 16px", borderRadius: 8, background: C.surface,
                border: `1px solid ${C.border}`, color: C.textSecondary,
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
              }} onKeyDown={(e) => onKeyDown(e, exitPractice)}>
                {"\u2190"} Exit
              </button>
              <div>
                <h1 style={{ color: C.text, fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
                  {selectedExercise.title}
                </h1>
                <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {selectedExercise.difficulty} {"\u00B7"} Note {Math.min(currentIdx + 1, targets.length)} of {targets.length}
                </p>
              </div>
            </div>
            <button onClick={() => setShowHint(!showHint)} style={{
              padding: "6px 14px", borderRadius: 8, background: showHint ? `${C.teal}20` : C.surface,
              border: `1px solid ${showHint ? C.teal + "40" : C.border}`,
              color: showHint ? C.teal : C.textMuted, fontSize: "0.8rem", cursor: "pointer",
            }}>
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>

          <div style={{ height: 4, borderRadius: 2, background: C.elevated, marginBottom: 24, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: `linear-gradient(90deg, ${C.teal}, ${C.primary})`,
              width: `${progress}%`, transition: "width 0.3s ease",
            }} />
          </div>

          {target && (
            <div style={{
              textAlign: "center", padding: "32px 20px", marginBottom: 24,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
            }}>
              <p style={{ color: C.textMuted, fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>
                Play this note
              </p>
              <p style={{ color: C.primary, fontSize: "4rem", fontWeight: 800, margin: "0 0 4px", lineHeight: 1 }}>
                {noteLabel(target.note, target.octave)}
              </p>
              {showHint && (
                <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: "8px 0 0" }}>
                  Look for the highlighted key on the piano below
                </p>
              )}
            </div>
          )}

          {renderPianoKeys()}

          <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: C.success, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{correctCount}</p>
              <p style={{ color: C.textMuted, fontSize: "0.75rem", margin: 0 }}>Correct</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: C.error, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{currentIdx - correctCount}</p>
              <p style={{ color: C.textMuted, fontSize: "0.75rem", margin: 0 }}>Missed</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "practice" && result) {
    const grade = scoreToGrade(result.score);
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "24px 16px", textAlign: "center",
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%", margin: "0 auto 20px",
              background: `${grade.color}15`, border: `3px solid ${grade.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: grade.color, fontSize: "2.5rem", fontWeight: 800 }}>{grade.letter}</span>
            </div>
            <h2 style={{ color: C.text, fontSize: "1.8rem", fontWeight: 700, margin: "0 0 8px" }}>
              {result.score}%
            </h2>
            <p style={{ color: grade.color, fontSize: "1rem", fontWeight: 600, margin: "0 0 24px" }}>
              {grade.label}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 16, marginBottom: 32 }}>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Accuracy</p>
                <p style={{ color: C.teal, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.accuracy}%</p>
              </div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Correct</p>
                <p style={{ color: C.success, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.correct}/{result.total}</p>
              </div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Missed</p>
                <p style={{ color: C.error, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.total - result.correct}</p>
              </div>
            </div>

            <div style={{
              background: `${C.teal}08`, border: `1px solid ${C.teal}18`,
              borderRadius: 12, padding: 16, marginBottom: 28, textAlign: "left",
            }}>
              <p style={{ color: C.teal, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>
                Feedback
              </p>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                {result.accuracy >= 90
                  ? "Excellent performance! Your note recognition is sharp."
                  : result.accuracy >= 70
                  ? "Good effort! Focus on the notes you missed and try again."
                  : "Keep practicing! Try using Show Hint to highlight the target key."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={practiceAgain} style={{
                padding: "14px 28px", borderRadius: 12,
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
                border: "none", color: C.ink, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
              }} onKeyDown={(e) => onKeyDown(e, practiceAgain)}>
                Practice Again
              </button>
              <button onClick={saveAndReturn} style={{
                padding: "14px 28px", borderRadius: 12,
                background: C.elevated, border: `1px solid ${C.border}`,
                color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
              }} onKeyDown={(e) => onKeyDown(e, saveAndReturn)}>
                Save & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "practice" && !selectedExercise) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => setMode("free")} style={{
              padding: "8px 16px", borderRadius: 8, background: C.surface,
              border: `1px solid ${C.border}`, color: C.textSecondary,
              cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
            }} onKeyDown={(e) => onKeyDown(e, () => setMode("free"))}>
              {"\u2190"} Free Play
            </button>
            <div>
              <h1 style={{ color: C.text, fontSize: "2rem", fontWeight: 700, margin: 0 }}>
                Piano <span style={{ color: C.primary }}>Practice</span>
              </h1>
              <p style={{ color: C.textMuted, fontSize: "0.95rem", margin: 0 }}>
                Choose an exercise to improve your skills
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {EXERCISES.map((ex) => (
              <div
                key={ex.id}
                data-testid={`exercise-${ex.id}`}
                tabIndex={0}
                role="button"
                onClick={() => startExercise(ex)}
                onKeyDown={(e) => onKeyDown(e, () => startExercise(ex))}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: 20, cursor: "pointer",
                  transition: "all 0.25s ease-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.primary + "40";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ color: C.text, fontSize: "1rem", fontWeight: 600, margin: 0 }}>{ex.title}</h3>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
                    background: `${C.teal}15`, color: C.teal,
                  }}>{ex.difficulty}</span>
                </div>
                <p style={{ color: C.textSecondary, fontSize: "0.85rem", margin: "0 0 12px", lineHeight: 1.5 }}>
                  {ex.description}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ex.instructions.map((inst, i) => (
                    <p key={i} style={{ color: C.textMuted, fontSize: "0.78rem", margin: 0, display: "flex", gap: 6 }}>
                      <span style={{ color: C.primary }}>{i + 1}.</span> {inst}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: "2rem", marginBottom: "8px", fontWeight: 700 }}>Piano</h1>
            <p style={{ color: C.textSecondary, marginBottom: "16px", fontSize: "0.95rem" }}>
              Use your keyboard or click the keys to play. Map: A\u2013K = white keys, W/E/T/Y/U/O/P = black keys.
            </p>
          </div>
          <button onClick={() => { setMode("practice"); buttonClick(); }} style={{
            padding: "10px 20px", borderRadius: 10,
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
            border: "none", color: C.ink, fontWeight: 700, fontSize: "0.85rem",
            cursor: "pointer",
          }} onKeyDown={(e) => onKeyDown(e, () => { setMode("practice"); buttonClick(); })}>
            Start Practice
          </button>
        </div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 16px" }}>
            <span style={{ color: C.textSecondary, fontSize: "0.85rem", marginRight: "4px" }}>Octave</span>
            <button onClick={() => setOctave((o) => Math.max(2, o - 1))} style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2212"}</button>
            <span style={{ color: C.primary, fontWeight: 700, fontSize: "1.1rem", minWidth: "48px", textAlign: "center" }}>{octave}\u2013{octave + 1}</span>
            <button onClick={() => setOctave((o) => Math.min(6, o + 1))} style={{ width: "32px", height: "32px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>

          <button onClick={() => setSustain((s) => !s)} style={{ padding: "10px 18px", borderRadius: "10px", border: `1px solid ${sustain ? C.primary : C.border}`, background: sustain ? `${C.primary}22` : C.elevated, color: sustain ? C.primary : C.textSecondary, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s" }}>
            Sustain {sustain ? "ON" : "OFF"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 16px" }}>
            <span style={{ color: C.textSecondary, fontSize: "0.85rem" }}>Vol</span>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label="Volume" style={{ width: "100px", accentColor: C.primary }} />
            <span style={{ color: C.textMuted, fontSize: "0.8rem", minWidth: "32px" }}>{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {renderPianoKeys()}

        <div style={{ marginTop: "24px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px" }}>
          <h3 style={{ color: C.text, fontSize: "0.9rem", marginBottom: "12px", fontWeight: 600 }}>Keyboard Shortcuts</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px" }}>
            {[
              ["A", "C"], ["W", "C#"], ["S", "D"], ["E", "D#"], ["D", "E"], ["F", "F"],
              ["T", "F#"], ["G", "G"], ["Y", "G#"], ["H", "A"], ["U", "A#"], ["J", "B"],
              ["K", "C (oct+1)"], ["O", "C# (oct+1)"], ["L", "D (oct+1)"], ["P", "D# (oct+1)"], [";", "E (oct+1)"],
            ].map(([key, note]) => (
              <div key={key} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "2px 8px", color: C.primary, fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace" }}>{key}</span>
                <span style={{ color: C.textSecondary, fontSize: "0.8rem" }}>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
