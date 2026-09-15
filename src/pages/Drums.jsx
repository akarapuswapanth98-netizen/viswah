import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { onKeyDown } from "../utils/keyboard";

import C from "../components/ui/colors";

const PADS = [
  { id: "kick", label: "Kick", keys: [" ", "z"], color: C.primary, layout: { gridRow: "2/3", gridColumn: "2/3" } },
  { id: "snare", label: "Snare", keys: ["x", "k"], color: C.teal, layout: { gridRow: "1/2", gridColumn: "2/3" } },
  { id: "hihat", label: "Hi-Hat", keys: ["c", "j"], color: C.textSecondary, layout: { gridRow: "1/2", gridColumn: "1/2" } },
  { id: "tom", label: "Tom", keys: ["v", "l"], color: C.error, layout: { gridRow: "2/3", gridColumn: "1/2" } },
  { id: "crash", label: "Crash", keys: ["b", ";"], color: C.warning, layout: { gridRow: "1/2", gridColumn: "3/4" } },
  { id: "ride", label: "Ride", keys: ["n"], color: "#C084FC", layout: { gridRow: "2/3", gridColumn: "3/4" } },
];

const EXERCISES = [
  { id: "drums_basic_beat", title: "Basic Beat", description: "Kick and snare alternating pattern", difficulty: "Beginner", type: "pattern", instructions: ["Hit the pads following the pattern", "Kick, Snare, Kick, Snare", "4 cycles to complete"], pattern: ["kick", "snare", "kick", "snare"], cycles: 4 },
  { id: "drums_four_floor", title: "Four on the Floor", description: "Steady kick drum on every beat", difficulty: "Beginner", type: "pattern", instructions: ["Play kick drum on every beat", "Keep it steady and even", "4 cycles"], pattern: ["kick", "kick", "kick", "kick"], cycles: 4 },
  { id: "drums_rock_pattern", title: "Rock Beat", description: "Classic kick-snare with hi-hat", difficulty: "Intermediate", type: "multi_pad", instructions: ["Kick with Hi-Hat on beat 1", "Snare with Hi-Hat on beat 2", "Repeat for 4 cycles"], pattern: [{ pads: ["kick", "hihat"] }, { pads: ["snare", "hihat"] }, { pads: ["kick", "hihat"] }, { pads: ["snare", "hihat"] }], cycles: 4 },
  { id: "drums_hihat_snare", title: "Hi-Hat & Snare", description: "Hi-hat rhythm with snare accents", difficulty: "Beginner", type: "pattern", instructions: ["Hi-Hat on beats 1 and 3", "Snare on beats 2 and 4", "4 cycles"], pattern: ["hihat", "snare", "hihat", "snare"], cycles: 4 },
  { id: "drums_tom_fill", title: "Tom Fill", description: "Practice drum fills with toms", difficulty: "Intermediate", type: "pattern", instructions: ["Tom, Snare, Tom, Crash", "Practice fills across the kit", "3 cycles"], pattern: ["tom", "snare", "tom", "crash"], cycles: 3 },
  { id: "drums_coordination", title: "Kick & Hi-Hat Coordination", description: "Alternate kick and hi-hat", difficulty: "Beginner", type: "pattern", instructions: ["Kick on beats 1 and 3", "Hi-Hat on beats 2 and 4", "4 cycles"], pattern: ["kick", "hihat", "kick", "hihat"], cycles: 4 },
];

function scoreToGrade(score) {
  if (score >= 90) return { letter: "A+", color: C.success, label: "Excellent" };
  if (score >= 80) return { letter: "A", color: C.success, label: "Great" };
  if (score >= 70) return { letter: "B", color: C.teal, label: "Good" };
  if (score >= 60) return { letter: "C", color: C.warning, label: "Fair" };
  return { letter: "D", color: C.error, label: "Needs Practice" };
}

