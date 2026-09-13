import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { speechApi } from "../api/speechApi";
import { onKeyDown } from "../utils/keyboard";
import { usePracticeSession } from "../hooks/usePracticeSession";

const COLORS = {
  primary: "#6C63FF",
  secondary: "#4ECDC4",
  neon: "#00FF88",
  bg: "#0F0F23",
  surface: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  secondaryText: "#B0B0CC",
  mutedText: "#6B6B8D",
  success: "#34C759",
};

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

const SkeletonCard = ({ height = 200, style = {} }) => (
  <div
    style={{
      height,
      borderRadius: 16,
      background: `linear-gradient(110deg, ${COLORS.surface} 30%, rgba(255,255,255,0.12) 50%, ${COLORS.surface} 70%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}
  />
);

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const DIFFICULTY_COLORS = {
  beginner: { bg: `${COLORS.success}22`, color: COLORS.success, border: `${COLORS.success}44` },
  intermediate: { bg: `${COLORS.secondary}22`, color: COLORS.secondary, border: `${COLORS.secondary}44` },
  advanced: { bg: `rgba(255,149,0,0.15)`, color: "#FF9500", border: `rgba(255,149,0,0.3)` },
};

export default function SpeechAnalysis() {
  const { addToast } = useToast();

  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [error, setError] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [segments, setSegments] = useState([]);
  const [audioChunks, setAudioChunks] = useState([]);
  const { startSession, endSession } = usePracticeSession("speech_analysis");
  const practiceStartTime = useRef(null);

  const [pitchResult, setPitchResult] = useState(null);
  const [volumeResult, setVolumeResult] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const [micDenied, setMicDenied] = useState(false);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setBrowserSupported(false);
    }
    fetchExercises();
    return () => {
      cleanup();
    };
  }, []);

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
    if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const fetchExercises = async () => {
    setLoadingExercises(true);
    try {
      const res = await speechApi.getExercises();
      setExercises(res.data ?? res ?? []);
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to load exercises" });
    } finally {
      setLoadingExercises(false);
    }
  };

  const drawWaveform = () => {
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
      gradient.addColorStop(0, COLORS.primary);
      gradient.addColorStop(0.5, COLORS.secondary);
      gradient.addColorStop(1, COLORS.neon);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async (exercise) => {
    setSelectedExercise(exercise);
    setSegments([]);
    setAudioChunks([]);
    setPitchResult(null);
    setVolumeResult(null);
    setScoreResult(null);
    setSessionResult(null);
    setMicDenied(false);

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
      setIsPaused(false);
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      if (!practiceStartTime.current) practiceStartTime.current = Date.now();

      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setAudioChunks([...chunksRef.current]);
        if (chunksRef.current.length > 0) {
          await analyzeAudio();
        }
      };

      recorder.start(100);
      drawWaveform();
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicDenied(true);
        addToast({
          type: "error",
          message: "Microphone access denied. Please allow microphone access in your browser settings to use speech analysis.",
        });
      } else {
        addToast({ type: "error", message: err.message || "Failed to start recording" });
      }
    }
  };

  const analyzingTimeoutRef = useRef(null);

  const stopRecording = () => {
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
    setIsPaused(false);

    if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
    analyzingTimeoutRef.current = setTimeout(() => {
      setAnalyzing(false);
    }, 30000);
  };

  const togglePause = () => {
    if (!recorderRef.current) return;
    if (isPaused) {
      recorderRef.current.resume();
      startTimeRef.current = Date.now() - recordingTime * 1000;
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      drawWaveform();
    } else {
      recorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    setIsPaused(!isPaused);
  };

  const analyzeAudio = async () => {
    if (analyzingTimeoutRef.current) {
      clearTimeout(analyzingTimeoutRef.current);
      analyzingTimeoutRef.current = null;
    }
    setAnalyzing(true);
    let audioCtx = null;
    try {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const arrayBuffer = await audioBlob.arrayBuffer();
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const decodeWithTimeout = (ctx, buf) =>
        Promise.race([
          ctx.decodeAudioData(buf),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Audio decode timed out. Your browser may not support this audio format.")), 10000)),
        ]);

      const audioBuffer = await decodeWithTimeout(audioCtx, arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);

      const sampleRate = audioBuffer.sampleRate;
      const audioData = Array.from(channelData);

      const segmentData = {
        exercise_id: selectedExercise?.id,
        audio_data: audioData,
        sample_rate: sampleRate,
        duration: audioBuffer.duration,
      };

      setSegments((prev) => [...prev, segmentData]);

      const [pitchRes, volumeRes, scoreRes] = await Promise.allSettled([
        speechApi.analyzePitch({ audio_data: audioData, sample_rate: sampleRate }),
        speechApi.analyzeVolume({ audio_data: audioData }),
        speechApi.score({
          audio_data: audioData,
          target_note: selectedExercise?.target_note || "C4",
        }),
      ]);

      if (pitchRes.status === "fulfilled") {
        setPitchResult(pitchRes.value.data ?? pitchRes.value);
      } else {
        addToast({ type: "error", message: "Pitch analysis failed" });
      }

      if (volumeRes.status === "fulfilled") {
        setVolumeResult(volumeRes.value.data ?? volumeRes.value);
      } else {
        addToast({ type: "error", message: "Volume analysis failed" });
      }

      if (scoreRes.status === "fulfilled") {
        setScoreResult(scoreRes.value.data ?? scoreRes.value);
      } else {
        addToast({ type: "error", message: "Scoring failed" });
      }
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to analyze audio" });
    } finally {
      if (audioCtx) audioCtx.close().catch(() => {});
      setAnalyzing(false);
    }
  };

  const handleEndSession = async () => {
    if (segments.length === 0) {
      addToast({ type: "info", message: "No recordings to analyze" });
      return;
    }
    setAnalyzing(true);
    try {
      const res = await speechApi.analyzeSession({
        exercise_id: selectedExercise?.id,
        segments,
      });
      const result = res.data ?? res;
      setSessionResult(result);
      const duration = practiceStartTime.current ? Math.round((Date.now() - practiceStartTime.current) / 1000) : 0;
      endSession({
        activityId: selectedExercise?.id || null,
        score: result?.overall_score ?? null,
        completed: true,
        metadata: { exercise_type: selectedExercise?.type, segments: segments.length },
      });
      practiceStartTime.current = null;
      addToast({ type: "success", message: "Session analysis complete!" });
    } catch (err) {
      addToast({ type: "error", message: err.message || "Session analysis failed" });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.secondary;
    if (score >= 40) return "#FF9500";
    return "#FF3B30";
  };

  if (!browserSupported) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{
          background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 420,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>
            Browser Not Supported
          </h2>
          <p style={{ color: COLORS.secondaryText, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Your browser does not support the MediaRecorder API needed for speech analysis.
            Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  if (micDenied) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{
          background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
          borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 460,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>
            Microphone Access Required
          </h2>
          <p style={{ color: COLORS.secondaryText, fontSize: 14, margin: "0 0 12px", lineHeight: 1.7 }}>
            Speech Analysis needs your microphone to record and analyze your vocal performance.
            Your audio is processed locally and is never stored or shared.
          </p>
          <p style={{ color: COLORS.mutedText, fontSize: 13, margin: "0 0 24px", lineHeight: 1.6 }}>
            To enable: click the lock icon in your browser's address bar and allow microphone access,
            or check your system's privacy settings.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { setMicDenied(false); setSelectedExercise(null); }}
              style={{
                padding: "12px 28px", borderRadius: 10,
                background: COLORS.surface, border: `1px solid ${COLORS.glassBorder}`,
                color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Go Back
            </button>
            <button
              onClick={() => { setMicDenied(false); if (selectedExercise) startRecording(selectedExercise); }}
              style={{
                padding: "12px 28px", borderRadius: 10,
                background: COLORS.primary, border: "none",
                color: COLORS.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, paddingBottom: 80 }}>
      <style>{shimmerKeyframes}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 0" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: COLORS.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
            Speech <span style={{ color: COLORS.secondary }}>Analysis</span>
          </h1>
          <p style={{ color: COLORS.mutedText, fontSize: 15, marginTop: 6 }}>
            Record your voice and get instant AI-powered feedback on pitch, volume, and timing
          </p>
        </div>

        {error && (
          <div role="alert" style={{
            background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)",
            borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex",
            alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span style={{ color: "#FF3B30", fontSize: 14, flex: 1 }}>{error}</span>
            <button onClick={() => { setError(null); fetchExercises(); }} style={{
              background: "none", border: "none", color: COLORS.primary, fontSize: 14,
              fontWeight: 600, cursor: "pointer", textDecoration: "underline",
            }}>Retry</button>
          </div>
        )}

        {/* Exercise List */}
        {!isRecording && !selectedExercise && (
          <section>
            <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Choose an Exercise
            </h2>
            {loadingExercises ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} height={140} />)}
              </div>
            ) : exercises.length === 0 ? (
              <div style={{
                background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 16, padding: "40px 24px", textAlign: "center",
              }}>
                <p style={{ color: COLORS.secondaryText, fontSize: 16, margin: 0 }}>No exercises available</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {exercises.map((exercise) => {
                  const diff = DIFFICULTY_COLORS[exercise.difficulty] || DIFFICULTY_COLORS.beginner;
                  return (
                    <div
                      key={exercise.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => startRecording(exercise)}
                      onKeyDown={(e) => onKeyDown(e, () => startRecording(exercise))}
                      style={{
                        background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
                        borderRadius: 16, padding: 20, cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = COLORS.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = COLORS.glassBorder;
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: `${COLORS.secondary}15`, display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: 20,
                        }}>🎙️</div>
                        {exercise.difficulty && (
                          <span style={{
                            padding: "3px 10px", borderRadius: 8,
                            background: diff.bg, color: diff.color,
                            border: `1px solid ${diff.border}`,
                            fontSize: 12, fontWeight: 500,
                          }}>
                            {exercise.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>
                        {exercise.name}
                      </h3>
                      <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                        {exercise.description?.length > 100
                          ? exercise.description.slice(0, 100) + "..."
                          : exercise.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Recording UI */}
        {isRecording && selectedExercise && (
          <section style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
              borderRadius: 20, padding: 28, position: "relative", overflow: "hidden",
            }}>
              {/* Header accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: isPaused
                  ? COLORS.mutedText
                  : `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.neon})`,
                transition: "background 0.3s",
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ color: COLORS.text, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>
                    {selectedExercise.name}
                  </h3>
                  <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>
                    {isPaused ? "Paused" : "Recording in progress..."}
                  </p>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: isPaused ? "#FF9500" : "#FF3B30",
                    animation: isPaused ? "none" : "pulse 1.5s ease-in-out infinite",
                  }} />
                  <span style={{
                    color: COLORS.text, fontSize: 28, fontWeight: 700,
                    fontFamily: "monospace",
                  }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </div>

              {/* Waveform Canvas */}
              <div style={{
                background: "rgba(0,0,0,0.3)", borderRadius: 14,
                padding: 16, marginBottom: 24,
              }}>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={120}
                  style={{ width: "100%", height: 120, borderRadius: 8 }}
                />
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={togglePause}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: isPaused
                      ? `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.neon})`
                      : COLORS.surface,
                    border: isPaused ? "none" : `1px solid ${COLORS.glassBorder}`,
                    color: isPaused ? "#0F0F23" : COLORS.text,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>

                <button
                  onClick={stopRecording}
                  style={{
                    padding: "14px 32px", borderRadius: 12,
                    background: "#FF3B30", border: "none",
                    color: COLORS.text, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  ⏹ Stop Recording
                </button>
              </div>

              {/* Segments counter */}
              {segments.length > 0 && (
                <p style={{ color: COLORS.mutedText, fontSize: 13, textAlign: "center", marginTop: 16, margin: "16px 0 0" }}>
                  {segments.length} recording{segments.length !== 1 ? "s" : ""} completed this session
                </p>
              )}
            </div>
          </section>
        )}

        {/* Analyzing State */}
        {analyzing && !isRecording && (
          <section style={{ animation: "fadeIn 0.3s ease", marginTop: 20 }}>
            <div style={{
              background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
              borderRadius: 20, padding: 40, textAlign: "center",
            }}>
              <div style={{
                width: 48, height: 48, border: `3px solid ${COLORS.glassBorder}`,
                borderTopColor: COLORS.secondary, borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }} />
              <p style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
                Analyzing your recording...
              </p>
              <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>
                Processing pitch, volume, and scoring
              </p>
            </div>
          </section>
        )}

        {/* Results */}
        {!isRecording && !analyzing && selectedExercise && (pitchResult || volumeResult || scoreResult) && (
          <section style={{ marginTop: 20, animation: "fadeIn 0.3s ease" }}>
            {/* Score */}
            {scoreResult && (
              <div style={{
                background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 20, padding: 28, marginBottom: 16,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${COLORS.neon}, ${COLORS.secondary})`,
                }} />
                <h3 style={{ color: COLORS.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
                  Performance Score
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: `${getScoreColor(scoreResult.score ?? 0)}15`,
                    border: `3px solid ${getScoreColor(scoreResult.score ?? 0)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column",
                  }}>
                    <span style={{
                      color: getScoreColor(scoreResult.score ?? 0),
                      fontSize: 28, fontWeight: 800, lineHeight: 1,
                    }}>
                      {Math.round(scoreResult.score ?? 0)}
                    </span>
                    <span style={{ color: COLORS.mutedText, fontSize: 10, fontWeight: 500 }}>/100</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {scoreResult.feedback && (
                      <p style={{ color: COLORS.secondaryText, fontSize: 14, margin: "0 0 8px", lineHeight: 1.6 }}>
                        {scoreResult.feedback}
                      </p>
                    )}
                    {scoreResult.target_note && (
                      <p style={{ color: COLORS.mutedText, fontSize: 13, margin: 0 }}>
                        Target note: <span style={{ color: COLORS.primary, fontWeight: 600 }}>{scoreResult.target_note}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pitch Analysis */}
            {pitchResult && (
              <div style={{
                background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 20, padding: 28, marginBottom: 16,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
                }} />
                <h3 style={{ color: COLORS.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
                  Pitch Analysis
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {pitchResult.mean_pitch != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Mean Pitch</p>
                      <p style={{ color: COLORS.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {Math.round(pitchResult.mean_pitch)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>Hz</span>
                      </p>
                    </div>
                  )}
                  {pitchResult.min_pitch != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Min Pitch</p>
                      <p style={{ color: COLORS.secondary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {Math.round(pitchResult.min_pitch)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>Hz</span>
                      </p>
                    </div>
                  )}
                  {pitchResult.max_pitch != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Max Pitch</p>
                      <p style={{ color: COLORS.neon, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {Math.round(pitchResult.max_pitch)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>Hz</span>
                      </p>
                    </div>
                  )}
                  {pitchResult.stability != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Stability</p>
                      <p style={{ color: getScoreColor(pitchResult.stability * 100), fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {Math.round(pitchResult.stability * 100)}<span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>%</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Volume Analysis */}
            {volumeResult && (
              <div style={{
                background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
                borderRadius: 20, padding: 28, marginBottom: 16,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.neon})`,
                }} />
                <h3 style={{ color: COLORS.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
                  Volume Analysis
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {volumeResult.mean_volume != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Mean Volume</p>
                      <p style={{ color: COLORS.secondary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {volumeResult.mean_volume?.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>dB</span>
                      </p>
                    </div>
                  )}
                  {volumeResult.peak_volume != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Peak Volume</p>
                      <p style={{ color: COLORS.neon, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {volumeResult.peak_volume?.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>dB</span>
                      </p>
                    </div>
                  )}
                  {volumeResult.dynamic_range != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Dynamic Range</p>
                      <p style={{ color: COLORS.primary, fontSize: 22, fontWeight: 700, margin: 0 }}>
                        {volumeResult.dynamic_range?.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>dB</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Session Results */}
            {sessionResult && (
              <div style={{
                background: `linear-gradient(135deg, ${COLORS.primary}11, ${COLORS.secondary}11)`,
                border: `1px solid ${COLORS.primary}33`,
                borderRadius: 20, padding: 28, marginBottom: 16,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.neon})`,
                }} />
                <h3 style={{ color: COLORS.text, fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>
                  Session Summary
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {sessionResult.total_segments != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Recordings</p>
                      <p style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>{sessionResult.total_segments}</p>
                    </div>
                  )}
                  {sessionResult.overall_score != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Overall Score</p>
                      <p style={{ color: getScoreColor(sessionResult.overall_score), fontSize: 24, fontWeight: 700, margin: 0 }}>
                        {Math.round(sessionResult.overall_score)}
                      </p>
                    </div>
                  )}
                  {sessionResult.improvement != null && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <p style={{ color: COLORS.mutedText, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Improvement</p>
                      <p style={{ color: sessionResult.improvement > 0 ? COLORS.success : COLORS.neon, fontSize: 24, fontWeight: 700, margin: 0 }}>
                        {sessionResult.improvement > 0 ? "+" : ""}{Math.round(sessionResult.improvement)}%
                      </p>
                    </div>
                  )}
                </div>
                {sessionResult.feedback && (
                  <div style={{
                    background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 16,
                  }}>
                    <p style={{ color: COLORS.secondaryText, fontSize: 14, margin: 0, lineHeight: 1.7 }}>
                      {sessionResult.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setSelectedExercise(null);
                  setPitchResult(null);
                  setVolumeResult(null);
                  setScoreResult(null);
                  setSessionResult(null);
                  setSegments([]);
                }}
                style={{
                  padding: "14px 28px", borderRadius: 12,
                  background: COLORS.surface, border: `1px solid ${COLORS.glassBorder}`,
                  color: COLORS.text, fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                ← New Exercise
              </button>
              <button
                onClick={() => startRecording(selectedExercise)}
                style={{
                  padding: "14px 28px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.neon})`,
                  border: "none", color: "#0F0F23", fontSize: 14, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🎙️ Record Again
              </button>
              {segments.length > 1 && !sessionResult && (
                <button
                  onClick={handleEndSession}
                  disabled={analyzing}
                  style={{
                    padding: "14px 28px", borderRadius: 12,
                    background: COLORS.primary, border: "none",
                    color: COLORS.text, fontSize: 14, fontWeight: 600,
                    cursor: analyzing ? "not-allowed" : "pointer",
                    opacity: analyzing ? 0.6 : 1,
                  }}
                >
                  Analyze Session ({segments.length} segments)
                </button>
              )}
            </div>
          </section>
        )}

        {/* Post-recording empty state */}
        {!isRecording && !analyzing && selectedExercise && !pitchResult && !volumeResult && !scoreResult && (
          <section style={{ marginTop: 20 }}>
            <div style={{
              background: COLORS.glass, border: `1px solid ${COLORS.glassBorder}`,
              borderRadius: 16, padding: "32px 24px", textAlign: "center",
            }}>
              <p style={{ color: COLORS.secondaryText, fontSize: 15, margin: 0 }}>
                Analysis results will appear here after recording
              </p>
            </div>
          </section>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
