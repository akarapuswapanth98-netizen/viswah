import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { playMelody, stopAll, cleanup, noteFrequency } from "../utils/audioEngine";
import {
  generateMelodyRecognition,
  validateMelodyRecognition,
  computeScore,
  getFeedback,
  getNextDifficulty,
} from "../utils/exerciseEngine";
import {
  C,
  PlayButton,
  AnswerOption,
  ScoreDisplay,
  ProgressBar,
  FeedbackToast,
  DifficultySelector,
  TimerDisplay,
  StreakDisplay,
} from "../components/musicLab/MusicLabUI";

export default function MelodyRecognition() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("melody_recognition");

  const [difficulty, setDifficulty] = useState("beginner");
  const [exercise, setExercise] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [recentScores, setRecentScores] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);

  const timerRef = useRef(null);
  const noteTimerRef = useRef(null);
  const sessionStarted = useRef(false);

  const currentMelody = exercise?.melodies?.[currentIdx];

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
    const ex = generateMelodyRecognition(difficulty);
    setExercise(ex);
    setCurrentIdx(0);
    setSelected(null);
    setIsRevealed(false);
    setCorrect(0);
    setStreak(0);
    setFeedback(null);
    setResult(null);
    setActiveNoteIdx(-1);

    if (!sessionStarted.current) {
      startSession("melody_recognition");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} melody recognition` });
  }, [difficulty, startSession, startTimer, addToast]);

  const playCurrentMelody = useCallback(() => {
    if (!currentMelody || isPlaying) return;
    setIsPlaying(true);

    const pairs = currentMelody.notes.map((n) => {
      const note = n.replace(/[0-9]/g, "");
      const octave = parseInt(n.match(/[0-9]/)?.[0] || "4");
      return { note, octave };
    });

    // Visual note tracking
    pairs.forEach((_, i) => {
      setTimeout(() => setActiveNoteIdx(i), i * 450);
    });

    playMelody(pairs, {
      noteDuration: 0.35,
      gap: 0.08,
      volume: 0.3,
      type: "triangle",
    });

    setTimeout(() => {
      setIsPlaying(false);
      setActiveNoteIdx(-1);
    }, pairs.length * 430 + 200);
  }, [currentMelody, isPlaying]);

  const handleAnswer = useCallback((answer) => {
    if (isRevealed || !currentMelody) return;
    setSelected(answer);
    setIsRevealed(true);

    const isCorrect = validateMelodyRecognition(answer, currentMelody);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setFeedback(getFeedback(isCorrect, isCorrect ? streak + 1 : 0));

    setTimeout(() => {
      if (currentIdx + 1 >= exercise.melodies.length) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const score = computeScore(finalCorrect, exercise.melodies.length);
        const grade = (() => {
          if (score >= 90) return { letter: "A+", color: C.success };
          if (score >= 80) return { letter: "A", color: C.success };
          if (score >= 70) return { letter: "B", color: C.teal };
          if (score >= 60) return { letter: "C", color: C.warning };
          return { letter: "D", color: C.error };
        })();
        setResult({ score, correct: finalCorrect, total: exercise.melodies.length, grade });
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
          metadata: { difficulty, type: "melody_recognition", correct: finalCorrect, total: exercise.melodies.length },
        });
        sessionStarted.current = false;
      } else {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setIsRevealed(false);
        setActiveNoteIdx(-1);
      }
      setFeedback(null);
    }, 1200);
  }, [isRevealed, currentMelody, currentIdx, exercise, correct, streak, difficulty, recentScores, endSession, addToast]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      padding: "24px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🎼</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Melody Recognition</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to the generated melody and identify which tune is being played
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, marginBottom: 24, flexWrap: "wrap",
        }}>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TimerDisplay seconds={elapsed} />
            <StreakDisplay streak={streak} />
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
                Melody {currentIdx + 1} of {exercise.totalQuestions}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Generated practice tones
              </span>
            </div>
            <ProgressBar current={currentIdx + 1} total={exercise.totalQuestions} />
          </div>
        )}

        {exercise && !result && currentMelody && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            {/* Visual note tracker */}
            <div style={{
              display: "flex", gap: 6, alignItems: "center", justifyContent: "center",
              flexWrap: "wrap", minHeight: 40,
            }}>
              {currentMelody.notes.map((note, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: i === activeNoteIdx
                      ? `${C.saffron}30`
                      : i < activeNoteIdx
                        ? `${C.teal}15`
                        : `${C.textMuted}10`,
                    color: i === activeNoteIdx ? C.saffron : i < activeNoteIdx ? C.teal : C.textMuted,
                    fontSize: 13,
                    fontWeight: 600,
                    border: i === activeNoteIdx ? `1px solid ${C.saffron}60` : `1px solid transparent`,
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {note}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <PlayButton onClick={playCurrentMelody} isPlaying={isPlaying} size={80} label="Play melody" />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>
                {isPlaying ? "Playing melody..." : "Tap to listen"}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.textMuted, opacity: 0.7 }}>
                {currentMelody.noteCount} notes
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10, width: "100%", maxWidth: 550,
            }}>
              {exercise.options.map((opt) => (
                <AnswerOption
                  key={opt}
                  answer={opt}
                  isSelected={selected === opt}
                  isCorrect={opt === currentMelody.name}
                  isRevealed={isRevealed}
                  onClick={() => handleAnswer(opt)}
                />
              ))}
            </div>
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎼</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Train your melody recognition
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to generated melodies from classical to folk and learn to identify them by name.
            </p>
            <button
              onClick={startExercise}
              style={{
                padding: "14px 32px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
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
