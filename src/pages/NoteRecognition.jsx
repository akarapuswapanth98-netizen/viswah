import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { playNote, stopAll, cleanup } from "../utils/audioEngine";
import {
  generateNoteRecognition,
  validateNoteRecognition,
  computeScore,
  getFeedback,
  getNextDifficulty,
  NOTE_NAMES,
  shuffleArray,
} from "../utils/exerciseEngine";
import {
  C,
  ExerciseCard,
  PlayButton,
  AnswerOption,
  ScoreDisplay,
  ProgressBar,
  FeedbackToast,
  DifficultySelector,
  TimerDisplay,
  StreakDisplay,
} from "../components/musicLab/MusicLabUI";

export default function NoteRecognition() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("note_recognition");

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
  const [options, setOptions] = useState([]);

  const timerRef = useRef(null);
  const sessionStarted = useRef(false);

  const currentNote = exercise?.notes?.[currentIdx];

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

  const generateOptions = useCallback((correctNote, count = 4) => {
    const opts = [correctNote];
    const available = NOTE_NAMES.filter((n) => n !== correctNote);
    const shuffled = shuffleArray(available);
    for (let i = 0; i < count - 1 && i < shuffled.length; i++) {
      opts.push(shuffled[i]);
    }
    return shuffleArray(opts);
  }, []);

  const startExercise = useCallback(() => {
    stopAll();
    const ex = generateNoteRecognition(difficulty);
    setExercise(ex);
    setCurrentIdx(0);
    setSelected(null);
    setIsRevealed(false);
    setCorrect(0);
    setStreak(0);
    setFeedback(null);
    setResult(null);
    setOptions(generateOptions(ex.notes[0].note));

    if (!sessionStarted.current) {
      startSession("note_recognition");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} note recognition` });
  }, [difficulty, startSession, startTimer, addToast, generateOptions]);

  const playCurrentNote = useCallback(() => {
    if (!currentNote || isPlaying) return;
    setIsPlaying(true);
    playNote(currentNote.note, currentNote.octave, {
      duration: 1.2,
      volume: 0.3,
      type: "triangle",
      label: "Generated practice tone",
    });
    setTimeout(() => setIsPlaying(false), 1200);
  }, [currentNote, isPlaying]);

  const handleAnswer = useCallback((answer) => {
    if (isRevealed || !currentNote) return;
    setSelected(answer);
    setIsRevealed(true);

    const isCorrect = answer === currentNote.note;
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setFeedback(getFeedback(isCorrect, isCorrect ? streak + 1 : 0));

    setTimeout(() => {
      if (currentIdx + 1 >= exercise.notes.length) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        const score = computeScore(finalCorrect, exercise.notes.length);
        const grade = (() => {
          if (score >= 90) return { letter: "A+", color: C.success };
          if (score >= 80) return { letter: "A", color: C.success };
          if (score >= 70) return { letter: "B", color: C.teal };
          if (score >= 60) return { letter: "C", color: C.warning };
          return { letter: "D", color: C.error };
        })();
        setResult({ score, correct: finalCorrect, total: exercise.notes.length, grade });
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
          metadata: { difficulty, type: "note_recognition", correct: finalCorrect, total: exercise.notes.length },
        });
        sessionStarted.current = false;
      } else {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setSelected(null);
        setIsRevealed(false);
        setOptions(generateOptions(exercise.notes[nextIdx].note));
      }
      setFeedback(null);
    }, 1200);
  }, [isRevealed, currentNote, currentIdx, exercise, correct, streak, difficulty, recentScores, endSession, addToast, generateOptions]);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.ink,
      padding: "24px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>👂</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>Note Recognition</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to the generated practice tone and identify the note
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
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                color: C.ink,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {result ? "New Exercise" : "Start"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {feedback && <div style={{ marginBottom: 16 }}><FeedbackToast feedback={feedback} /></div>}

        {/* Progress */}
        {exercise && !result && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Question {currentIdx + 1} of {exercise.totalQuestions}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Label: Generated practice tone
              </span>
            </div>
            <ProgressBar current={currentIdx + 1} total={exercise.totalQuestions} />
          </div>
        )}

        {/* Exercise Area */}
        {exercise && !result && currentNote && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 28, padding: "40px 20px",
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
          }}>
            {/* Play button */}
            <div style={{ textAlign: "center" }}>
              <PlayButton
                onClick={playCurrentNote}
                isPlaying={isPlaying}
                size={80}
                label="Play note"
              />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>
                {isPlaying ? "Playing..." : "Tap to listen"}
              </div>
            </div>

            {/* Answer options */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: 10,
              width: "100%",
              maxWidth: 500,
            }}>
              {options.map((opt) => (
                <AnswerOption
                  key={opt}
                  answer={opt}
                  isSelected={selected === opt}
                  isCorrect={opt === currentNote.note}
                  isRevealed={isRevealed}
                  onClick={() => handleAnswer(opt)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
            padding: "40px 20px",
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
          }}>
            <ScoreDisplay
              score={result.score}
              correct={result.correct}
              total={result.total}
              label={difficulty}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={startExercise}
                style={{
                  padding: "12px 28px", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                  color: C.ink, fontSize: 15, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Practice Again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!exercise && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👂</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Ready to train your ear?
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to generated practice tones and identify notes. Your ear will improve with practice.
            </p>
            <button
              onClick={startExercise}
              style={{
                padding: "14px 32px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                color: C.ink, fontSize: 16, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
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
