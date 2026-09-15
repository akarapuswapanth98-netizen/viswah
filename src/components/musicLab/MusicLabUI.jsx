// Shared UI components for Music Lab exercises
import { useState } from "react";
import C from "../ui/colors";

const DIFFICULTY_COLORS = {
  beginner: C.success,
  intermediate: C.secondary,
  advanced: C.primary,
};

function ExerciseCard({ exercise, onSelect, isActive }) {
  const [hovered, setHovered] = useState(false);
  const diffColor = DIFFICULTY_COLORS[exercise.difficulty] || C.secondary;

  return (
    <button
      onClick={() => onSelect(exercise)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "20px",
        background: isActive
          ? `linear-gradient(135deg, rgba(232, 168, 56, 0.12), rgba(91, 168, 160, 0.08))`
          : hovered
            ? C.surfaceHover
            : C.elevated,
        border: `1px solid ${isActive ? C.borderActive : hovered ? C.borderHover : C.border}`,
        borderRadius: 16,
        cursor: "pointer",
        transition: "all 0.25s ease-out",
        textAlign: "left",
        width: "100%",
        color: C.text,
        fontFamily: "inherit",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{exercise.title}</div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
        {exercise.description}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: 20,
          background: `${diffColor}20`,
          color: diffColor,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}>
          {exercise.difficulty}
        </span>
        {exercise.totalQuestions && (
          <span style={{ fontSize: 12, color: C.textMuted }}>
            {exercise.totalQuestions} questions
          </span>
        )}
      </div>
    </button>
  );
}

function PlayButton({ onClick, isPlaying, size = 48, label = "Play" }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        background: isPlaying
          ? `linear-gradient(135deg, ${C.primary}, ${C.primaryMuted})`
          : `linear-gradient(135deg, ${C.secondary}CC, ${C.secondary})`,
        color: C.ink,
        fontSize: size * 0.35,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease-out",
        transform: hovered ? "scale(1.1)" : "scale(1)",
        boxShadow: hovered
          ? `0 4px 20px ${isPlaying ? "rgba(232,168,56,0.4)" : "rgba(91,168,160,0.4)"}`
          : "none",
      }}
    >
      {isPlaying ? "⏸" : "▶"}
    </button>
  );
}

function AnswerOption({ answer, isSelected, isCorrect, isRevealed, onClick }) {
  const [hovered, setHovered] = useState(false);

  let bg = C.elevated;
  let border = C.border;
  let color = C.text;

  if (isRevealed) {
    if (isCorrect) {
      bg = "rgba(109, 191, 115, 0.15)";
      border = C.success;
      color = C.success;
    } else if (isSelected) {
      bg = "rgba(212, 106, 106, 0.15)";
      border = C.error;
      color = C.error;
    }
  } else if (isSelected) {
    bg = `rgba(232, 168, 56, 0.12)`;
    border = C.primary;
    color = C.primary;
  } else if (hovered) {
    bg = C.surfaceHover;
    border = C.borderHover;
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isRevealed}
      style={{
        padding: "14px 20px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        color,
        fontSize: 15,
        fontWeight: 600,
        cursor: isRevealed ? "default" : "pointer",
        transition: "all 0.2s ease-out",
        fontFamily: "inherit",
        textAlign: "center",
        width: "100%",
        transform: !isRevealed && hovered ? "translateY(-1px)" : "none",
      }}
    >
      {answer}
    </button>
  );
}

function ScoreDisplay({ score, correct, total, label }) {
  const grade = (() => {
    if (score >= 90) return { letter: "A+", color: C.success, bg: "rgba(109,191,115,0.12)" };
    if (score >= 80) return { letter: "A", color: C.success, bg: "rgba(109,191,115,0.12)" };
    if (score >= 70) return { letter: "B", color: C.secondary, bg: "rgba(91,168,160,0.12)" };
    if (score >= 60) return { letter: "C", color: C.warning, bg: "rgba(212,168,74,0.12)" };
    return { letter: "D", color: C.error, bg: "rgba(212,106,106,0.12)" };
  })();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "24px 32px",
      background: C.elevated,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 16,
        background: grade.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 800,
        color: grade.color,
        flexShrink: 0,
      }}>
        {grade.letter}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.text }}>{score}%</div>
        <div style={{ fontSize: 14, color: C.textSecondary }}>
          {correct} of {total} correct
          {label && ` — ${label}`}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total, color = C.primary }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div style={{
      width: "100%",
      height: 6,
      background: `${C.border}`,
      borderRadius: 3,
      overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`,
        height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
        borderRadius: 3,
        transition: "width 0.4s ease-out",
      }} />
    </div>
  );
}

function FeedbackToast({ feedback }) {
  if (!feedback) return null;
  const colors = { success: C.success, error: C.error, warning: C.warning };
  return (
    <div style={{
      padding: "12px 20px",
      borderRadius: 12,
      background: `${colors[feedback.type] || C.secondary}15`,
      border: `1px solid ${colors[feedback.type] || C.secondary}40`,
      color: colors[feedback.type] || C.secondary,
      fontSize: 14,
      fontWeight: 600,
      textAlign: "center",
      animation: "slideUp 0.3s ease-out",
    }}>
      {feedback.message}
    </div>
  );
}

function DifficultySelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {["beginner", "intermediate", "advanced"].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: `1px solid ${value === d ? DIFFICULTY_COLORS[d] : C.border}`,
            background: value === d ? `${DIFFICULTY_COLORS[d]}20` : "transparent",
            color: value === d ? DIFFICULTY_COLORS[d] : C.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            textTransform: "capitalize",
            fontFamily: "inherit",
          }}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

function TimerDisplay({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span style={{
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: 14,
      color: C.textSecondary,
      fontVariantNumeric: "tabular-nums",
    }}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

function StreakDisplay({ streak }) {
  if (streak < 2) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 20,
      background: streak >= 5
        ? "rgba(232, 168, 56, 0.15)"
        : "rgba(109, 191, 115, 0.12)",
      color: streak >= 5 ? C.primary : C.success,
      fontSize: 13,
      fontWeight: 700,
    }}>
      <span style={{ fontSize: 14 }}>🔥</span>
      <span>{streak}</span>
    </div>
  );
}

export {
  C,
  DIFFICULTY_COLORS,
  ExerciseCard,
  PlayButton,
  AnswerOption,
  ScoreDisplay,
  ProgressBar,
  FeedbackToast,
  DifficultySelector,
  TimerDisplay,
  StreakDisplay,
};
