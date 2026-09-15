import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { indianMusicApi } from "../api/indianMusicApi";
import { speechApi } from "../api/speechApi";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useAudioFeedback } from "../hooks/useAudioFeedback";
import { useToast } from "../context/ToastContext";
import { onKeyDown } from "../utils/keyboard";

import C from "../components/ui/colors";

const PHASES = {
  OVERVIEW: "overview",
  LISTEN: "listen",
  AROHANA: "arohana",
  AVAROHANA: "avarohana",
  PHRASES: "phrases",
  PRACTICE: "practice",
  QUIZ: "quiz",
  COMPLETE: "complete",
};

const PHASE_ORDER = [
  PHASES.OVERVIEW,
  PHASES.LISTEN,
  PHASES.AROHANA,
  PHASES.AVAROHANA,
  PHASES.PHRASES,
  PHASES.PRACTICE,
  PHASES.QUIZ,
  PHASES.COMPLETE,
];

const PHASE_LABELS = {
  [PHASES.OVERVIEW]: "Overview",
  [PHASES.LISTEN]: "Listen",
  [PHASES.AROHANA]: "Arohana",
  [PHASES.AVAROHANA]: "Avarohana",
  [PHASES.PHRASES]: "Phrases",
  [PHASES.PRACTICE]: "Practice",
  [PHASES.QUIZ]: "Quiz",
  [PHASES.COMPLETE]: "Complete",
};

const SARGAM_TO_WESTERN = {
  Sa: "C4", Re: "D4", Ga: "E4", Ma: "F4", Pa: "G4", Dha: "A4", Ni: "B4",
  Sa_high: "C5", tivra_Ma: "F#4", komal_Re: "D♭4", komal_Ga: "E♭4",
  komal_Dha: "A♭4", komal_Ni: "B♭4",
};

const WESTERN_DISPLAY = {
  C4: "Sa", D4: "Re", E4: "Ga", F4: "Ma", G4: "Pa", A4: "Dha", B4: "Ni",
  C5: "Sa\u0302", "F#4": "Ma\u266F",
};

function getWesternNote(sargamNote) {
  return SARGAM_TO_WESTERN[sargamNote] || "C4";
}

function getSargamLabel(sargamNote) {
  const map = {
    Sa: "Sa", Re: "Re", Ga: "Ga", Ma: "Ma", Pa: "Pa", Dha: "Dha", Ni: "Ni",
    Sa_high: "Sa\u0302", tivra_Ma: "Ma\u266F", komal_Re: "Re\u266D",
    komal_Ga: "Ga\u266D", komal_Dha: "Dha\u266D", komal_Ni: "Ni\u266D",
  };
  return map[sargamNote] || sargamNote;
}

function normalizeRagaNotes(arohana) {
  if (!arohana || !Array.isArray(arohana)) return [];
  return arohana.map((n) => {
    if (n === "tivra_Ma") return "tivra_Ma";
    if (n === "komal_Re") return "komal_Re";
    if (n === "komal_Ga") return "komal_Ga";
    if (n === "komal_Dha") return "komal_Dha";
    if (n === "komal_Ni") return "komal_Ni";
    if (n === "Sa_high") return "Sa_high";
    return n;
  });
}

function scoreToGrade(score) {
  if (score >= 90) return { letter: "A+", color: C.success, label: "Excellent" };
  if (score >= 80) return { letter: "A", color: C.success, label: "Great" };
  if (score >= 70) return { letter: "B", color: C.secondary, label: "Good" };
  if (score >= 60) return { letter: "C", color: C.warning, label: "Fair" };
  return { letter: "D", color: C.error, label: "Needs Practice" };
}

function generateQuizQuestions(raga) {
  const questions = [];
  const options6 = (correct, distractors) => {
    const opts = [correct, ...distractors];
    while (opts.length < 4) opts.push("None of the above");
    return opts.sort(() => Math.random() - 0.5);
  };

  if (raga.thaat) {
    const allThaats = ["bilawal", "khamaj", "bhairav", "kafi", "asavari", "bhairavi", "marwa", "purvi", "todi", "yaman", "bhoopali"];
    const distractors = allThaats.filter((t) => t !== raga.thaat).slice(0, 3);
    questions.push({
      question: `Which thaat does ${raga.name} belong to?`,
      options: options6(raga.thaat, distractors),
      correct_answer: raga.thaat,
    });
  }

  if (raga.vadi) {
    const allNotes = ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni"];
    const distractors = allNotes.filter((n) => n !== raga.vadi).slice(0, 3);
    questions.push({
      question: `What is the vadi (most important note) of ${raga.name}?`,
      options: options6(raga.vadi, distractors),
      correct_answer: raga.vadi,
    });
  }

  if (raga.samvadi) {
    const allNotes = ["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni"];
    const distractors = allNotes.filter((n) => n !== raga.samvadi).slice(0, 3);
    questions.push({
      question: `What is the samvadi (second most important note) of ${raga.name}?`,
      options: options6(raga.samvadi, distractors),
      correct_answer: raga.samvadi,
    });
  }

  if (raga.mood) {
    const allMoods = ["Peaceful, devotional", "Intense, passionate", "Playful, romantic", "Melancholic, longing", "Energetic, heroic"];
    const moodWords = raga.mood.split(",").map((m) => m.trim());
    const primaryMood = moodWords[0];
    const distractors = allMoods.filter((m) => !m.toLowerCase().includes(primaryMood.toLowerCase())).slice(0, 3);
    questions.push({
      question: `What is the mood/character of ${raga.name}?`,
      options: options6(raga.mood, distractors),
      correct_answer: raga.mood,
    });
  }

  if (raga.arohana && raga.arohana.length > 0) {
    const correctSeq = raga.arohana.map(getSargamLabel).join(" → ");
    const wrongSeq = [...raga.arohana].reverse().map(getSargamLabel).join(" → ");
    const shuffledNotes = [...raga.arohana].sort(() => Math.random() - 0.5).map(getSargamLabel).join(" → ");
    questions.push({
      question: `What is the correct arohana (ascending) of ${raga.name}?`,
      options: [correctSeq, wrongSeq, shuffledNotes, "Sa → Pa → Dha → Ni → Sa\u0302"].sort(() => Math.random() - 0.5),
      correct_answer: correctSeq,
    });
  }

  if (raga.time) {
    const allTimes = ["Morning", "Afternoon", "Evening", "Night", "Late Night", "Sunset"];
    const primaryTime = raga.time.split("(")[0].trim().split(" ")[0];
    const distractors = allTimes.filter((t) => t !== primaryTime).slice(0, 3);
    questions.push({
      question: `At what time of day is ${raga.name} typically performed?`,
      options: options6(raga.time, distractors),
      correct_answer: raga.time,
    });
  }

  return questions.sort(() => Math.random() - 0.5).slice(0, 5);
}

