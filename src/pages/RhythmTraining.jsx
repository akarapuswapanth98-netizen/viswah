import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { playClick, playRhythmPattern, stopAll, cleanup } from "../utils/audioEngine";
import {
  generateRhythmRecognition,
  validateRhythmRecognition,
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

export default function RhythmTraining() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("rhythm_training");

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
  const [visualBeats, setVisualBeats] = useState([]);
  const [activeBeat, setActiveBeat] = useState(-1);

  const timerRef = useRef(null);
  const beatTimerRef = useRef(null);
  const sessionStarted = useRef(false);

  const currentPattern = exercise?.patterns?.[currentIdx];

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(beatTimerRef.current);
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
    const ex = generateRhythmRecognition(difficulty);
    setExercise(ex);
    setCurrentIdx(0);
    setSelected(null);
    setIsRevealed(false);
    setCorrect(0);
    setStreak(0);
    setFeedback(null);
    setResult(null);
    setVisualBeats([]);
    setActiveBeat(-1);

    if (!sessionStarted.current) {
      startSession("rhythm_training");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} rhythm training` });
  }, [difficulty, startSession, startTimer, addToast]);

  const playPattern = useCallback(() => {
    if (!currentPattern || isPlaying) return;
    setIsPlaying(true);
    setVisualBeats(currentPattern.beats);
    setActiveBeat(-1);

    const beatDuration = 60 / currentPattern.bpm;

    currentPattern.beats.forEach((intensity, i) => {
      setTimeout(() => {
        setActiveBeat(i);
        if (intensity > 0) {
          playClick(i === 0, 0.4 * (i === 0 ? 1 : intensity));
        }
      }, i * beatDuration * 1000);
    });

    setTimeout(() => {
      setIsPlaying(false);
      setActiveBeat(-1);
    }, currentPattern.beats.length * beatDuration * 1000 + 200);
  }, [currentPattern, isPlaying]);

  const handleAnswer = useCallback((answer) => {
    if (isRevealed || !currentPattern) return;
    setSelected(answer);
    setIsRevealed(true);

    const isCorrect = validateRhythmRecognition(answer, currentPattern);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setFeedback(getFeedback(isCorrect, isCorrect ? streak + 1 : 0));

    setTimeout(() => {
      if (currentIdx + 1 >= exercise.patterns.length) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const score = computeScore(finalCorrect, exercise.patterns.length);
        const grade = (() => {
          if (score >= 90) return { letter: "A+", color: C.success };
          if (score >= 80) return { letter: "A", color: C.success };
          if (score >= 70) return { letter: "B", color: C.teal };
          if (score >= 60) return { letter: "C", color: C.warning };
          return { letter: "D", color: C.error };
        })();
        setResult({ score, correct: finalCorrect, total: exercise.patterns.length, grade });
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
          metadata: { difficulty, type: "rhythm_training", correct: finalCorrect, total: exercise.patterns.length },
        });
        sessionStarted.current = false;
      } else {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setIsRevealed(false);
        setVisualBeats([]);
        setActiveBeat(-1);
      }
      setFeedback(null);
    }, 1200);
  }, [isRevealed, currentPattern, currentIdx, exercise, correct, streak, difficulty, recentScores, endSession, addToast]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      padding: "24px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes beatPulse { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 0.6; } }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🥁</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Rhythm Training</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to the generated rhythm pattern and identify it by name
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
                Pattern {currentIdx + 1} of {exercise.totalQuestions}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                {currentPattern?.timeSignature} at {currentPattern?.bpm} BPM
              </span>
            </div>
            <ProgressBar current={currentIdx + 1} total={exercise.totalQuestions} />
          </div>
        )}

        {exercise && !result && currentPattern && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            {/* Visual beat display */}
            <div style={{
              display: "flex", gap: 8, alignItems: "center", justifyContent: "center",
              flexWrap: "wrap", minHeight: 50,
            }}>
              {visualBeats.map((intensity, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeBeat ? 20 : 14,
                    height: i === activeBeat ? 20 : 14,
                    borderRadius: "50%",
                    background: i === activeBeat
                      ? intensity > 0 ? C.saffron : `${C.textMuted}40`
                      : intensity > 0 ? `${C.saffron}60` : `${C.textMuted}20`,
                    border: i === activeBeat ? `2px solid ${C.saffron}` : "none",
                    transition: "all 0.1s ease-out",
                    animation: i === activeBeat ? "beatPulse 0.3s ease-out" : "none",
                  }}
                />
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <PlayButton onClick={playPattern} isPlaying={isPlaying} size={80} label="Play rhythm" />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>
                {isPlaying ? "Playing pattern..." : "Tap to listen"}
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10, width: "100%", maxWidth: 550,
            }}>
              {exercise.options.map((opt) => (
                <AnswerOption
                  key={opt}
                  answer={opt}
                  isSelected={selected === opt}
                  isCorrect={opt === currentPattern.label}
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🥁</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Train your rhythm recognition
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to generated rhythm patterns from different musical traditions and learn to identify them by name.
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
