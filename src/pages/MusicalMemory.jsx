import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { playNote, stopAll, cleanup, NOTE_NAMES } from "../utils/audioEngine";
import {
  generateMusicalMemory,
  validateMusicalMemory,
  computeScore,
  getNextDifficulty,
  shuffleArray,
} from "../utils/exerciseEngine";
import {
  C,
  PlayButton,
  ScoreDisplay,
  ProgressBar,
  FeedbackToast,
  DifficultySelector,
  TimerDisplay,
} from "../components/musicLab/MusicLabUI";

export default function MusicalMemory() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("musical_memory");

  const [difficulty, setDifficulty] = useState("beginner");
  const [exercise, setExercise] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle, listening, input, feedback, result
  const [currentRound, setCurrentRound] = useState(0);
  const [userSequence, setUserSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [recentScores, setRecentScores] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [roundComplete, setRoundComplete] = useState([]);

  const timerRef = useRef(null);
  const noteTimerRef = useRef(null);
  const sessionStarted = useRef(false);

  const currentSequence = exercise?.sequences?.[currentRound];

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(noteTimerRef.current);
      stopAll();
      cleanup();
    };
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const startExercise = useCallback(() => {
    stopAll();
    const ex = generateMusicalMemory(difficulty);
    setExercise(ex);
    setCurrentRound(0);
    setUserSequence([]);
    setCorrect(0);
    setFeedback(null);
    setResult(null);
    setPhase("idle");
    setRoundComplete([]);

    if (!sessionStarted.current) {
      startSession("musical_memory");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} musical memory — ${ex.totalRounds} rounds` });
  }, [difficulty, startSession, startTimer, addToast]);

  const playSequence = useCallback(() => {
    if (!currentSequence || isPlaying) return;
    setIsPlaying(true);
    setPhase("listening");
    setUserSequence([]);

    currentSequence.notes.forEach((n, i) => {
      setTimeout(() => {
        setActiveNoteIdx(i);
        playNote(n.note, n.octave, {
          duration: 0.5,
          volume: 0.3,
          type: "triangle",
          label: "Generated practice tone",
        });
      }, i * 700);
    });

    setTimeout(() => {
      setIsPlaying(false);
      setActiveNoteIdx(-1);
      setPhase("input");
      addToast({ type: "info", message: "Your turn — replay the sequence!" });
    }, currentSequence.notes.length * 700 + 300);
  }, [currentSequence, isPlaying, addToast]);

  const handleNoteInput = useCallback((note, octave) => {
    if (phase !== "input") return;

    playNote(note, octave, { duration: 0.4, volume: 0.3, type: "triangle" });

    const newSeq = [...userSequence, { note, octave }];
    setUserSequence(newSeq);

    // Check if sequence is complete
    if (newSeq.length === currentSequence.notes.length) {
      setPhase("feedback");
      const isCorrect = validateMusicalMemory(newSeq, currentSequence.notes);

      if (isCorrect) {
        setCorrect((c) => c + 1);
        setFeedback({ type: "success", message: "Perfect memory!" });
      } else {
        setFeedback({ type: "error", message: "Not quite — the sequence was: " +
          currentSequence.display.join(" ") });
      }

      setRoundComplete((prev) => [...prev, { round: currentRound + 1, correct: isCorrect }]);

      setTimeout(() => {
        setFeedback(null);
        if (currentRound + 1 >= exercise.sequences.length) {
          const finalCorrect = isCorrect ? correct + 1 : correct;
          const score = computeScore(finalCorrect, exercise.sequences.length);
          const grade = (() => {
            if (score >= 90) return { letter: "A+", color: C.success };
            if (score >= 80) return { letter: "A", color: C.success };
            if (score >= 70) return { letter: "B", color: C.teal };
            if (score >= 60) return { letter: "C", color: C.warning };
            return { letter: "D", color: C.error };
          })();
          setResult({ score, correct: finalCorrect, total: exercise.sequences.length, grade });
          clearInterval(timerRef.current);

          const newScores = [...recentScores, score];
          setRecentScores(newScores);
          const nextDiff = getNextDifficulty(difficulty, newScores);
          if (nextDiff !== difficulty) {
            setDifficulty(nextDiff);
            addToast({ type: "info", message: `Difficulty adjusted to ${nextDiff}` });
          }

          endSession({
            score,
            completed: true,
            metadata: { difficulty, type: "musical_memory", correct: finalCorrect, total: exercise.sequences.length },
          });
          sessionStarted.current = false;
        } else {
          setCurrentRound((r) => r + 1);
          setUserSequence([]);
          setPhase("idle");
        }
      }, 2000);
    }
  }, [phase, userSequence, currentSequence, currentRound, exercise, correct, difficulty, recentScores, endSession, addToast]);

  const availableNotes = difficulty === "beginner"
    ? NOTE_NAMES.slice(0, 5)
    : difficulty === "intermediate"
      ? NOTE_NAMES.slice(0, 8)
      : NOTE_NAMES;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      padding: "24px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes noteGlow { 0%, 100% { box-shadow: 0 0 0 rgba(232,168,56,0); } 50% { box-shadow: 0 0 12px rgba(232,168,56,0.4); } }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🧠</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Musical Memory</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to the note sequence, then replay it from memory
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 24, flexWrap: "wrap",
        }}>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TimerDisplay seconds={elapsed} />
            <button
              onClick={startExercise}
              style={{
                padding: "10px 24px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {result ? "New Exercise" : "Start"}
            </button>
          </div>
        </div>

        {feedback && <div style={{ marginBottom: 16 }}><FeedbackToast feedback={feedback} /></div>}

        {exercise && !result && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Round {currentRound + 1} of {exercise.totalRounds}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                {currentSequence?.notes.length} notes to remember
              </span>
            </div>
            <ProgressBar current={currentRound + 1} total={exercise.totalRounds} color={C.raga} />
          </div>
        )}

        {/* Round complete tracker */}
        {roundComplete.length > 0 && (
          <div style={{
            display: "flex", gap: 8, marginBottom: 20, justifyContent: "center",
          }}>
            {roundComplete.map((r) => (
              <div key={r.round} style={{
                width: 32, height: 32, borderRadius: 8,
                background: r.correct ? `${C.success}20` : `${C.error}20`,
                border: `1px solid ${r.correct ? C.success : C.error}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                color: r.correct ? C.success : C.error,
              }}>
                {r.correct ? "✓" : "✗"}
              </div>
            ))}
          </div>
        )}

        {exercise && !result && currentSequence && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            {/* Phase indicator */}
            <div style={{
              padding: "8px 16px", borderRadius: 20,
              background: phase === "listening" ? `${C.saffron}20` : phase === "input" ? `${C.teal}20` : `${C.textMuted}15`,
              color: phase === "listening" ? C.saffron : phase === "input" ? C.teal : C.textMuted,
              fontSize: 13, fontWeight: 600,
            }}>
              {phase === "idle" && "Press play to listen"}
              {phase === "listening" && "Listen carefully..."}
              {phase === "input" && "Your turn — play the notes!"}
              {phase === "feedback" && "Checking..."}
            </div>

            {/* Visual sequence display */}
            <div style={{
              display: "flex", gap: 8, alignItems: "center", justifyContent: "center",
              flexWrap: "wrap", minHeight: 50,
            }}>
              {(phase === "feedback" ? currentSequence.notes : userSequence).map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 12px", borderRadius: 10,
                    background: phase === "feedback"
                      ? (n.note === currentSequence.notes[i]?.note ? `${C.success}20` : `${C.error}20`)
                      : `${C.teal}20`,
                    color: phase === "feedback"
                      ? (n.note === currentSequence.notes[i]?.note ? C.success : C.error)
                      : C.teal,
                    fontSize: 14, fontWeight: 700,
                    border: `1px solid ${phase === "feedback"
                      ? (n.note === currentSequence.notes[i]?.note ? C.success : C.error)
                      : C.teal}40`,
                  }}
                >
                  {n.note}{n.octave}
                </div>
              ))}
              {phase === "input" && Array.from({ length: currentSequence.notes.length - userSequence.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  padding: "6px 12px", borderRadius: 10,
                  background: `${C.textMuted}10`,
                  border: `1px dashed ${C.textMuted}30`,
                  color: C.textMuted, fontSize: 14,
                }}>?</div>
              ))}
            </div>

            {/* Play button */}
            {phase === "idle" && (
              <PlayButton onClick={playSequence} isPlaying={isPlaying} size={80} label="Play sequence" />
            )}

            {/* Input keyboard */}
            {phase === "input" && (
              <div style={{
                display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
                maxWidth: 500,
              }}>
                {availableNotes.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleNoteInput(note, 4)}
                    style={{
                      width: 56, height: 56, borderRadius: 12,
                      background: C.surfaceHover,
                      border: `1px solid ${C.borderHover}`,
                      color: C.text, fontSize: 16, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.15s ease-out",
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.background = `${C.saffron}30`;
                      e.currentTarget.style.borderColor = C.saffron;
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.background = C.surfaceHover;
                      e.currentTarget.style.borderColor = C.borderHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.surfaceHover;
                      e.currentTarget.style.borderColor = C.borderHover;
                    }}
                  >
                    {note}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {result && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            <ScoreDisplay score={result.score} correct={result.correct} total={result.total} label={difficulty} />
            <button
              onClick={startExercise}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                color: C.ink, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Practice Again
            </button>
          </div>
        )}

        {!exercise && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Train your musical memory
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to a sequence of notes, then replay it from memory. Sequences get longer as you improve.
            </p>
            <button
              onClick={startExercise}
              style={{
                padding: "14px 32px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${C.raga}, ${C.raga}CC)`,
                color: C.ink, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Start Training
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
