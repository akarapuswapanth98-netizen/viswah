import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { courseApi } from "../api/courseApi";
import { progressApi } from "../api/progressApi";
import { useToast } from "../context/ToastContext";

import C from "../components/ui/colors";

const skeletonKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
`;

function parseQuizQuestions(quizData) {
  if (!quizData) return null;
  try {
    let parsed = typeof quizData === "string" ? JSON.parse(quizData) : quizData;
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    if (!Array.isArray(parsed)) {
      if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      } else {
        return null;
      }
    }
    return parsed.map((q) => ({
      question: q.question || q.text || "",
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correct_answer ?? q.correctAnswer ?? q.answer ?? 0,
    }));
  } catch {
    return null;
  }
}

function getLetterGrade(score) {
  if (score >= 90) return { letter: "A", color: C.neon };
  if (score >= 80) return { letter: "B", color: C.success };
  if (score >= 70) return { letter: "C", color: C.secondary };
  if (score >= 60) return { letter: "D", color: C.warning };
  return { letter: "F", color: C.error };
}

const SkeletonBlock = ({ height = 200, style = {} }) => (
  <div
    style={{
      height,
      borderRadius: 16,
      background: `linear-gradient(110deg, ${C.surfaceHover} 30%, ${C.glassBorder} 50%, ${C.surfaceHover} 70%)`,
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}
  />
);

export default function Quiz() {
  const { id: lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = lessonId || location.state?.lessonId;
        if (!id) {
          setError("No lesson ID provided");
          setLoading(false);
          return;
        }
        const res = await courseApi.getLesson(id);
        const lessonData = res.data ?? res;
        setLesson(lessonData);

        const parsed = parseQuizQuestions(
          lessonData.quiz_questions ?? lessonData.quizQuestions
        );
        if (!parsed || parsed.length === 0) {
          setError("This lesson does not have quiz questions available.");
        } else {
          setQuestions(parsed);
        }
      } catch (err) {
        setError(err.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, location.state]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const handleSelect = (optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      const proceed = window.confirm(
        `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      let correctCount = 0;
      questions.forEach((q, i) => {
        const selectedOptionIndex = answers[i];
        if (selectedOptionIndex != null && q.options[selectedOptionIndex] === q.correct_answer) {
          correctCount++;
        }
      });
      const score = Math.round((correctCount / questions.length) * 100);
      const grade = getLetterGrade(score);

      setResult({
        score,
        correct: correctCount,
        total: questions.length,
        grade,
      });
      setSubmitted(true);

      if (lessonId || location.state?.lessonId) {
        try {
          await progressApi.createProgress({
            lesson_id: lessonId || location.state?.lessonId,
            completed: true,
            score,
          });
          addToast({ type: "success", message: "Quiz score saved!" });
        } catch {
          addToast({ type: "warning", message: "Score calculated but couldn't be saved" });
        }
      }
    } catch (err) {
      addToast({ type: "error", message: err.message || "Failed to submit quiz" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px" }}>
        <style>{skeletonKeyframes}</style>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 40 }}>
          <SkeletonBlock height={40} style={{ marginBottom: 20 }} />
          <SkeletonBlock height={24} style={{ marginBottom: 32, width: "60%" }} />
          <SkeletonBlock height={80} style={{ marginBottom: 16 }} />
          <SkeletonBlock height={56} style={{ marginBottom: 12 }} />
          <SkeletonBlock height={56} style={{ marginBottom: 12 }} />
          <SkeletonBlock height={56} style={{ marginBottom: 12 }} />
          <SkeletonBlock height={56} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{skeletonKeyframes}</style>
        <div style={{ textAlign: "center", padding: 40, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: C.textSecondary, fontSize: 18, marginBottom: 8 }}>Quiz Unavailable</p>
          <p style={{ color: C.textMuted, marginBottom: 24, fontSize: 14 }}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: C.primary,
              color: C.text,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px 80px" }}>
        <style>{skeletonKeyframes}</style>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 40 }}>
          <div style={{ animation: "scaleIn 0.4s ease", textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${result.grade.color}33, ${result.grade.color}11)`,
                border: `3px solid ${result.grade.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 48,
                fontWeight: 800,
                color: result.grade.color,
              }}
            >
              {result.grade.letter}
            </div>
            <h1 style={{ color: C.text, fontSize: 32, fontWeight: 700, margin: "0 0 8px" }}>
              {result.score}%
            </h1>
            <p style={{ color: C.textSecondary, fontSize: 16, margin: "0 0 24px" }}>
              {result.correct} out of {result.total} correct
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  background: `${C.success}22`,
                  color: C.success,
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ✓ {result.correct} Correct
              </span>
              <span
                style={{
                  background: `${C.error}22`,
                  color: C.error,
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                ✗ {result.total - result.correct} Incorrect
              </span>
            </div>
          </div>

          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
            Review Answers
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const selectedText = userAnswer != null ? q.options[userAnswer] : undefined;
              const isCorrect = selectedText === q.correct_answer;
              return (
                <div
                  key={i}
                  style={{
                    background: C.surfaceGlass,
                    border: `1px solid ${isCorrect ? `${C.success}44` : `${C.error}44`}`,
                    borderRadius: 16,
                    padding: 20,
                    animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <span
                      style={{
                        background: isCorrect ? C.success : C.error,
                        color: C.text,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isCorrect ? "✓" : "✗"}
                    </span>
                    <p style={{ color: C.text, fontSize: 15, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                      {i + 1}. {q.question}
                    </p>
                  </div>
                  <div style={{ marginLeft: 34 }}>
                    {q.options.map((opt, j) => {
                      const isUserChoice = userAnswer === j;
                      const isCorrectOpt = opt === q.correct_answer;
                      let bg = "transparent";
                      let border = `1px solid ${C.surfaceGlassBorder}`;
                      let textColor = C.textSecondary;
                      if (isCorrectOpt) {
                        bg = `${C.success}22`;
                        border = `1px solid ${C.success}44`;
                        textColor = C.success;
                      } else if (isUserChoice && !isCorrect) {
                        bg = `${C.error}22`;
                        border = `1px solid ${C.error}44`;
                        textColor = C.error;
                      }
                      return (
                        <div
                          key={j}
                          style={{
                            background: bg,
                            border,
                            borderRadius: 10,
                            padding: "10px 14px",
                            marginBottom: 8,
                            color: textColor,
                            fontSize: 14,
                          }}
                        >
                          {opt}
                          {isCorrectOpt && (
                            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>(Correct)</span>
                          )}
                          {isUserChoice && !isCorrect && (
                            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>(Your answer)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: `1px solid ${C.surfaceGlassBorder}`,
                background: C.surfaceGlass,
                color: C.text,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = C.surfaceHover)}
              onMouseLeave={(e) => (e.target.style.background = C.surfaceGlass)}
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, padding: "0 20px 80px" }}>
      <style>{skeletonKeyframes}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: C.textMuted, fontSize: 14 }}>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span style={{ color: C.textMuted, fontSize: 14 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 3,
              background: C.surfaceHover,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 3,
                background: `linear-gradient(90deg, ${C.primary}, ${C.neon})`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        <div
          key={currentIndex}
          style={{
            animation: "fadeIn 0.3s ease",
            background: C.surfaceGlass,
            border: `1px solid ${C.surfaceGlassBorder}`,
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
          }}
        >
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 600, margin: "0 0 24px", lineHeight: 1.5 }}>
            {currentQuestion.question}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedOption === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? C.primary : C.surfaceGlassBorder}`,
                    background: isSelected ? `${C.primary}22` : "transparent",
                    color: C.text,
                    fontSize: 15,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = `${C.primary}88`;
                      e.currentTarget.style.background = `${C.primary}11`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = C.surfaceGlassBorder;
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      minWidth: 40,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? C.primary : C.textMuted}`,
                      background: isSelected ? C.primary : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    {isSelected ? "✓" : String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ flex: 1 }}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: `1px solid ${C.surfaceGlassBorder}`,
              background: C.surfaceGlass,
              color: currentIndex === 0 ? C.textMuted : C.text,
              fontSize: 15,
              fontWeight: 600,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            ← Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                background: submitting
                  ? C.textMuted
                  : `linear-gradient(135deg, ${C.neon}, ${C.secondary})`,
                color: C.text,
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Submitting..." : "Submit Quiz ✓"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                color: C.text,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