export default function RagaLearning() {
  const { ragaId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("raga_learning");
  const { buttonClick, navChime, completion, error: errorTone } = useAudioFeedback();

  const [raga, setRaga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(PHASES.OVERVIEW);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [practiceMode, setPracticeMode] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [practiceScore, setPracticeScore] = useState(null);
  const [micDenied, setMicDenied] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [sessionScores, setSessionScores] = useState([]);
  const [bestScore, setBestScore] = useState(null);
  const [latestScore, setLatestScore] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef(null);
  const startTimeRef = useRef(null);
  const practiceStartTime = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) setBrowserSupported(false);
    fetchRaga();
    return () => cleanup();
  }, [ragaId]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const fetchRaga = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indianMusicApi.getRaga(ragaId);
      const data = res.data ?? res;
      const ragaData = data?.data || data;
      if (!ragaData || !ragaData.id) {
        setError("Raga not found");
        return;
      }
      setRaga(ragaData);
    } catch (err) {
      setError(err.message || "Failed to load raga");
      addToast({ type: "error", message: "Failed to load raga" });
    } finally {
      setLoading(false);
    }
  }, [ragaId, addToast]);

  const goToPhase = useCallback((targetPhase) => {
    setPhase(targetPhase);
    setCurrentNoteIndex(-1);
    setAnalysisResult(null);
    setPracticeScore(null);
    setMicDenied(false);
    cleanup();
    navChime();
  }, [navChime]);

  const markPhaseComplete = useCallback((p) => {
    setCompletedPhases((prev) => {
      const next = new Set(prev);
      next.add(p);
      return next;
    });
  }, []);

  const startNextPhase = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < PHASE_ORDER.length - 1) {
      markPhaseComplete(phase);
      goToPhase(PHASE_ORDER[idx + 1]);
    }
  }, [phase, markPhaseComplete, goToPhase]);

  const goToPreviousPhase = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx > 0) {
      goToPhase(PHASE_ORDER[idx - 1]);
    }
  }, [phase, goToPhase]);

  const startPractice = useCallback((mode) => {
    setPracticeMode(mode);
    setAnalysisResult(null);
    setPracticeScore(null);
    practiceStartTime.current = Date.now();
    startSession(mode);
    goToPhase(PHASES.PRACTICE);
  }, [startSession, goToPhase]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, width, height);
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, C.raga);
      gradient.addColorStop(0.5, C.primary);
      gradient.addColorStop(1, C.secondary);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const handleStartRecording = useCallback(async () => {
    setMicDenied(false);
    setAnalysisResult(null);
    setPracticeScore(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => analyzeRecording();
      recorder.start(100);
      drawWaveform();
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicDenied(true);
        addToast({ type: "error", message: "Microphone access denied. Please allow microphone access in your browser settings." });
      } else {
        addToast({ type: "error", message: err.message || "Failed to start recording" });
      }
    }
  }, [drawWaveform, addToast]);

  const handleStopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
  }, []);

  const analyzeRecording = useCallback(async () => {
    setAnalyzing(true);
    let audioCtx = null;
    try {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const arrayBuffer = await audioBlob.arrayBuffer();
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await Promise.race([
        audioCtx.decodeAudioData(arrayBuffer),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Audio decode timed out")), 10000)),
      ]);
      const channelData = Array.from(audioBuffer.getChannelData(0));
      const sampleRate = audioBuffer.sampleRate;

      const targetNotes = practiceMode === "arohana"
        ? normalizeRagaNotes(raga.arohana)
        : practiceMode === "avarohana"
        ? normalizeRagaNotes(raga.avarohana)
        : practiceMode === "phrases" && raga.phrases && raga.phrases[0]
        ? normalizeRagaNotes(raga.arohana)
        : normalizeRagaNotes(raga.arohana);

      const targetWestern = targetNotes.map(getWesternNote);
      const primaryTarget = targetWestern[Math.floor(targetWestern.length / 2)] || "C4";

      const [pitchRes, scoreRes] = await Promise.allSettled([
        speechApi.analyzePitch({ audio_data: channelData, sample_rate: sampleRate }),
        speechApi.score({ audio_data: channelData, target_note: primaryTarget, sample_rate: sampleRate }),
      ]);

      let pitchData = null;
      let scoreData = null;

      if (pitchRes.status === "fulfilled") {
        pitchData = pitchRes.value.data ?? pitchRes.value;
      }
      if (scoreRes.status === "fulfilled") {
        scoreData = scoreRes.value.data ?? scoreRes.value;
      }

      const score = scoreData?.score ?? 0;
      const feedback = generatePracticeFeedback(pitchData, scoreData, practiceMode, raga);
      const result = {
        pitch: pitchData,
        score,
        feedback,
        targetNotes: targetWestern,
        detectedNote: pitchData?.note || "Unknown",
        stability: pitchData?.stability || 0,
        cents: pitchData?.cents || 0,
      };

      setAnalysisResult(result);
      setPracticeScore(score);
      setLatestScore(score);
      setSessionScores((prev) => [...prev, score]);
      if (bestScore === null || score > bestScore) setBestScore(score);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to analyze audio" });
    } finally {
      if (audioCtx) audioCtx.close().catch(() => {});
      setAnalyzing(false);
    }
  }, [practiceMode, raga, bestScore, addToast]);

  const handleEndPracticeSession = useCallback(() => {
    const duration = practiceStartTime.current ? Math.round((Date.now() - practiceStartTime.current) / 1000) : 0;
    const avgScore = sessionScores.length > 0
      ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
      : practiceScore;
    endSession({
      activityId: practiceMode || "raga_practice",
      score: avgScore,
      completed: true,
      metadata: {
        raga_id: raga?.id,
        raga_name: raga?.name,
        practice_mode: practiceMode,
        attempts: sessionScores.length,
        best_score: bestScore,
      },
    });
    practiceStartTime.current = null;
    markPhaseComplete(PHASES.PRACTICE);
    startNextPhase();
  }, [practiceMode, raga, sessionScores, practiceScore, bestScore, endSession, markPhaseComplete, startNextPhase]);

  const handleStartQuiz = useCallback(() => {
    const questions = generateQuizQuestions(raga);
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    goToPhase(PHASES.QUIZ);
  }, [raga, goToPhase]);

  const handleQuizAnswer = useCallback((questionIdx, answer) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIdx]: answer }));
  }, []);

  const handleQuizSubmit = useCallback(() => {
    let correct = 0;
    quizQuestions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / quizQuestions.length) * 100);
    setQuizResult({ score, correct, total: quizQuestions.length });
    setQuizSubmitted(true);
    setLatestScore(score);
    markPhaseComplete(PHASES.QUIZ);
  }, [quizQuestions, quizAnswers, markPhaseComplete]);

  const handleCompleteRaga = useCallback(() => {
    markPhaseComplete(PHASES.COMPLETE);
    completion();
    goToPhase(PHASES.COMPLETE);
  }, [markPhaseComplete, completion, goToPhase]);

  const getPhaseProgress = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    return ((idx + 1) / PHASE_ORDER.length) * 100;
  }, [phase]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48,
            border: `3px solid ${C.border}`,
            borderTopColor: C.raga,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Loading raga...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !raga) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: 40, textAlign: "center", maxWidth: 400,
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>🎵</div>
          <h2 style={{ color: C.text, fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px" }}>
            {error || "Raga not found"}
          </h2>
          <p style={{ color: C.textMuted, fontSize: "0.9rem", marginBottom: 20 }}>
            The raga you're looking for couldn't be loaded.
          </p>
          <button
            onClick={() => navigate("/ragas")}
            style={{
              padding: "12px 28px", borderRadius: 10,
              background: C.primary, color: C.ink, border: "none",
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            Back to Ragas
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const arohana = normalizeRagaNotes(raga.arohana || []);
  const avarohana = normalizeRagaNotes(raga.avarohana || []);
  const phrases = raga.phrases || [];

  return (
    <div style={{ minHeight: "100vh", background: C.ink, padding: "20px", position: "relative" }}>
      {/* Ambient light */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 30% 20%, rgba(199, 125, 186, 0.04), transparent 70%),
                     radial-gradient(ellipse 50% 35% at 70% 80%, rgba(232, 168, 56, 0.03), transparent 60%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/ragas")}
              style={{
                padding: "8px 16px", borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.textSecondary, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
              }}
              onKeyDown={(e) => onKeyDown(e, () => navigate("/ragas"))}
            >
              ← Ragas
            </button>
            <div>
              <h1 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                {raga.name}
              </h1>
              <p style={{ color: C.textMuted, fontSize: "0.85rem", margin: 0 }}>
                {raga.thaat && `Thaat: ${raga.thaat}`}{raga.thaat && raga.time && " · "}{raga.time && raga.time}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {bestScore !== null && (
              <span style={{
                padding: "4px 12px", borderRadius: 8,
                background: `${C.success}15`, color: C.success,
                fontSize: "0.8rem", fontWeight: 600,
              }}>
                Best: {bestScore}%
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4, borderRadius: 2, background: C.elevated,
          marginBottom: 24, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${C.raga}, ${C.primary})`,
            width: `${getPhaseProgress()}%`,
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Phase navigation */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 28, overflowX: "auto",
          paddingBottom: 4, scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch",
          maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 100%)",
        }}>
          {PHASE_ORDER.map((p, i) => {
            const isActive = p === phase;
            const isComplete = completedPhases.has(p);
            return (
              <button
                key={p}
                onClick={() => goToPhase(p)}
                style={{
                  padding: "6px 14px", borderRadius: 8, flexShrink: 0,
                  background: isActive ? `${C.raga}20` : isComplete ? `${C.success}10` : "transparent",
                  border: `1px solid ${isActive ? C.raga + "40" : isComplete ? C.success + "25" : C.border}`,
                  color: isActive ? C.raga : isComplete ? C.success : C.textMuted,
                  fontSize: "0.78rem", fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onKeyDown={(e) => onKeyDown(e, () => goToPhase(p))}
              >
                {isComplete && <span style={{ fontSize: 10 }}>✓</span>}
                {PHASE_LABELS[p]}
              </button>
            );
          })}
        </div>

        {/* =================== OVERVIEW PHASE =================== */}
        {phase === PHASES.OVERVIEW && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.raga}, ${C.primary})`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.8rem", fontWeight: 700, margin: "0 0 4px" }}>
                {raga.name}
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.95rem", margin: "0 0 24px" }}>
                {raga.description || "An exploration of this raga's melodic identity"}
              </p>

              {/* Key characteristics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
                {raga.thaat && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Thaat</p>
                    <p style={{ color: C.primary, fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{raga.thaat}</p>
                  </div>
                )}
                {raga.vadi && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Vadi</p>
                    <p style={{ color: C.raga, fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{raga.vadi}</p>
                  </div>
                )}
                {raga.samvadi && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Samvadi</p>
                    <p style={{ color: C.secondary, fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{raga.samvadi}</p>
                  </div>
                )}
                {raga.time && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Time</p>
                    <p style={{ color: C.text, fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{raga.time}</p>
                  </div>
                )}
                {raga.mood && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16, gridColumn: "span 2" }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>Mood / Character</p>
                    <p style={{ color: C.text, fontSize: "0.95rem", margin: 0, lineHeight: 1.5 }}>{raga.mood}</p>
                  </div>
                )}
              </div>

              {/* What you'll learn */}
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ color: C.primary, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
                  What You'll Learn
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Listen", desc: "Hear the raga's ascending and descending movement" },
                    { label: "Arohana", desc: `Master the ascending sequence: ${arohana.map(getSargamLabel).join(" → ")}` },
                    { label: "Avarohana", desc: `Master the descending sequence: ${avarohana.map(getSargamLabel).join(" → ")}` },
                    { label: "Phrases", desc: `Explore ${phrases.length} characteristic phrase${phrases.length !== 1 ? "s" : ""}` },
                    { label: "Practice", desc: "Record yourself and get real pitch feedback" },
                    { label: "Quiz", desc: "Test your knowledge of this raga" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "10px 14px", borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                    }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${C.raga}15`, color: C.raga,
                        fontSize: 11, fontWeight: 700,
                      }}>{i + 1}</span>
                      <div>
                        <span style={{ color: C.text, fontWeight: 600, fontSize: "0.9rem" }}>{item.label}: </span>
                        <span style={{ color: C.textSecondary, fontSize: "0.85rem" }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arohana preview */}
              {arohana.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: C.primary, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
                    Arohana Preview
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {arohana.map((n, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: i === 0 ? `${C.primary}18` : C.elevated,
                        border: `1px solid ${i === 0 ? C.primary + "35" : C.border}`,
                        color: i === 0 ? C.primary : C.text,
                        fontSize: "0.9rem", fontWeight: i === 0 ? 700 : 600,
                      }}>
                        {getSargamLabel(n)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Avarohana preview */}
              {avarohana.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ color: C.primary, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
                    Avarohana Preview
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {avarohana.map((n, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 8,
                        background: i === 0 ? `${C.raga}18` : C.elevated,
                        border: `1px solid ${i === 0 ? C.raga + "35" : C.border}`,
                        color: i === 0 ? C.raga : C.text,
                        fontSize: "0.9rem", fontWeight: i === 0 ? 700 : 600,
                      }}>
                        {getSargamLabel(n)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={startNextPhase}
                style={{
                  padding: "14px 32px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
                  border: "none", color: C.ink, fontSize: "1rem", fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
                }}
                onKeyDown={(e) => onKeyDown(e, startNextPhase)}
              >
                Begin Learning →
              </button>
            </div>
          </div>
        )}

        {/* =================== LISTEN PHASE =================== */}
        {phase === PHASES.LISTEN && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.raga}, ${C.secondary})`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                Listen to {raga.name}
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: "0 0 24px" }}>
                Study the ascending and descending movement of this raga
              </p>

              {/* Arohana visualization */}
              {arohana.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ color: C.primary, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
                    Ascending (Arohana)
                  </h3>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
                    padding: 16, borderRadius: 12, background: C.elevated,
                  }}>
                    {arohana.map((n, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                          padding: "10px 18px", borderRadius: 10,
                          background: currentNoteIndex === i ? `${C.primary}25` : "transparent",
                          border: `1px solid ${currentNoteIndex === i ? C.primary + "50" : "transparent"}`,
                          color: currentNoteIndex === i ? C.primary : C.text,
                          fontSize: "1rem", fontWeight: currentNoteIndex === i ? 700 : 600,
                          transition: "all 0.3s ease",
                        }}>
                          {getSargamLabel(n)}
                        </span>
                        {i < arohana.length - 1 && (
                          <span style={{ color: C.textMuted, fontSize: "0.8rem" }}>→</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      let idx = 0;
                      setCurrentNoteIndex(0);
                      const interval = setInterval(() => {
                        idx++;
                        if (idx >= arohana.length) {
                          clearInterval(interval);
                          setTimeout(() => setCurrentNoteIndex(-1), 500);
                          return;
                        }
                        setCurrentNoteIndex(idx);
                      }, 600);
                    }}
                    style={{
                      marginTop: 12, padding: "10px 20px", borderRadius: 10,
                      background: `${C.primary}15`, border: `1px solid ${C.primary}30`,
                      color: C.primary, fontWeight: 600, fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                    onKeyDown={(e) => onKeyDown(e, () => {})}
                  >
                    ▶ Trace Arohana
                  </button>
                </div>
              )}

              {/* Avarohana visualization */}
              {avarohana.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ color: C.raga, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>
                    Descending (Avarohana)
                  </h3>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
                    padding: 16, borderRadius: 12, background: C.elevated,
                  }}>
                    {avarohana.map((n, i) => (
                      <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{
                          padding: "10px 18px", borderRadius: 10,
                          background: currentNoteIndex === i ? `${C.raga}25` : "transparent",
                          border: `1px solid ${currentNoteIndex === i ? C.raga + "50" : "transparent"}`,
                          color: currentNoteIndex === i ? C.raga : C.text,
                          fontSize: "1rem", fontWeight: currentNoteIndex === i ? 700 : 600,
                          transition: "all 0.3s ease",
                        }}>
                          {getSargamLabel(n)}
                        </span>
                        {i < avarohana.length - 1 && (
                          <span style={{ color: C.textMuted, fontSize: "0.8rem" }}>→</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      let idx = 0;
                      setCurrentNoteIndex(0);
                      const interval = setInterval(() => {
                        idx++;
                        if (idx >= avarohana.length) {
                          clearInterval(interval);
                          setTimeout(() => setCurrentNoteIndex(-1), 500);
                          return;
                        }
                        setCurrentNoteIndex(idx);
                      }, 600);
                    }}
                    style={{
                      marginTop: 12, padding: "10px 20px", borderRadius: 10,
                      background: `${C.raga}15`, border: `1px solid ${C.raga}30`,
                      color: C.raga, fontWeight: 600, fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                    onKeyDown={(e) => onKeyDown(e, () => {})}
                  >
                    ▶ Trace Avarohana
                  </button>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={startNextPhase}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.secondary}, ${C.secondary}CC)`,
                    border: "none", color: C.ink, fontSize: "0.95rem", fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, startNextPhase)}
                >
                  Continue →
                </button>
                <button
                  onClick={goToPreviousPhase}
                  style={{
                    padding: "14px 24px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, goToPreviousPhase)}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== AROHANA PHASE =================== */}
        {phase === PHASES.AROHANA && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.primary}, ${C.primary}AA)`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                Arohana — Ascending Sequence
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: "0 0 24px" }}>
                Learn the ascending note movement of {raga.name}
              </p>

              {/* Interactive note trace */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
                padding: 24, borderRadius: 16, background: C.elevated, marginBottom: 24,
              }}>
                {arohana.map((n, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setCurrentNoteIndex(i)}
                      style={{
                        width: 64, height: 64, borderRadius: 12,
                        background: currentNoteIndex === i
                          ? `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`
                          : "rgba(255,255,255,0.04)",
                        border: `2px solid ${currentNoteIndex === i ? C.primary : C.border}`,
                        color: currentNoteIndex === i ? C.ink : C.text,
                        fontSize: "1.1rem", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onKeyDown={(e) => onKeyDown(e, () => setCurrentNoteIndex(i))}
                      aria-label={`Note ${i + 1}: ${getSargamLabel(n)}`}
                    >
                      {getSargamLabel(n)}
                    </button>
                    {i < arohana.length - 1 && (
                      <span style={{ color: C.textMuted, fontSize: "1.2rem" }}>→</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Current note detail */}
              {currentNoteIndex >= 0 && currentNoteIndex < arohana.length && (
                <div style={{
                  background: `${C.primary}08`, border: `1px solid ${C.primary}18`,
                  borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "center",
                }}>
                  <p style={{ color: C.primary, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>
                    Note {currentNoteIndex + 1} of {arohana.length}
                  </p>
                  <p style={{ color: C.text, fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>
                    {getSargamLabel(arohana[currentNoteIndex])}
                  </p>
                  <p style={{ color: C.textSecondary, fontSize: "0.85rem", margin: 0 }}>
                    Western: {getWesternNote(arohana[currentNoteIndex])}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => { markPhaseComplete(PHASES.AROHANA); startNextPhase(); }}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
                    border: "none", color: C.ink, fontSize: "0.95rem", fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => { markPhaseComplete(PHASES.AROHANA); startNextPhase(); })}
                >
                  I Know This →
                </button>
                <button
                  onClick={goToPreviousPhase}
                  style={{
                    padding: "14px 24px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, goToPreviousPhase)}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== AVAROHANA PHASE =================== */}
        {phase === PHASES.AVAROHANA && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.raga}, ${C.raga}AA)`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                Avarohana — Descending Sequence
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: "0 0 24px" }}>
                Learn the descending note movement of {raga.name}
              </p>

              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
                padding: 24, borderRadius: 16, background: C.elevated, marginBottom: 24,
              }}>
                {avarohana.map((n, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setCurrentNoteIndex(i)}
                      style={{
                        width: 64, height: 64, borderRadius: 12,
                        background: currentNoteIndex === i
                          ? `linear-gradient(135deg, ${C.raga}, ${C.raga}CC)`
                          : "rgba(255,255,255,0.04)",
                        border: `2px solid ${currentNoteIndex === i ? C.raga : C.border}`,
                        color: currentNoteIndex === i ? "#fff" : C.text,
                        fontSize: "1.1rem", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s ease",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      onKeyDown={(e) => onKeyDown(e, () => setCurrentNoteIndex(i))}
                      aria-label={`Note ${i + 1}: ${getSargamLabel(n)}`}
                    >
                      {getSargamLabel(n)}
                    </button>
                    {i < avarohana.length - 1 && (
                      <span style={{ color: C.textMuted, fontSize: "1.2rem" }}>→</span>
                    )}
                  </span>
                ))}
              </div>

              {currentNoteIndex >= 0 && currentNoteIndex < avarohana.length && (
                <div style={{
                  background: `${C.raga}08`, border: `1px solid ${C.raga}18`,
                  borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "center",
                }}>
                  <p style={{ color: C.raga, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>
                    Note {currentNoteIndex + 1} of {avarohana.length}
                  </p>
                  <p style={{ color: C.text, fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>
                    {getSargamLabel(avarohana[currentNoteIndex])}
                  </p>
                  <p style={{ color: C.textSecondary, fontSize: "0.85rem", margin: 0 }}>
                    Western: {getWesternNote(avarohana[currentNoteIndex])}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => { markPhaseComplete(PHASES.AVAROHANA); startNextPhase(); }}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.raga}, ${C.raga}CC)`,
                    border: "none", color: "#fff", fontSize: "0.95rem", fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => { markPhaseComplete(PHASES.AVAROHANA); startNextPhase(); })}
                >
                  I Know This →
                </button>
                <button
                  onClick={goToPreviousPhase}
                  style={{
                    padding: "14px 24px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, goToPreviousPhase)}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== PHRASES PHASE =================== */}
        {phase === PHASES.PHRASES && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.secondary}, ${C.secondary}AA)`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                Characteristic Phrases
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: "0 0 24px" }}>
                Explore the characteristic phrases of {raga.name}
              </p>

              {phrases.length === 0 ? (
                <div style={{
                  background: C.elevated, borderRadius: 12, padding: 32,
                  textAlign: "center", marginBottom: 24,
                }}>
                  <p style={{ color: C.textMuted, fontSize: "0.9rem", margin: 0 }}>
                    No characteristic phrases available for this raga.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {phrases.map((phrase, i) => (
                    <div key={i} style={{
                      background: C.elevated, borderRadius: 12, padding: 18,
                      border: `1px solid ${currentNoteIndex === i ? C.secondary + "40" : C.border}`,
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${C.secondary}15`, color: C.secondary,
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "1rem", color: C.text, fontWeight: 600,
                        }}>
                          {phrase}
                        </span>
                      </div>
                      <p style={{ color: C.textMuted, fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                        Listen for this phrase's movement and try to sing it back
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => { markPhaseComplete(PHASES.PHRASES); startNextPhase(); }}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.secondary}, ${C.secondary}CC)`,
                    border: "none", color: C.ink, fontSize: "0.95rem", fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => { markPhaseComplete(PHASES.PHRASES); startNextPhase(); })}
                >
                  Start Practice →
                </button>
                <button
                  onClick={goToPreviousPhase}
                  style={{
                    padding: "14px 24px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, goToPreviousPhase)}
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== PRACTICE PHASE =================== */}
        {phase === PHASES.PRACTICE && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.secondary}, ${C.primary})`,
              }} />

              <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                Practice — {practiceMode === "arohana" ? "Arohana" : practiceMode === "avarohana" ? "Avarohana" : "Raga"}
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: "0 0 20px" }}>
                {practiceMode
                  ? `Sing the ${practiceMode} sequence and get real pitch feedback`
                  : "Choose what to practice"}
              </p>

              {!practiceMode && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {arohana.length > 0 && (
                    <button
                      onClick={() => startPractice("arohana")}
                      style={{
                        padding: 20, borderRadius: 12,
                        background: C.elevated, border: `1px solid ${C.border}`,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onKeyDown={(e) => onKeyDown(e, () => startPractice("arohana"))}
                    >
                      <p style={{ color: C.primary, fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px" }}>Arohana</p>
                      <p style={{ color: C.textMuted, fontSize: "0.8rem", margin: 0 }}>Practice ascending</p>
                    </button>
                  )}
                  {avarohana.length > 0 && (
                    <button
                      onClick={() => startPractice("avarohana")}
                      style={{
                        padding: 20, borderRadius: 12,
                        background: C.elevated, border: `1px solid ${C.border}`,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onKeyDown={(e) => onKeyDown(e, () => startPractice("avarohana"))}
                    >
                      <p style={{ color: C.raga, fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px" }}>Avarohana</p>
                      <p style={{ color: C.textMuted, fontSize: "0.8rem", margin: 0 }}>Practice descending</p>
                    </button>
                  )}
                  <button
                    onClick={() => startPractice("arohana")}
                    style={{
                      padding: 20, borderRadius: 12,
                      background: C.elevated, border: `1px solid ${C.border}`,
                      cursor: "pointer", textAlign: "left",
                    }}
                    onKeyDown={(e) => onKeyDown(e, () => startPractice("arohana"))}
                  >
                    <p style={{ color: C.secondary, fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px" }}>Full Raga</p>
                    <p style={{ color: C.textMuted, fontSize: "0.8rem", margin: 0 }}>Practice both</p>
                  </button>
                </div>
              )}

              {practiceMode && !browserSupported && (
                <div style={{
                  background: `${C.error}10`, border: `1px solid ${C.error}25`,
                  borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 24,
                }}>
                  <p style={{ color: C.error, fontSize: "0.9rem", margin: 0 }}>
                    Your browser does not support audio recording. Please use a modern browser.
                  </p>
                </div>
              )}

              {practiceMode && !isRecording && !analyzing && !analysisResult && (
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  {/* Target notes display */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    {(practiceMode === "arohana" ? arohana : avarohana).map((n, i) => (
                      <span key={i} style={{
                        padding: "8px 16px", borderRadius: 10,
                        background: C.elevated, border: `1px solid ${C.border}`,
                        color: C.text, fontSize: "0.95rem", fontWeight: 600,
                      }}>
                        {getSargamLabel(n)}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={handleStartRecording}
                    style={{
                      width: 80, height: 80, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.error}, #FF6B6B)`,
                      border: "none", color: "#fff", fontSize: "2rem",
                      cursor: "pointer", boxShadow: "0 4px 24px rgba(212, 106, 106, 0.3)",
                    }}
                    aria-label="Start recording"
                    onKeyDown={(e) => onKeyDown(e, handleStartRecording)}
                  >
                    ●
                  </button>
                  <p style={{ color: C.textMuted, fontSize: "0.8rem", marginTop: 8 }}>Tap to record</p>
                </div>
              )}

              {isRecording && (
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    style={{
                      width: "100%", maxWidth: 400, height: 100,
                      borderRadius: 12, background: C.elevated, marginBottom: 12,
                    }}
                  />
                  <p style={{ color: C.error, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                    {recordingTime}s
                  </p>
                  <button
                    onClick={handleStopRecording}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: C.elevated, border: `2px solid ${C.error}`,
                      color: C.error, fontSize: "1.2rem",
                      cursor: "pointer",
                    }}
                    aria-label="Stop recording"
                    onKeyDown={(e) => onKeyDown(e, handleStopRecording)}
                  >
                    ■
                  </button>
                </div>
              )}

              {analyzing && (
                <div style={{ textAlign: "center", padding: 40, marginBottom: 24 }}>
                  <div style={{
                    width: 48, height: 48,
                    border: `3px solid ${C.border}`,
                    borderTopColor: C.raga,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px",
                  }} />
                  <p style={{ color: C.textSecondary, fontSize: "0.9rem" }}>Analyzing your performance...</p>
                </div>
              )}

              {analysisResult && !analyzing && (
                <div style={{ marginBottom: 24 }}>
                  {/* Score */}
                  <div style={{
                    textAlign: "center", padding: 24, borderRadius: 16,
                    background: C.elevated, marginBottom: 20,
                  }}>
                    <p style={{ color: C.textMuted, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>
                      Your Score
                    </p>
                    <p style={{
                      color: scoreToGrade(practiceScore).color,
                      fontSize: "3rem", fontWeight: 800, margin: "0 0 4px",
                    }}>
                      {practiceScore}%
                    </p>
                    <p style={{ color: C.textSecondary, fontSize: "0.9rem", margin: 0 }}>
                      {scoreToGrade(practiceScore).label}
                    </p>
                  </div>

                  {/* Pitch details */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
                    {analysisResult.detectedNote && analysisResult.detectedNote !== "Unknown" && (
                      <div style={{ background: C.elevated, borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Detected</p>
                        <p style={{ color: C.primary, fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>{analysisResult.detectedNote}</p>
                      </div>
                    )}
                    {analysisResult.stability > 0 && (
                      <div style={{ background: C.elevated, borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Stability</p>
                        <p style={{ color: C.secondary, fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>{Math.round(analysisResult.stability)}%</p>
                      </div>
                    )}
                    {analysisResult.cents !== 0 && (
                      <div style={{ background: C.elevated, borderRadius: 10, padding: 14, textAlign: "center" }}>
                        <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Cents Off</p>
                        <p style={{
                          color: Math.abs(analysisResult.cents) < 25 ? C.success : Math.abs(analysisResult.cents) < 50 ? C.warning : C.error,
                          fontSize: "1.3rem", fontWeight: 700, margin: 0,
                        }}>{analysisResult.cents > 0 ? "+" : ""}{Math.round(analysisResult.cents)}</p>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {analysisResult.feedback && (
                    <div style={{
                      background: `${C.secondary}08`, border: `1px solid ${C.secondary}18`,
                      borderRadius: 12, padding: 16, marginBottom: 20,
                    }}>
                      <p style={{ color: C.secondary, fontSize: "0.8rem", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>
                        Feedback
                      </p>
                      {analysisResult.feedback.map((f, i) => (
                        <p key={i} style={{ color: C.textSecondary, fontSize: "0.85rem", margin: "0 0 4px", lineHeight: 1.5 }}>
                          • {f}
                        </p>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setAnalysisResult(null); setPracticeScore(null); }}
                      style={{
                        padding: "12px 24px", borderRadius: 10,
                        background: `${C.primary}15`, border: `1px solid ${C.primary}30`,
                        color: C.primary, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                      }}
                      onKeyDown={(e) => onKeyDown(e, () => { setAnalysisResult(null); setPracticeScore(null); })}
                    >
                      Practice Again
                    </button>
                    <button
                      onClick={handleEndPracticeSession}
                      style={{
                        padding: "12px 24px", borderRadius: 10,
                        background: `linear-gradient(135deg, ${C.secondary}, ${C.secondary}CC)`,
                        border: "none", color: C.ink, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                      }}
                      onKeyDown={(e) => onKeyDown(e, handleEndPracticeSession)}
                    >
                      Continue to Quiz →
                    </button>
                  </div>
                </div>
              )}

              {practiceMode && (
                <button
                  onClick={() => { setPracticeMode(null); setAnalysisResult(null); setPracticeScore(null); }}
                  style={{
                    padding: "10px 20px", borderRadius: 10,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textMuted, fontSize: "0.85rem", cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => { setPracticeMode(null); setAnalysisResult(null); setPracticeScore(null); })}
                >
                  ← Change Practice Mode
                </button>
              )}

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}

        {/* =================== QUIZ PHASE =================== */}
        {phase === PHASES.QUIZ && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.primary}, ${C.raga})`,
              }} />

              {!quizSubmitted ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                      <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 4px" }}>
                        Raga Quiz
                      </h2>
                      <p style={{ color: C.textSecondary, fontSize: "0.85rem", margin: 0 }}>
                        Question {quizIndex + 1} of {quizQuestions.length}
                      </p>
                    </div>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: C.elevated, display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${C.primary}40`,
                    }}>
                      <span style={{ color: C.primary, fontSize: "1rem", fontWeight: 700 }}>
                        {quizQuestions.length > 0 ? Math.round(((quizIndex + 1) / quizQuestions.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>

                  {quizQuestions.length > 0 && quizQuestions[quizIndex] && (
                    <div>
                      <div style={{
                        background: C.elevated, borderRadius: 12, padding: 24, marginBottom: 24,
                      }}>
                        <p style={{ color: C.text, fontSize: "1.1rem", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                          {quizQuestions[quizIndex].question}
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                        {quizQuestions[quizIndex].options.map((opt, i) => {
                          const isSelected = quizAnswers[quizIndex] === opt;
                          return (
                            <button
                              key={i}
                              onClick={() => handleQuizAnswer(quizIndex, opt)}
                              style={{
                                padding: "14px 18px", borderRadius: 10, textAlign: "left",
                                background: isSelected ? `${C.raga}18` : C.elevated,
                                border: `1px solid ${isSelected ? C.raga + "50" : C.border}`,
                                color: isSelected ? C.raga : C.text,
                                fontSize: "0.9rem", fontWeight: isSelected ? 600 : 400,
                                cursor: "pointer", transition: "all 0.2s",
                              }}
                              onKeyDown={(e) => onKeyDown(e, () => handleQuizAnswer(quizIndex, opt))}
                            >
                              <span style={{ marginRight: 10, opacity: 0.5 }}>{String.fromCharCode(65 + i)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                        <button
                          onClick={() => setQuizIndex(Math.max(0, quizIndex - 1))}
                          disabled={quizIndex === 0}
                          style={{
                            padding: "12px 24px", borderRadius: 10,
                            background: C.elevated, border: `1px solid ${C.border}`,
                            color: quizIndex === 0 ? C.textMuted : C.textSecondary,
                            fontSize: "0.9rem", cursor: quizIndex === 0 ? "default" : "pointer",
                          }}
                          onKeyDown={(e) => onKeyDown(e, () => setQuizIndex(Math.max(0, quizIndex - 1)))}
                        >
                          ← Previous
                        </button>
                        {quizIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setQuizIndex(quizIndex + 1)}
                            style={{
                              padding: "12px 24px", borderRadius: 10,
                              background: `${C.raga}18`, border: `1px solid ${C.raga}35`,
                              color: C.raga, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                            }}
                            onKeyDown={(e) => onKeyDown(e, () => setQuizIndex(quizIndex + 1))}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={handleQuizSubmit}
                            style={{
                              padding: "12px 28px", borderRadius: 10,
                              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
                              border: "none", color: C.ink, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                            }}
                            onKeyDown={(e) => onKeyDown(e, handleQuizSubmit)}
                          >
                            Submit Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Quiz Results */
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: "50%", margin: "0 auto 20px",
                    background: `${scoreToGrade(quizResult.score).color}15`,
                    border: `3px solid ${scoreToGrade(quizResult.score).color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      color: scoreToGrade(quizResult.score).color,
                      fontSize: "2rem", fontWeight: 800,
                    }}>
                      {quizResult.score}%
                    </span>
                  </div>
                  <h2 style={{ color: C.text, fontSize: "1.5rem", fontWeight: 700, margin: "0 0 8px" }}>
                    Quiz Complete!
                  </h2>
                  <p style={{ color: C.textSecondary, fontSize: "0.95rem", margin: "0 0 4px" }}>
                    {quizResult.correct} out of {quizResult.total} correct
                  </p>
                  <p style={{ color: scoreToGrade(quizResult.score).color, fontSize: "1rem", fontWeight: 600, margin: "0 0 32px" }}>
                    {scoreToGrade(quizResult.score).label}
                  </p>

                  {/* Review */}
                  <div style={{ textAlign: "left", marginBottom: 28 }}>
                    <h3 style={{ color: C.primary, fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 16px" }}>
                      Review
                    </h3>
                    {quizQuestions.map((q, i) => {
                      const isCorrect = quizAnswers[i] === q.correct_answer;
                      return (
                        <div key={i} style={{
                          background: C.elevated, borderRadius: 10, padding: 16, marginBottom: 10,
                          borderLeft: `3px solid ${isCorrect ? C.success : C.error}`,
                        }}>
                          <p style={{ color: C.text, fontSize: "0.9rem", fontWeight: 600, margin: "0 0 8px" }}>
                            {q.question}
                          </p>
                          <p style={{
                            color: isCorrect ? C.success : C.error,
                            fontSize: "0.85rem", margin: "0 0 2px",
                          }}>
                            Your answer: {quizAnswers[i] || "(no answer)"}
                          </p>
                          {!isCorrect && (
                            <p style={{ color: C.textMuted, fontSize: "0.8rem", margin: 0 }}>
                              Correct: {q.correct_answer}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleCompleteRaga}
                    style={{
                      padding: "14px 32px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`,
                      border: "none", color: C.ink, fontSize: "1rem", fontWeight: 700,
                      cursor: "pointer", boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
                    }}
                    onKeyDown={(e) => onKeyDown(e, handleCompleteRaga)}
                  >
                    Complete Raga →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================== COMPLETE PHASE =================== */}
        {phase === PHASES.COMPLETE && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 40, position: "relative", overflow: "hidden",
              textAlign: "center",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.success}, ${C.secondary})`,
              }} />

              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
                background: `${C.success}15`, border: `2px solid ${C.success}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem",
              }}>
                🎉
              </div>

              <h2 style={{ color: C.text, fontSize: "1.8rem", fontWeight: 700, margin: "0 0 8px" }}>
                {raga.name} Completed!
              </h2>
              <p style={{ color: C.textSecondary, fontSize: "0.95rem", margin: "0 0 32px" }}>
                You've completed the learning journey for this raga
              </p>

              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 16, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px",
              }}>
                {bestScore !== null && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Best Score</p>
                    <p style={{ color: C.success, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{bestScore}%</p>
                  </div>
                )}
                {sessionScores.length > 0 && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Attempts</p>
                    <p style={{ color: C.primary, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{sessionScores.length}</p>
                  </div>
                )}
                {quizResult && (
                  <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                    <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Quiz Score</p>
                    <p style={{ color: C.raga, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{quizResult.score}%</p>
                  </div>
                )}
                <div style={{ background: C.elevated, borderRadius: 12, padding: 16 }}>
                  <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Phases</p>
                  <p style={{ color: C.secondary, fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{completedPhases.size}/{PHASE_ORDER.length}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setPhase(PHASES.PRACTICE);
                    setPracticeMode(null);
                    setAnalysisResult(null);
                    setPracticeScore(null);
                  }}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.secondary}, ${C.secondary}CC)`,
                    border: "none", color: C.ink, fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => {
                    setPhase(PHASES.PRACTICE);
                    setPracticeMode(null);
                    setAnalysisResult(null);
                    setPracticeScore(null);
                  })}
                >
                  Practice Again
                </button>
                <button
                  onClick={() => navigate("/ragas")}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => navigate("/ragas"))}
                >
                  Explore Another Raga
                </button>
                <button
                  onClick={() => goToPhase(PHASES.OVERVIEW)}
                  style={{
                    padding: "14px 24px", borderRadius: 12,
                    background: "transparent", border: `1px solid ${C.border}`,
                    color: C.textMuted, fontSize: "0.9rem", cursor: "pointer",
                  }}
                  onKeyDown={(e) => onKeyDown(e, () => goToPhase(PHASES.OVERVIEW))}
                >
                  Review Raga
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function generatePracticeFeedback(pitchData, scoreData, practiceMode, raga) {
  const feedback = [];
  if (scoreData?.feedback && Array.isArray(scoreData.feedback)) {
    return scoreData.feedback;
  }
  if (pitchData?.note && pitchData.note !== "Unknown") {
    feedback.push(`Your pitch was closest to ${pitchData.note}`);
  } else {
    feedback.push("Could not detect a clear pitch - try singing more loudly");
  }
  if (pitchData?.stability > 80) {
    feedback.push("Excellent voice stability");
  } else if (pitchData?.stability > 60) {
    feedback.push("Good stability - try to hold notes more steadily");
  } else {
    feedback.push("Try to maintain a more steady pitch");
  }
  if (pitchData?.cents && Math.abs(pitchData.cents) > 50) {
    feedback.push("You were slightly off pitch - listen to the reference and try again");
  }
  const score = scoreData?.score || 0;
  if (score >= 80) {
    feedback.push("Great performance! You're capturing the raga well");
  } else if (score >= 60) {
    feedback.push("Good effort - keep practicing to improve accuracy");
  } else {
    feedback.push("Keep practicing - focus on matching the target notes");
  }
  return feedback;
}
