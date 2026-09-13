import { useState, useEffect, useCallback, useRef } from "react";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useToast } from "../context/ToastContext";
import { worldMusicApi } from "../api/worldMusicApi";
import { playMelody, playRhythmPattern, stopAll, cleanup, MELODIES, RHYTHM_PATTERNS } from "../utils/audioEngine";
import { computeScore, getFeedback, getNextDifficulty, shuffleArray, pickRandom } from "../utils/exerciseEngine";
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

const TRADITION_SCALES = {
  hindustani: { name: "Hindustani", scales: ["Yaman", "Bhairav", "Kafi", "Bhoopali"], region: "South Asia" },
  carnatic: { name: "Carnatic", scales: ["Mayamalavagowla", "Kharaharapriya", "Shankarabharanam"], region: "South Asia" },
  arabic_maqam: { name: "Arabic Maqam", scales: ["Maqam Rast", "Maqam Hijaz", "Maqam Bayati"], region: "Middle East" },
  japanese: { name: "Japanese", scales: ["Yo Scale", "In Scale", "Miyako-bushi"], region: "East Asia" },
  west_african: { name: "West African", scales: ["Pentatonic", "Balafon Scale", "Kora Tuning"], region: "Africa" },
  celtic: { name: "Celtic", scales: ["Dorian", "Mixolydian", "Ionian"], region: "Europe" },
  flamenco: { name: "Flamenco", scales: ["Phrygian Mode", "Spanish Scale", "Sigiriya"], region: "Europe" },
  latin_american: { name: "Latin American", scales: ["Clave Pattern", "Bossa Nova", "Samba"], region: "Latin America" },
};

function generateListeningExercise(difficulty = "beginner") {
  const traditions = Object.keys(TRADITION_SCALES);
  const count = difficulty === "beginner" ? 4 : difficulty === "intermediate" ? 6 : 8;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const traditionKey = pickRandom(traditions);
    const tradition = TRADITION_SCALES[traditionKey];
    const scale = pickRandom(tradition.scales);

    // Generate a short scale/melody snippet for this tradition
    const melodies = difficulty === "beginner" ? MELODIES.beginner : difficulty === "intermediate" ? MELODIES.intermediate : MELODIES.advanced;
    const melody = pickRandom(melodies);

    questions.push({
      traditionKey,
      traditionName: tradition.name,
      region: tradition.region,
      scale,
      melody: melody.notes,
      melodyName: melody.name,
    });
  }

  const allTraditions = shuffleArray(traditions.map((k) => TRADITION_SCALES[k].name)).slice(0,
    difficulty === "beginner" ? 4 : difficulty === "intermediate" ? 5 : 6
  );

  return {
    type: "world_music_listening",
    difficulty,
    questions,
    totalQuestions: count,
    options: allTraditions,
    instructions: [
      "Listen to the generated melody representing a musical tradition",
      "Identify which world music tradition the scale belongs to",
      "Select from the options below",
    ],
  };
}

export default function WorldMusicListening() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("world_music_listening");

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
    const ex = generateListeningExercise(difficulty);
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
      startSession("world_music_listening");
      sessionStarted.current = true;
    }
    startTimer();
    addToast({ type: "info", message: `Starting ${difficulty} world music listening` });
  }, [difficulty, startSession, startTimer, addToast]);

  const playMelodySnippet = useCallback(() => {
    if (!currentQuestion || isPlaying) return;
    setIsPlaying(true);

    const pairs = currentQuestion.melody.map((n) => {
      const note = n.replace(/[0-9]/g, "");
      const octave = parseInt(n.match(/[0-9]/)?.[0] || "4");
      return { note, octave };
    });

    pairs.forEach((_, i) => {
      setTimeout(() => setActiveNoteIdx(i), i * 400);
    });

    playMelody(pairs, {
      noteDuration: 0.3,
      gap: 0.1,
      volume: 0.3,
      type: "triangle",
    });

    setTimeout(() => {
      setIsPlaying(false);
      setActiveNoteIdx(-1);
    }, pairs.length * 400 + 200);
  }, [currentQuestion, isPlaying]);

  const handleAnswer = useCallback((answer) => {
    if (isRevealed || !currentQuestion) return;
    setSelected(answer);
    setIsRevealed(true);

    const isCorrect = answer === currentQuestion.traditionName;
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
          metadata: { difficulty, type: "world_music_listening", correct: finalCorrect, total: exercise.questions.length },
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
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🌍</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>World Music Listening</h1>
          </div>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>
            Listen to generated scales representing world music traditions and identify their origin
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
                Question {currentIdx + 1} of {exercise.totalQuestions}
              </span>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Generated practice tones
              </span>
            </div>
            <ProgressBar current={currentIdx + 1} total={exercise.totalQuestions} color={C.teal} />
          </div>
        )}

        {exercise && !result && currentQuestion && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
            padding: "40px 20px",
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 20,
          }}>
            {/* Visual notes */}
            <div style={{
              display: "flex", gap: 6, alignItems: "center", justifyContent: "center",
              flexWrap: "wrap", minHeight: 40,
            }}>
              {currentQuestion.melody.map((note, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 10px", borderRadius: 8,
                    background: i === activeNoteIdx ? `${C.teal}30` : `${C.textMuted}10`,
                    color: i === activeNoteIdx ? C.teal : C.textMuted,
                    fontSize: 13, fontWeight: 600,
                    border: i === activeNoteIdx ? `1px solid ${C.teal}60` : `1px solid transparent`,
                    transition: "all 0.15s ease-out",
                  }}
                >
                  {note}
                </div>
              ))}
            </div>

            {/* Scale info */}
            <div style={{
              padding: "10px 16px", borderRadius: 12,
              background: `${C.teal}10`,
              border: `1px solid ${C.teal}20`,
              fontSize: 13, color: C.teal, fontWeight: 600,
            }}>
              Scale: {currentQuestion.scale}
            </div>

            <div style={{ textAlign: "center" }}>
              <PlayButton onClick={playMelodySnippet} isPlaying={isPlaying} size={80} label="Play scale" />
              <div style={{ marginTop: 12, fontSize: 13, color: C.textMuted }}>
                {isPlaying ? "Playing scale..." : "Tap to listen"}
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
                  isCorrect={opt === currentQuestion.traditionName}
                  isRevealed={isRevealed}
                  onClick={() => handleAnswer(opt)}
                />
              ))}
            </div>

            {/* Revealed info */}
            {isRevealed && (
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: `${C.saffron}10`,
                border: `1px solid ${C.saffron}20`,
                fontSize: 13, color: C.saffron, textAlign: "center",
              }}>
                {currentQuestion.traditionName} — {currentQuestion.region}
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Explore world music traditions
            </h3>
            <p style={{ color: C.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 24px" }}>
              Listen to generated scales from different musical traditions and learn to identify their origins across the globe.
            </p>
            <button
              onClick={startExercise}
              style={{
                padding: "14px 32px", borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                color: C.ink, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Start Listening
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