function flattenPattern(pattern, cycles) {
  const result = [];
  for (let c = 0; c < cycles; c++) {
    pattern.forEach((step) => {
      if (typeof step === "string") result.push([step]);
      else if (step && step.pads) result.push([...step.pads]);
    });
  }
  return result;
}

const createNoiseBuffer = (ctx) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
};

export default function Drums() {
  const [volume, setVolume] = useState(0.7);
  const [activePads, setActivePads] = useState(new Set());
  const audioCtxRef = useRef(null);
  const noiseBufferRef = useRef(null);
  const activeSounds = useRef({});

  const [mode, setMode] = useState("free");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [flatSteps, setFlatSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const [incorrectHits, setIncorrectHits] = useState(0);
  const [result, setResult] = useState(null);
  const [lastHitCorrect, setLastHitCorrect] = useState(null);

  const { startSession, endSession } = usePracticeSession("drums");
  const { buttonClick, completion, error: errorTone } = useAudioFeedback();
  const practiceStartTime = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      noiseBufferRef.current = createNoiseBuffer(audioCtxRef.current);
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((padId) => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = volume * 0.6;
    if (activeSounds.current[padId]) {
      try { activeSounds.current[padId].forEach((s) => { try { s.stop(now); } catch (e) {} }); } catch (e) {}
    }
    activeSounds.current[padId] = [];
    const createNoise = (gainVal, decay, filterType, filterFreq, filterQ) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBufferRef.current;
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;
      gain.gain.setValueAtTime(vol * gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + decay + 0.05);
      activeSounds.current[padId].push(src);
    };
    const createTone = (freq, gainVal, decay, type = "sine") => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
      activeSounds.current[padId].push(osc);
    };
    switch (padId) {
      case "kick": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
        activeSounds.current[padId].push(osc);
        createNoise(0.3, 0.06, "lowpass", 300, 1);
        break;
      }
      case "snare":
        createTone(180, 0.6, 0.15, "triangle");
        createTone(360, 0.3, 0.08, "sine");
        createNoise(0.8, 0.2, "highpass", 2000, 0.5);
        createNoise(0.4, 0.12, "bandpass", 3000, 1);
        break;
      case "hihat":
        createNoise(0.5, 0.05, "highpass", 8000, 1);
        createNoise(0.3, 0.03, "bandpass", 10000, 2);
        break;
      case "tom": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        activeSounds.current[padId].push(osc);
        createTone(400, 0.2, 0.08, "sine");
        break;
      }
      case "crash":
        createNoise(0.7, 1.5, "bandpass", 5000, 0.3);
        createNoise(0.5, 1.0, "highpass", 3000, 0.5);
        createTone(6000, 0.15, 0.3, "sine");
        break;
      case "ride":
        createNoise(0.4, 0.8, "highpass", 6000, 0.5);
        createNoise(0.25, 0.5, "bandpass", 8000, 1);
        createTone(8000, 0.1, 0.2, "sine");
        break;
    }
    setActivePads((prev) => new Set(prev).add(padId));
    setTimeout(() => { setActivePads((prev) => { const n = new Set(prev); n.delete(padId); return n; }); }, 120);
  }, [getAudioContext, volume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const pad = PADS.find((p) => p.keys.includes(key));
      if (!pad) return;
      e.preventDefault();
      playSound(pad.id);
      if (mode === "practice" && selectedExercise) measureHit(pad.id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playSound, mode, selectedExercise, currentStep, flatSteps, correctHits, incorrectHits]);

  useEffect(() => {
    return () => {
      Object.values(activeSounds.current).forEach((sounds) => { sounds.forEach((s) => { try { s.stop(); } catch (e) {} }); });
      audioCtxRef.current?.close();
    };
  }, []);

  const measureHit = useCallback((padId) => {
    if (currentStep >= flatSteps.length) return;
    const expected = flatSteps[currentStep];
    const isCorrect = expected.includes(padId);
    setLastHitCorrect(isCorrect);
    if (isCorrect) { setCorrectHits((c) => c + 1); buttonClick(); }
    else { setIncorrectHits((c) => c + 1); errorTone(); }
    const next = currentStep + 1;
    setCurrentStep(next);
    if (next >= flatSteps.length) {
      const totalBeats = flatSteps.length;
      const finalCorrect = isCorrect ? correctHits + 1 : correctHits;
      const accuracy = Math.round((finalCorrect / totalBeats) * 100);
      const score = Math.round(accuracy * 0.7 + 30);
      setResult({ score, accuracy, correct: finalCorrect, total: totalBeats, incorrect: isCorrect ? incorrectHits : incorrectHits + 1, completed: true });
    }
  }, [currentStep, flatSteps, correctHits, incorrectHits, buttonClick, errorTone]);

  const handlePadHit = useCallback((padId) => {
    playSound(padId);
    if (mode === "practice" && selectedExercise) measureHit(padId);
  }, [playSound, mode, selectedExercise, measureHit]);

  const startExercise = useCallback((exercise) => {
    const flat = flattenPattern(exercise.pattern, exercise.cycles);
    setSelectedExercise(exercise);
    setFlatSteps(flat);
    setCurrentStep(0);
    setCorrectHits(0);
    setIncorrectHits(0);
    setResult(null);
    setLastHitCorrect(null);
    setMode("practice");
    practiceStartTime.current = Date.now();
    startSession(exercise.id);
    buttonClick();
  }, [startSession, buttonClick]);

  const practiceAgain = useCallback(() => {
    if (selectedExercise) {
      const flat = flattenPattern(selectedExercise.pattern, selectedExercise.cycles);
      setFlatSteps(flat);
      setCurrentStep(0);
      setCorrectHits(0);
      setIncorrectHits(0);
      setResult(null);
      setLastHitCorrect(null);
      practiceStartTime.current = Date.now();
      startSession(selectedExercise.id);
    }
  }, [selectedExercise, startSession]);

  const saveAndReturn = useCallback(async () => {
    if (result) {
      await endSession({ activityId: selectedExercise?.id || "drums_practice", score: result.score, completed: true, metadata: { exercise_type: selectedExercise?.type, exercise_id: selectedExercise?.id, difficulty: selectedExercise?.difficulty, correct_hits: result.correct, total_hits: result.total, accuracy: result.accuracy, incorrect_hits: result.incorrect, cycles: selectedExercise?.cycles } });
      completion();
    }
    setMode("free");
    setSelectedExercise(null);
    setResult(null);
  }, [result, selectedExercise, endSession, completion]);

  const exitPractice = useCallback(() => { setMode("free"); setSelectedExercise(null); setResult(null); }, []);

  const renderPads = (onPadClick) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 180px)", gap: "16px", marginBottom: "28px" }}>
      {PADS.map((pad) => {
        const isActive = activePads.has(pad.id);
        return (
          <div
            key={pad.id}
            data-testid={`drum-pad-${pad.id}`}
            onMouseDown={() => onPadClick(pad.id)}
            onTouchStart={(e) => { e.preventDefault(); onPadClick(pad.id); }}
            role="button"
            aria-label={`${pad.label} drum pad`}
            tabIndex={0}
            onKeyDown={(e) => onKeyDown(e, () => onPadClick(pad.id))}
            className={`drum-pad ${isActive ? 'pressed' : ''}`}
            style={{
              ...pad.layout,
              background: isActive
                ? `linear-gradient(135deg, ${pad.color}44 0%, ${pad.color}22 100%)`
                : `linear-gradient(145deg, rgba(36, 30, 56, 0.95), rgba(22, 18, 34, 0.98))`,
              border: `2px solid ${isActive ? pad.color : 'rgba(240, 235, 227, 0.08)'}`,
              boxShadow: isActive
                ? `0 0 30px ${pad.color}66, inset 0 0 20px ${pad.color}22`
                : '0 4px 16px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.03) inset',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: isActive ? pad.color : C.surface, border: `2px solid ${isActive ? pad.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s", boxShadow: isActive ? `0 0 24px ${pad.color}88` : "none" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isActive ? `${C.text}33` : `${pad.color}33`, border: `1px solid ${isActive ? C.text : pad.color}`, transition: "all 0.1s" }} />
            </div>
            <span style={{ color: C.text, fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.05em" }}>{pad.label}</span>
            <span style={{ color: C.textMuted, fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase" }}>{pad.keys.map((k) => k === " " ? "Space" : k.toUpperCase()).join(" / ")}</span>
          </div>
        );
      })}
    </div>
  );

  if (mode === "practice" && selectedExercise && !result) {
    const totalSteps = flatSteps.length;
    const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
    const currentTarget = currentStep < totalSteps ? flatSteps[currentStep] : null;
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={exitPractice} style={{ padding: "8px 16px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.textSecondary, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }} onKeyDown={(e) => onKeyDown(e, exitPractice)}>{"\u2190"} Exit</button>
              <div>
                <h1 style={{ color: C.text, fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{selectedExercise.title}</h1>
                <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: 0 }}>Beat {Math.min(currentStep + 1, totalSteps)} of {totalSteps}</p>
              </div>
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: C.elevated, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${C.teal}, ${C.primary})`, width: `${progress}%`, transition: "width 0.3s ease" }} />
          </div>
          {currentTarget && (
            <div style={{ textAlign: "center", padding: "24px 20px", marginBottom: 24, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <p style={{ color: C.textMuted, fontSize: "0.85rem", fontWeight: 600, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>Play {currentTarget.length > 1 ? "together" : "this pad"}</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {currentTarget.map((padId) => { const pad = PADS.find((p) => p.id === padId); return (<span key={padId} style={{ padding: "12px 24px", borderRadius: 12, background: `${pad?.color || C.primary}20`, border: `2px solid ${pad?.color || C.primary}60`, color: pad?.color || C.primary, fontSize: "1.2rem", fontWeight: 700 }}>{pad?.label || padId}</span>); })}
              </div>
              {lastHitCorrect !== null && (<p style={{ color: lastHitCorrect ? C.success : C.error, fontSize: "0.85rem", fontWeight: 600, margin: "12px 0 0" }}>{lastHitCorrect ? "\u2713 Correct!" : "\u2717 Wrong pad"}</p>)}
            </div>
          )}
          {renderPads(handlePadHit)}
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}><p style={{ color: C.success, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{correctHits}</p><p style={{ color: C.textMuted, fontSize: "0.75rem", margin: 0 }}>Correct</p></div>
            <div style={{ textAlign: "center" }}><p style={{ color: C.error, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{incorrectHits}</p><p style={{ color: C.textMuted, fontSize: "0.75rem", margin: 0 }}>Missed</p></div>
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
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 16px", textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto 20px", background: `${grade.color}15`, border: `3px solid ${grade.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: grade.color, fontSize: "2.5rem", fontWeight: 800 }}>{grade.letter}</span>
            </div>
            <h2 style={{ color: C.text, fontSize: "1.8rem", fontWeight: 700, margin: "0 0 8px" }}>{result.score}%</h2>
            <p style={{ color: grade.color, fontSize: "1rem", fontWeight: 600, margin: "0 0 24px" }}>{grade.label}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 16, marginBottom: 32 }}>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}><p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Accuracy</p><p style={{ color: C.teal, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.accuracy}%</p></div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}><p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Correct</p><p style={{ color: C.success, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.correct}/{result.total}</p></div>
              <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}><p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Mistakes</p><p style={{ color: C.error, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{result.incorrect}</p></div>
            </div>
            <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}18`, borderRadius: 12, padding: 16, marginBottom: 28, textAlign: "left" }}>
              <p style={{ color: C.teal, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>Feedback</p>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>{result.accuracy >= 90 ? "Excellent timing! Your rhythm is solid." : result.accuracy >= 70 ? "Good rhythm! Focus on hitting the correct pads more precisely." : "Keep practicing! Pay attention to which pad to hit next."}</p>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={practiceAgain} style={{ padding: "14px 28px", borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`, border: "none", color: C.ink, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }} onKeyDown={(e) => onKeyDown(e, practiceAgain)}>Practice Again</button>
              <button onClick={saveAndReturn} style={{ padding: "14px 28px", borderRadius: 12, background: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" }} onKeyDown={(e) => onKeyDown(e, saveAndReturn)}>Save & Return</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "practice" && !selectedExercise) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => setMode("free")} style={{ padding: "8px 16px", borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.textSecondary, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }} onKeyDown={(e) => onKeyDown(e, () => setMode("free"))}>{"\u2190"} Free Play</button>
            <div>
              <h1 style={{ color: C.text, fontSize: "2rem", fontWeight: 700, margin: 0 }}>Drum <span style={{ color: C.primary }}>Practice</span></h1>
              <p style={{ color: C.textMuted, fontSize: "0.95rem", margin: 0 }}>Choose a rhythm exercise to improve your timing</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {EXERCISES.map((ex) => (
              <div key={ex.id} data-testid={`exercise-${ex.id}`} tabIndex={0} role="button" onClick={() => startExercise(ex)} onKeyDown={(e) => onKeyDown(e, () => startExercise(ex))} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.25s ease-out" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary + "40"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <h3 style={{ color: C.text, fontSize: "1rem", fontWeight: 600, margin: 0 }}>{ex.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8, background: `${C.teal}15`, color: C.teal }}>{ex.difficulty}</span>
                </div>
                <p style={{ color: C.textSecondary, fontSize: "0.85rem", margin: "0 0 12px", lineHeight: 1.5 }}>{ex.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ex.instructions.map((inst, i) => (<p key={i} style={{ color: C.textMuted, fontSize: "0.78rem", margin: 0, display: "flex", gap: 6 }}><span style={{ color: C.primary }}>{i + 1}.</span> {inst}</p>))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", fontFamily: "system-ui, sans-serif" }} className="studio-surface">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ color: C.text, fontSize: "2rem", marginBottom: "8px", fontWeight: 700 }}>Drums</h1>
            <p style={{ color: C.textSecondary, marginBottom: "16px", fontSize: "0.95rem" }}>Click the pads or use your keyboard to play.</p>
          </div>
          <button onClick={() => { setMode("practice"); buttonClick(); }} style={{ padding: "10px 20px", borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`, border: "none", color: C.ink, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }} onKeyDown={(e) => onKeyDown(e, () => { setMode("practice"); buttonClick(); })}>Start Practice</button>
        </div>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px 16px" }}>
            <span style={{ color: C.textSecondary, fontSize: "0.85rem" }}>Vol</span>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label="Volume" style={{ width: "100px", accentColor: C.primary }} />
            <span style={{ color: C.textMuted, fontSize: "0.8rem", minWidth: "32px" }}>{Math.round(volume * 100)}%</span>
          </div>
        </div>
        {renderPads(handlePadHit)}
        <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px" }}>
          <h3 style={{ color: C.text, fontSize: "0.9rem", marginBottom: "12px", fontWeight: 600 }}>Sound Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
            {[["Kick", "60Hz sine sweep + noise burst"], ["Snare", "Triangle + noise with bandpass"], ["Hi-Hat", "High-pass filtered noise"], ["Tom", "150Hz sine sweep"], ["Crash", "Bandpass noise with long decay"], ["Ride", "High-pass noise, medium decay"]].map(([name, desc]) => (
              <div key={name} style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                <span style={{ color: C.primary, fontSize: "0.8rem", fontWeight: 700, minWidth: "52px" }}>{name}</span>
                <span style={{ color: C.textMuted, fontSize: "0.75rem" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
