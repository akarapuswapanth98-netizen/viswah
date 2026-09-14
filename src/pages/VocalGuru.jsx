import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { vocalGuruApi } from "../api/vocalGuruApi";
import { onKeyDown } from "../utils/keyboard";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { speechApi } from "../api/speechApi";

const C = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  floating: "#2A2344",
  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  success: "#6DBF73",
  warning: "#D4A84A",
  error: "#D46A6A",
};

const PHASES = {
  SELECT_GURU: "select_guru",
  SELECT_TOPIC: "select_topic",
  LEARN: "learn",
  EXERCISE: "exercise",
  PRACTICE: "practice",
  SUBMITTING: "submitting",
  ANALYZING: "analyzing",
  FEEDBACK: "feedback",
  COMPLETE: "complete",
};

const descriptions = {
  breathing: "Foundation of vocal control",
  pitch: "Train your ear and voice",
  warmup: "Prepare your voice safely",
  sargam: "Master solfege patterns",
  raga_basics: "Understand melodic frameworks",
  ornamentation: "Add expression to your singing",
  rhythm: "Tala and timing mastery",
};

const STEP_LABELS = ["Learn", "Exercise", "Practice", "Submit", "Feedback", "Improve"];

export default function VocalGuru() {
  const { addToast } = useToast();
  const { startSession, endSession } = usePracticeSession("vocal_guru");

  const [gurus, setGurus] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [teaching, setTeaching] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [mounted, setMounted] = useState(false);

  const [loadingGurus, setLoadingGurus] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingTeach, setLoadingTeach] = useState(false);
  const [loadingGreet, setLoadingGreet] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);

  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(PHASES.SELECT_GURU);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [correctionExercise, setCorrectionExercise] = useState(null);

  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingSpeak, setLoadingSpeak] = useState(false);
  const practiceStartTime = useRef(null);

  const recorder = useAudioRecorder();

  useEffect(() => { setMounted(true); }, []);

  const fetchGurus = useCallback(async () => {
    setLoadingGurus(true);
    try {
      const res = await vocalGuruApi.getGurus();
      setGurus(res.data ?? res ?? []);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to load gurus" });
    } finally {
      setLoadingGurus(false);
    }
  }, [addToast]);

  const fetchTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res = await vocalGuruApi.getTopics();
      setTopics(res.data ?? res ?? []);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to load topics" });
    } finally {
      setLoadingTopics(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGurus();
    fetchTopics();
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      recorder.stopRecording();
    };
  }, []);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [audioUrl]);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const speakText = async (text) => {
    if (!text || !selectedGuru) return;
    setLoadingSpeak(true);
    stopAudio();
    try {
      const res = await vocalGuruApi.speak(text, selectedGuru.id);
      const data = res.data ?? res;
      if (data.audio_url) {
        const fullUrl = data.audio_url.startsWith("http") ? data.audio_url : `${window.location.origin}${data.audio_url}`;
        setAudioUrl(fullUrl);
        audioUrlRef.current = fullUrl;
        const audio = new Audio(fullUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => { setIsPlaying(false); fallbackTTS(text); };
        await audio.play();
        setIsPlaying(true);
      } else {
        fallbackTTS(text);
      }
    } catch {
      fallbackTTS(text);
    } finally {
      setLoadingSpeak(false);
    }
  };

  const fallbackTTS = (text) => {
    if (!window.speechSynthesis) { addToast({ type: "warning", message: "Speech synthesis not available" }); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleSelectGuru = async (guru) => {
    if (selectedGuru?.id === guru.id) return;
    setSelectedGuru(guru);
    setSelectedTopic(null);
    setTeaching(null);
    setExerciseData(null);
    setPhase(PHASES.SELECT_TOPIC);
    setGreeting("");
    setFeedback(null);
    setCorrectionExercise(null);
    setAttemptNumber(0);
    stopAudio();
    recorder.stopRecording();

    setLoadingGreet(true);
    try {
      const res = await vocalGuruApi.greet(guru.id);
      const data = res.data ?? res;
      setGreeting(data.greeting ?? data.message ?? "");
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to greet guru" });
    } finally {
      setLoadingGreet(false);
    }
  };

  const handleSelectTopic = async (topicName) => {
    if (!selectedGuru) { addToast({ type: "info", message: "Select a guru first" }); return; }
    setSelectedTopic(topicName);
    setTeaching(null);
    setExerciseData(null);
    setFeedback(null);
    setCorrectionExercise(null);
    setAttemptNumber(0);
    stopAudio();
    recorder.stopRecording();
    practiceStartTime.current = Date.now();

    setLoadingTeach(true);
    setLoadingExercise(true);
    try {
      const [teachRes, exRes] = await Promise.all([
        vocalGuruApi.teach(topicName, selectedGuru.id),
        vocalGuruApi.getExercise(topicName),
      ]);
      setTeaching((teachRes.data ?? teachRes));
      setExerciseData((exRes.data ?? exRes));
      setPhase(PHASES.LEARN);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to load content" });
    } finally {
      setLoadingTeach(false);
      setLoadingExercise(false);
    }
  };

  const handleStartExercise = () => {
    setPhase(PHASES.EXERCISE);
    setAttemptNumber((n) => n + 1);
  };

  const handleStartPractice = () => {
    setPhase(PHASES.PRACTICE);
  };

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        addToast({ type: "error", message: "Microphone access denied. Please allow microphone access in your browser settings." });
      } else if (err.name === "NotFoundError") {
        addToast({ type: "error", message: "No microphone found. Please connect a microphone." });
      } else {
        addToast({ type: "error", message: "Could not start recording. Please try again." });
      }
    }
  };

  const handleSubmit = async () => {
    if (!recorder.audioBlob) {
      addToast({ type: "info", message: "Please record your practice first" });
      return;
    }
    recorder.stopRecording();
    setPhase(PHASES.SUBMITTING);

    try {
      const float32Data = await recorder.audioBlobToFloat32(recorder.audioBlob);
      if (!float32Data || float32Data.length === 0) {
        addToast({ type: "error", message: "Recording was empty. Please try again." });
        setPhase(PHASES.PRACTICE);
        return;
      }

      setPhase(PHASES.ANALYZING);
      const analysisRes = await speechApi.analyzePitch({
        audio_data: float32Data,
        sample_rate: 44100,
      });
      const analysis = analysisRes.data ?? analysisRes;

      const analysisResult = {
        pitch: analysis.pitch || 0,
        note: analysis.note || "Unknown",
        pitch_deviation_cents: analysis.cents_off || 0,
        direction: analysis.direction || "on_target",
        stability: analysis.stability || 0,
        duration_seconds: recorder.recordingTime,
        volume_consistency: analysis.volume_consistency || 0.5,
        score: analysis.score || Math.max(0, Math.min(100, 70 - Math.abs(analysis.cents_off || 0) / 3)),
      };

      try {
        const feedbackRes = await vocalGuruApi.getFeedback({
          topic: selectedTopic,
          analysis: analysisResult,
          attempt_number: attemptNumber,
        });
        const fb = feedbackRes.data ?? feedbackRes;
        setFeedback({ ...fb, analysis: analysisResult });
      } catch {
        setFeedback({
          category: "good",
          observation: `Your pitch was ${analysisResult.note} with ${Math.abs(analysisResult.pitch_deviation_cents)} cents deviation.`,
          why: "Pitch accuracy affects how your singing sounds against accompaniment.",
          try: "Try the exercise again, focusing on matching the target note precisely.",
          correction_exercise: exerciseData?.correction_exercises?.default || "Practice the exercise again.",
          attempt_number: attemptNumber,
          score: analysisResult.score,
          analysis: analysisResult,
        });
      }

      setPhase(PHASES.FEEDBACK);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Analysis failed. Please try again." });
      setPhase(PHASES.PRACTICE);
    }
  };

  const handlePracticeAgain = () => {
    setPhase(PHASES.EXERCISE);
    setAttemptNumber((n) => n + 1);
    setFeedback(null);
    recorder.setAudioBlob(null);
  };

  const handleComplete = () => {
    const duration = practiceStartTime.current ? Math.round((Date.now() - practiceStartTime.current) / 1000) : 0;
    endSession({
      activityId: selectedTopic,
      score: feedback?.score ?? 50,
      completed: true,
      metadata: {
        guru_id: selectedGuru?.id,
        topic: selectedTopic,
        attempts: attemptNumber,
        final_score: feedback?.score,
      },
    });
    practiceStartTime.current = null;
    setPhase(PHASES.COMPLETE);
    addToast({ type: "success", message: "Session complete! Great work!" });
  };

  const handleNewTopic = () => {
    setSelectedTopic(null);
    setTeaching(null);
    setExerciseData(null);
    setFeedback(null);
    setCorrectionExercise(null);
    setAttemptNumber(0);
    stopAudio();
    recorder.stopRecording();
    setPhase(PHASES.SELECT_TOPIC);
  };

  const steps = teaching?.steps ?? [];
  const tips = teaching?.tips ?? [];
  const explanation = exerciseData?.explanation ?? {};
  const exercise = exerciseData?.exercise ?? {};

  const phaseIndex = {
    [PHASES.LEARN]: 0,
    [PHASES.EXERCISE]: 1,
    [PHASES.PRACTICE]: 2,
    [PHASES.SUBMITTING]: 3,
    [PHASES.ANALYZING]: 3,
    [PHASES.FEEDBACK]: 4,
    [PHASES.COMPLETE]: 5,
  }[phase] ?? 0;

  if (loadingGurus || loadingTopics) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px", paddingBottom: 60 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 40 }}>
          <div style={{ height: 60, borderRadius: 16, background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", marginBottom: 24 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: 160, borderRadius: 16, background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ink, paddingBottom: 80, position: "relative" }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 70% 40% at 30% 10%, rgba(199, 125, 186, 0.05), transparent 70%), radial-gradient(ellipse 50% 30% at 80% 30%, rgba(232, 168, 56, 0.04), transparent 70%)`,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 0", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          marginBottom: 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
            Vocal <span style={{ color: C.saffron }}>Guru</span>
          </h1>
          <p style={{ color: C.textMuted, fontSize: 15, marginTop: 6 }}>
            {phase === PHASES.COMPLETE
              ? "Session complete"
              : selectedGuru
                ? `Coaching with ${selectedGuru.name}`
                : "Choose a coach to begin your vocal training"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" style={{
            background: C.surface, border: `1px solid ${C.error}30`,
            borderRadius: 12, padding: "14px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>&#9888;</span>
            <span style={{ color: C.error, fontSize: 14, flex: 1 }}>{error}</span>
            <button onClick={() => { setError(null); fetchGurus(); fetchTopics(); }} style={{
              background: "none", border: "none", color: C.saffron, fontSize: 14,
              fontWeight: 600, cursor: "pointer", textDecoration: "underline",
            }}>Retry</button>
          </div>
        )}

        {/* Phase Progress Bar */}
        {selectedTopic && phase !== PHASES.SELECT_GURU && phase !== PHASES.SELECT_TOPIC && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {STEP_LABELS.map((label, i) => (
                <div key={label} style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: i <= phaseIndex
                    ? `linear-gradient(90deg, ${C.saffron}, ${C.raga})`
                    : "rgba(255,255,255,0.06)",
                  transition: "background 0.4s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {STEP_LABELS.map((label, i) => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 500,
                  color: i === phaseIndex ? C.saffron : i < phaseIndex ? C.success : C.textMuted,
                  transition: "color 0.3s",
                }}>{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* =================== SELECT GURU =================== */}
        {(phase === PHASES.SELECT_GURU || phase === PHASES.SELECT_TOPIC) && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Choose Your Guru
            </h2>
            {gurus.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
                <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>No gurus available</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
                {gurus.map((guru) => {
                  const isSelected = selectedGuru?.id === guru.id;
                  return (
                    <div
                      key={guru.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleSelectGuru(guru)}
                      onKeyDown={(e) => onKeyDown(e, () => handleSelectGuru(guru))}
                      style={{
                        minWidth: 220, background: isSelected
                          ? `linear-gradient(135deg, rgba(232, 168, 56, 0.1), rgba(199, 125, 186, 0.06))`
                          : C.surface,
                        border: `1px solid ${isSelected ? C.saffron + "40" : C.border}`,
                        borderRadius: 16, padding: 20, cursor: "pointer",
                        transition: "all 0.25s ease-out", flexShrink: 0,
                        boxShadow: isSelected ? "0 4px 24px rgba(232, 168, 56, 0.08)" : "none",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = C.saffron + "30"; } }}
                      onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.border; } }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `linear-gradient(135deg, ${C.saffron}25, ${C.raga}18)`,
                        border: `1px solid ${C.saffron}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24, marginBottom: 12,
                      }}>
                        {guru.name?.[0] ?? "🎤"}
                      </div>
                      <p style={{ color: C.text, fontWeight: 600, fontSize: 16, margin: "0 0 4px" }}>{guru.name}</p>
                      {guru.style && (
                        <p style={{ color: C.saffron, fontSize: 13, margin: "0 0 8px", fontWeight: 500 }}>{guru.style}</p>
                      )}
                      {guru.description && (
                        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>
                          {guru.description.length > 80 ? guru.description.slice(0, 80) + "..." : guru.description}
                        </p>
                      )}
                      {guru.specialties && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(Array.isArray(guru.specialties) ? guru.specialties : [guru.specialties]).slice(0, 3).map((s, i) => (
                            <span key={i} style={{ padding: "2px 8px", borderRadius: 6, background: `${C.teal}12`, color: C.teal, fontSize: 11, fontWeight: 500 }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Greeting */}
        {selectedGuru && (phase === PHASES.SELECT_TOPIC) && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              {loadingGreet ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: `2px solid ${C.borderHover}`, borderTopColor: C.saffron, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ color: C.textMuted, fontSize: 14 }}>{selectedGuru.name} is greeting you...</span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.saffron}25, ${C.raga}18)`,
                    border: `1px solid ${C.saffron}20`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {selectedGuru.name?.[0] ?? "🎤"}
                  </div>
                  <div>
                    <p style={{ color: C.text, fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{selectedGuru.name}</p>
                    <p style={{ color: C.textSecondary, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                      {greeting || "Welcome! Select a topic to begin your lesson."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =================== SELECT TOPIC =================== */}
        {phase === PHASES.SELECT_TOPIC && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Select a Skill
            </h2>
            {topics.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
                <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>No topics available</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {topics.map((topic) => {
                  const topicName = typeof topic === "string" ? topic : topic.name ?? topic.title ?? topic.id;
                  return (
                    <button
                      key={topicName}
                      onClick={() => handleSelectTopic(topicName)}
                      disabled={!selectedGuru}
                      style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 12, padding: "16px 14px", textAlign: "left",
                        cursor: !selectedGuru ? "not-allowed" : "pointer",
                        opacity: !selectedGuru ? 0.5 : 1, transition: "all 0.2s", color: C.text,
                      }}
                      onMouseEnter={(e) => { if (selectedGuru) { e.currentTarget.style.borderColor = C.saffron + "30"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{topicName}</p>
                      {descriptions[topicName] && (
                        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{descriptions[topicName]}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Loading Content */}
        {(loadingTeach || loadingExercise) && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ height: 300, borderRadius: 16, background: `linear-gradient(110deg, ${C.surface} 30%, ${C.elevated} 50%, ${C.surface} 70%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          </section>
        )}

        {/* =================== LEARN PHASE =================== */}
        {teaching && exerciseData && phase === PHASES.LEARN && !loadingTeach && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div className="vocal-guru-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
              {/* Sidebar */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: "sticky", top: 20 }}>
                <h4 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                  {teaching.title ?? selectedTopic}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10,
                      background: "transparent",
                      border: `1px solid transparent`,
                      color: C.textMuted, fontSize: 13,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(255,255,255,0.04)", color: C.textMuted,
                        fontSize: 11, fontWeight: 700,
                      }}>{i + 1}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Step {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
                {tips.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>Tips</p>
                    {tips.map((tip, i) => (
                      <p key={i} style={{ color: C.textSecondary, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }}>{tip}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Main — Learn panel */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.saffron}, ${C.raga}, ${C.teal})` }} />

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                    {teaching.title ?? `Lesson: ${selectedTopic}`}
                  </h3>
                  <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Learn &amp; understand the skill</p>
                </div>

                {/* Explanation blocks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                  {explanation.what && (
                    <div style={{ background: `${C.saffron}08`, border: `1px solid ${C.saffron}18`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.saffron, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>What It Is</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{explanation.what}</p>
                    </div>
                  )}
                  {explanation.why && (
                    <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}18`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.teal, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Why It Matters</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{explanation.why}</p>
                    </div>
                  )}
                  {explanation.notice && (
                    <div style={{ background: `${C.raga}08`, border: `1px solid ${C.raga}18`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.raga, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>What to Notice</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{explanation.notice}</p>
                    </div>
                  )}
                  {explanation.practice && (
                    <div style={{ background: `rgba(255,255,255,0.03)`, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.textSecondary, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>What You Will Practice</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{explanation.practice}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartExercise}
                  style={{
                    padding: "14px 32px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                    border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 4px 16px rgba(232, 168, 56, 0.2)",
                  }}
                >
                  Start Exercise →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =================== EXERCISE PHASE =================== */}
        {phase === PHASES.EXERCISE && exercise && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div className="vocal-guru-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
              {/* Sidebar */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: "sticky", top: 20 }}>
                <h4 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                  {exercise.name ?? selectedTopic}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10, color: C.textMuted, fontSize: 13,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(255,255,255,0.04)", color: C.textMuted, fontSize: 11, fontWeight: 700,
                      }}>{i + 1}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Step {i + 1}</span>
                    </div>
                  ))}
                </div>
                {attemptNumber > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <p style={{ color: C.textMuted, fontSize: 11, fontWeight: 600, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>Attempt #{attemptNumber}</p>
                  </div>
                )}
              </div>

              {/* Main — Exercise panel */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.saffron}, ${C.raga}, ${C.teal})` }} />

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                    {exercise.name ?? `Exercise: ${selectedTopic}`}
                  </h3>
                  {exercise.objective && (
                    <p style={{ color: C.teal, fontSize: 14, margin: 0, fontWeight: 500 }}>{exercise.objective}</p>
                  )}
                </div>

                {/* Exercise details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 18 }}>
                      <p style={{ color: C.saffron, fontSize: 12, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.5 }}>Instructions</p>
                      <ol style={{ margin: 0, paddingLeft: 20, color: C.text, fontSize: 14, lineHeight: 2 }}>
                        {exercise.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                      </ol>
                    </div>
                  )}
                  {exercise.duration && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ background: `${C.teal}12`, color: C.teal, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 500 }}>
                        Duration: {exercise.duration}
                      </span>
                    </div>
                  )}
                  {exercise.listen_for && (
                    <div style={{ background: `${C.raga}08`, border: `1px solid ${C.raga}18`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.raga, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Listen For</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{exercise.listen_for}</p>
                    </div>
                  )}
                  {exercise.success_criteria && (
                    <div style={{ background: `${C.success}08`, border: `1px solid ${C.success}18`, borderRadius: 12, padding: 16 }}>
                      <p style={{ color: C.success, fontSize: 12, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>Success Criteria</p>
                      <p style={{ color: C.text, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{exercise.success_criteria}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handleStartPractice}
                    style={{
                      padding: "14px 32px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                      border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                      cursor: "pointer", boxShadow: "0 4px 16px rgba(91, 168, 160, 0.2)",
                    }}
                  >
                    Start Practicing →
                  </button>
                  <button
                    onClick={() => setPhase(PHASES.LEARN)}
                    style={{
                      padding: "14px 24px", borderRadius: 12,
                      background: C.elevated, border: `1px solid ${C.border}`,
                      color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    ← Review Lesson
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================== PRACTICE PHASE =================== */}
        {phase === PHASES.PRACTICE && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div className="vocal-guru-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
              {/* Sidebar */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: "sticky", top: 20 }}>
                <h4 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                  Practice Session
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 10, color: C.textMuted, fontSize: 13,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(255,255,255,0.04)", color: C.textMuted, fontSize: 11, fontWeight: 700,
                      }}>{i + 1}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Step {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main — Practice / Recording panel */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.saffron}, ${C.raga}, ${C.teal})` }} />

                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>
                    Record Your Practice
                  </h3>
                  <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
                    {exercise.name ?? selectedTopic} — Attempt #{attemptNumber}
                  </p>
                </div>

                {/* Recording UI */}
                <div style={{
                  background: "rgba(0,0,0,0.2)", borderRadius: 16, padding: 32,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                  border: `1px solid ${recorder.isRecording ? C.error + "40" : C.border}`,
                }}>
                  {/* Audio level visualizer */}
                  {recorder.isRecording && (
                    <div style={{ display: "flex", gap: 3, alignItems: "center", height: 40 }}>
                      {[...Array(12)].map((_, i) => {
                        const level = recorder.getAudioLevel();
                        const isActive = i < Math.ceil(level * 12);
                        return (
                          <div key={i} style={{
                            width: 4, height: isActive ? 12 + i * 2 : 4, borderRadius: 2,
                            background: isActive ? (i < 4 ? C.teal : i < 8 ? C.saffron : C.error) : "rgba(255,255,255,0.08)",
                            transition: "height 0.1s, background 0.1s",
                          }} />
                        );
                      })}
                    </div>
                  )}

                  {/* Timer */}
                  <div style={{ fontSize: 32, fontWeight: 700, color: recorder.isRecording ? C.error : C.text, fontVariantNumeric: "tabular-nums" }}>
                    {String(Math.floor(recorder.recordingTime / 60)).padStart(2, "0")}:{String(recorder.recordingTime % 60).padStart(2, "0")}
                  </div>

                  {/* Controls */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                    {!recorder.isRecording && !recorder.audioBlob && (
                      <button
                        onClick={handleStartRecording}
                        style={{
                          padding: "14px 32px", borderRadius: 12,
                          background: `linear-gradient(135deg, ${C.error}, ${C.error}DD)`,
                          border: "none", color: "#FFF", fontSize: 15, fontWeight: 700,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          boxShadow: "0 4px 16px rgba(212, 106, 106, 0.25)",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>●</span> Start Recording
                      </button>
                    )}

                    {recorder.isRecording && !recorder.isPaused && (
                      <>
                        <button
                          onClick={recorder.pauseRecording}
                          style={{
                            padding: "14px 24px", borderRadius: 12,
                            background: C.elevated, border: `1px solid ${C.border}`,
                            color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
                          }}
                        >Pause</button>
                        <button
                          onClick={() => { recorder.stopRecording(); setPhase(PHASES.SUBMITTING); handleSubmit(); }}
                          style={{
                            padding: "14px 32px", borderRadius: 12,
                            background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                            border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          Stop &amp; Submit →
                        </button>
                      </>
                    )}

                    {recorder.isRecording && recorder.isPaused && (
                      <button
                        onClick={recorder.resumeRecording}
                        style={{
                          padding: "14px 32px", borderRadius: 12,
                          background: `linear-gradient(135deg, ${C.success}, ${C.success}DD)`,
                          border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >Resume</button>
                    )}

                    {!recorder.isRecording && recorder.audioBlob && (
                      <>
                        <button
                          onClick={handleSubmit}
                          disabled={phase === PHASES.SUBMITTING || phase === PHASES.ANALYZING}
                          style={{
                            padding: "14px 32px", borderRadius: 12,
                            background: (phase === PHASES.SUBMITTING || phase === PHASES.ANALYZING)
                              ? `${C.saffron}50` : `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                            border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                            cursor: (phase === PHASES.SUBMITTING || phase === PHASES.ANALYZING) ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          {(phase === PHASES.SUBMITTING || phase === PHASES.ANALYZING) ? (
                            <>
                              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(12,10,20,0.3)", borderTopColor: C.ink, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              Analyzing...
                            </>
                          ) : "Submit for Analysis →"}
                        </button>
                        <button
                          onClick={() => { recorder.setAudioBlob(null); }}
                          style={{
                            padding: "14px 24px", borderRadius: 12,
                            background: C.elevated, border: `1px solid ${C.border}`,
                            color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: "pointer",
                          }}
                        >Record Again</button>
                      </>
                    )}
                  </div>

                  {/* Recorded audio playback */}
                  {!recorder.isRecording && recorder.audioBlob && (
                    <audio controls style={{ width: "100%", maxWidth: 400, borderRadius: 8 }}>
                      <source src={URL.createObjectURL(recorder.audioBlob)} type={recorder.audioBlob.type} />
                    </audio>
                  )}
                </div>

                {/* Quick tips */}
                <div style={{ marginTop: 16, padding: "12px 16px", background: `${C.teal}08`, borderRadius: 10, border: `1px solid ${C.teal}15` }}>
                  <p style={{ color: C.teal, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Quick Tips</p>
                  <p style={{ color: C.textSecondary, fontSize: 13, margin: 0 }}>
                    {exercise.listen_for || "Focus on the quality of your sound. Take a breath before starting."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================== SUBMITTING / ANALYZING PHASE =================== */}
        {(phase === PHASES.SUBMITTING || phase === PHASES.ANALYZING) && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 48, textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
                background: `${C.saffron}15`, border: `1px solid ${C.saffron}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 28, height: 28, border: `3px solid ${C.saffron}30`, borderTopColor: C.saffron, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </div>
              <p style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                {phase === PHASES.SUBMITTING ? "Submitting your recording..." : "Analyzing your performance..."}
              </p>
              <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
                {phase === PHASES.SUBMITTING ? "Preparing audio data for analysis" : "Measuring pitch, stability, and timing"}
              </p>
            </div>
          </section>
        )}

        {/* =================== FEEDBACK PHASE =================== */}
        {phase === PHASES.FEEDBACK && feedback && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div className="vocal-guru-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
              {/* Sidebar — Score & Analysis */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                <h4 style={{ color: C.text, fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>
                  Analysis Results
                </h4>
                <div style={{ textAlign: "center", padding: "16px 0", marginBottom: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
                    background: `conic-gradient(${C.saffron} ${feedback.score || 0}%, rgba(255,255,255,0.06) 0%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%", background: C.surface,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: C.saffron, fontSize: 22, fontWeight: 700 }}>
                        {Math.round(feedback.score || 0)}
                      </span>
                    </div>
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Score</p>
                </div>
                {feedback.analysis && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {feedback.analysis.note && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>Note</span>
                        <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{feedback.analysis.note}</span>
                      </div>
                    )}
                    {feedback.analysis.pitch_deviation_cents != null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>Pitch</span>
                        <span style={{
                          color: Math.abs(feedback.analysis.pitch_deviation_cents) < 30 ? C.success : C.warning,
                          fontSize: 12, fontWeight: 600,
                        }}>{feedback.analysis.pitch_deviation_cents > 0 ? "+" : ""}{Math.round(feedback.analysis.pitch_deviation_cents)} cents</span>
                      </div>
                    )}
                    {feedback.analysis.duration_seconds != null && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.textMuted, fontSize: 12 }}>Duration</span>
                        <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{feedback.analysis.duration_seconds}s</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Main — Feedback content */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.saffron}, ${C.raga}, ${C.teal})` }} />

                <h3 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 24px" }}>
                  Coach&apos;s Feedback
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                  {/* WHAT I OBSERVED */}
                  <div style={{ background: `${C.saffron}08`, border: `1px solid ${C.saffron}18`, borderRadius: 12, padding: 18 }}>
                    <p style={{ color: C.saffron, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      What I Observed
                    </p>
                    <p style={{ color: C.text, fontSize: 15, margin: 0, lineHeight: 1.7 }}>{feedback.observation}</p>
                  </div>

                  {/* WHY IT MATTERS */}
                  <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}18`, borderRadius: 12, padding: 18 }}>
                    <p style={{ color: C.teal, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Why It Matters
                    </p>
                    <p style={{ color: C.text, fontSize: 15, margin: 0, lineHeight: 1.7 }}>{feedback.why}</p>
                  </div>

                  {/* WHAT TO TRY */}
                  <div style={{ background: `${C.raga}08`, border: `1px solid ${C.raga}18`, borderRadius: 12, padding: 18 }}>
                    <p style={{ color: C.raga, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      What to Try
                    </p>
                    <p style={{ color: C.text, fontSize: 15, margin: 0, lineHeight: 1.7 }}>{feedback.try}</p>
                  </div>

                  {/* CORRECTION EXERCISE */}
                  {feedback.correction_exercise && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                      <p style={{ color: C.textSecondary, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Correction Exercise
                      </p>
                      <p style={{ color: C.text, fontSize: 15, margin: 0, lineHeight: 1.7 }}>{feedback.correction_exercise}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handlePracticeAgain}
                    style={{
                      padding: "14px 32px", borderRadius: 12,
                      background: `linear-gradient(135deg, ${C.teal}, ${C.teal}CC)`,
                      border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                      cursor: "pointer", boxShadow: "0 4px 16px rgba(91, 168, 160, 0.2)",
                    }}
                  >
                    Practice Again →
                  </button>
                  <button
                    onClick={handleComplete}
                    style={{
                      padding: "14px 24px", borderRadius: 12,
                      background: C.elevated, border: `1px solid ${C.border}`,
                      color: C.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    End Session
                  </button>
                  <button
                    onClick={handleNewTopic}
                    style={{
                      padding: "14px 24px", borderRadius: 12,
                      background: "none", border: `1px solid ${C.border}`,
                      color: C.textMuted, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}
                  >
                    New Topic
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================== COMPLETE PHASE =================== */}
        {phase === PHASES.COMPLETE && (
          <section style={{ marginBottom: 40, animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 48, textAlign: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px",
                background: `${C.success}15`, border: `1px solid ${C.success}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, color: C.success,
              }}>&#10003;</div>
              <h3 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
                Session Complete!
              </h3>
              <p style={{ color: C.textSecondary, fontSize: 15, margin: "0 0 8px" }}>
                You practiced <span style={{ color: C.saffron, fontWeight: 600 }}>{selectedTopic}</span> with{" "}
                <span style={{ color: C.saffron, fontWeight: 600 }}>{selectedGuru?.name}</span>
              </p>
              <p style={{ color: C.textMuted, fontSize: 14, margin: "0 0 28px" }}>
                {attemptNumber} attempt{attemptNumber !== 1 ? "s" : ""} completed
                {feedback?.score != null ? ` · Final score: ${Math.round(feedback.score)}` : ""}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={handleNewTopic}
                  style={{
                    padding: "14px 32px", borderRadius: 12,
                    background: `linear-gradient(135deg, ${C.saffron}, ${C.saffronMuted})`,
                    border: "none", color: C.ink, fontSize: 15, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Choose Another Skill
                </button>
                <button
                  onClick={handlePracticeAgain}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: C.elevated, border: `1px solid ${C.border}`,
                    color: C.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  Practice {selectedTopic} Again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!selectedGuru && !loadingGurus && gurus.length > 0 && phase === PHASES.SELECT_GURU && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "48px 24px", textAlign: "center", marginTop: 20,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>&#127908;</div>
            <p style={{ color: C.text, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
              Select a Guru to Begin
            </p>
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
              Choose from our expert vocal coaches above to start your personalized training
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 768px) {
          .vocal-guru-grid { grid-template-columns: 1fr !important; }
          .vocal-guru-sidebar { max-height: 200px; overflow-y: auto; }
          .vocal-guru-content { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
