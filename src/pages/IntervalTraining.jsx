import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { playNote, stopAll, cleanup } from "../utils/audioEngine";
import {
  generateIntervalTraining,
  validateIntervalTraining,
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

export default function IntervalTraining() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("interval_training");

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
  const [playCount, setPlayCount] = useState(0);

  const timerRef = useRef(null);
  const sessionStarted = useRef(false);

  const currentQuestion = exercise?.questions?.[currentIdx];

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
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
    const ex = generateIntervalTraining(difficulty);
    setExercise(ex);
    setCurrentIdx(0);
    setSelected(null);
    setIsRevealed(false);
    setCorrect(0);
    setStreak(0);
    setFeedback(null);
    setResult(null);
    setPlayCount(0);

    if (!sessionStarted.current) {
      startSession("interval_training");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} interval training` });
  }, [difficulty, startSession, startTimer, addToast]);

  const playInterval = useCallback(() => {
    if (!currentQuestion || isPlaying) return;
    setIsPlaying(true);
    setPlayCount((c) => c + 1);

    // Play base note
    playNote(currentQuestion.baseNote, currentQuestion.baseOctave, {
      duration: 0.8,
      volume: 0.3,
      type: "triangle",
      delay: 0,
      label: "Generated practice tone (base)",
    });

    // Play target note after gap
    playNote(
      currentQuestion.baseNote,
      currentQuestion.baseOctave,
      {
        duration: 0.8,
        volume: 0.3,
        type: "triangle",
        delay: 1.0,
        label: "Generated practice tone (target)",
      }
    );

    // Calculate and play the actual frequency
    const baseFreq = 440 * Math.pow(2, (currentQuestion.baseOctave - 4) + (["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].indexOf(currentQuestion.baseNote) - 9) / 12);
    setTimeout(() => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = currentQuestion.targetFreq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.85);
      setTimeout(() => ctx.close(), 1000);
    }, 1000);

    setTimeout(() => setIsPlaying(false), 2000);
  }, [currentQuestion, isPlaying]);

  const handleAnswer = useCallback((answer) => {
    if (isRevealed || !currentQuestion) return;
    setSelected(answer);
    setIsRevealed(true);

    const isCorrect = validateIntervalTraining(answer, currentQuestion);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setFeedback(getFeedback(isCorrect, isCorrect ? streak + 1 : 0));

    setTimeout(() => {
      if (currentIdx + 1 >= exercise.questions.length) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const score = computeScore(finalCorrect, exercise.questions.length);
        const grade = (() => {
          if (score >= 90) return { letter: "A+", color: C.success };
          if (score >= 80) return { letter: "A", color: C.success };
          if (score >= 70) return { letter: "B", color: C.teal };
          if (score >= 60) return { letter: "C", color: C.warning };
          return { letter: "D", color: C.error };
        })();
        setResult({ score, correct: finalCorrect, total: exercise.questions.length, grade });
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
          metadata: { difficulty, type: "interval_training", correct: finalCorrect, total: exercise.questions.length },
        });
        sessionStarted.current = false;
      } else {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
        setIsRevealed(false);
        setPlayCount(0);
      }
      setFeedback(null);
    }, 1200);
  }, [isRevealed, currentQuestion, currentIdx, exercise, correct, streak, difficulty, recentScores, endSession, addToast]);

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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🎵</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Interval Training</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to two generated practice tones and identify the musical interval between them
          </p>
        </div>

        {/* Controls */}
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
                Question {currentIdx + 1} of {exercise.totalQuestions}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Generated practice tones
              </span>
            </div>
            <ProgressBar current={currentIdx + 1} total={exercise.totalQuestions} />
          </div>
        )}

        {exercise && !result && currentQuestion && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            <div style={{ textAlign: "center" }}>
              <PlayButton onClick={playInterval} isPlaying={isPlaying} size={80} label="Play interval" />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>
                {isPlaying ? "Playing interval..." : playCount === 0 ? "Tap to listen" : "Tap to replay"}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.textMuted, opacity: 0.7 }}>
                Base: {currentQuestion.baseNote}{currentQuestion.baseOctave} → Target: {currentQuestion.semitones} semitones up
              </div>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10, width: "100%", maxWidth: 550,
            }}>
              {exercise.options.map((opt) => (
                <AnswerOption
                  key={opt}
                  answer={opt}
                  isSelected={selected === opt}
                  isCorrect={opt === currentQuestion.correctAnswer}
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Train your interval recognition
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to pairs of generated practice tones and learn to identify the musical intervals between them.
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
