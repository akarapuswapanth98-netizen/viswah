// Exercise Engine for VISWAH Music Lab
// Generates exercises client-side, validates answers, computes scores.
// Progressive difficulty — harder levels use wider ranges, shorter windows.

import {
  NOTE_NAMES as AUDIO_NOTE_NAMES,
  BASE_FREQUENCIES,
  INTERVALS,
  RHYTHM_PATTERNS,
  MELODIES,
  SARGAM_TO_WESTERN,
} from "./audioEngine";

const NOTE_NAMES = AUDIO_NOTE_NAMES;

// ── Difficulty System ─────────────────────────────────────────────

const DIFFICULTY = {
  beginner: { label: "Beginner", color: "#6DBF73", maxNotes: 3, octaves: [4], tempo: [60, 90] },
  intermediate: { label: "Intermediate", color: "#5BA8A0", maxNotes: 5, octaves: [3, 4, 5], tempo: [80, 140] },
  advanced: { label: "Advanced", color: "#E8A838", maxNotes: 8, octaves: [2, 3, 4, 5, 6], tempo: [100, 180] },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Note Recognition ──────────────────────────────────────────────

function generateNoteRecognition(difficulty = "beginner") {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.beginner;
  const count = difficulty === "beginner" ? 5 : difficulty === "intermediate" ? 8 : 12;
  const notes = [];

  for (let i = 0; i < count; i++) {
    const note = pickRandom(NOTE_NAMES);
    const octave = pickRandom(d.octaves);
    notes.push({ note, octave, display: `${note}${octave}` });
  }

  return {
    type: "note_recognition",
    difficulty,
    notes,
    totalQuestions: count,
    instructions: [
      "Listen to the generated practice tone",
      "Identify the note being played",
      "Select your answer from the options",
    ],
  };
}

function validateNoteRecognition(answer, target) {
  return answer.note === target.note && answer.octave === target.octave;
}

// ── Interval Training ─────────────────────────────────────────────

function generateIntervalTraining(difficulty = "beginner") {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.beginner;
  const count = difficulty === "beginner" ? 5 : difficulty === "intermediate" ? 8 : 12;

  const availableIntervals = difficulty === "beginner"
    ? INTERVALS.filter((i) => i.semitones <= 7)
    : difficulty === "intermediate"
      ? INTERVALS.filter((i) => i.semitones <= 12)
      : [...INTERVALS];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const interval = pickRandom(availableIntervals);
    const baseNote = pickRandom(NOTE_NAMES);
    const baseOctave = pickRandom(d.octaves);
    const baseFreq = BASE_FREQUENCIES[baseNote] * Math.pow(2, baseOctave - 4);
    const targetFreq = baseFreq * Math.pow(2, interval.semitones / 12);

    questions.push({
      baseNote,
      baseOctave,
      targetFreq: Math.round(targetFreq * 100) / 100,
      semitones: interval.semitones,
      correctAnswer: interval.name,
    });
  }

  const options = shuffleArray(availableIntervals.map((i) => i.name)).slice(0,
    difficulty === "beginner" ? 4 : difficulty === "intermediate" ? 6 : 8
  );

  return {
    type: "interval_training",
    difficulty,
    questions,
    totalQuestions: count,
    options,
    instructions: [
      "Listen to two tones played in sequence",
      "Identify the musical interval between them",
      "Select from the options below",
    ],
  };
}

function validateIntervalTraining(answer, question) {
  return answer === question.correctAnswer;
}

// ── Rhythm Recognition ────────────────────────────────────────────

function generateRhythmRecognition(difficulty = "beginner") {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.beginner;
  const pool = RHYTHM_PATTERNS[difficulty] || RHYTHM_PATTERNS.simple;
  const count = difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5;

  const patterns = [];
  const usedLabels = new Set();

  for (let i = 0; i < count; i++) {
    let pattern;
    do {
      pattern = pickRandom(pool);
    } while (usedLabels.has(pattern.label) && usedLabels.size < pool.length);
    usedLabels.add(pattern.label);

    patterns.push({
      ...pattern,
      bpm: d.tempo[0] + Math.floor(Math.random() * (d.tempo[1] - d.tempo[0])),
    });
  }

  const allLabels = shuffleArray(pool.map((p) => p.label)).slice(0,
    difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5
  );

  return {
    type: "rhythm_recognition",
    difficulty,
    patterns,
    totalQuestions: count,
    options: allLabels,
    instructions: [
      "Listen to the generated rhythm pattern",
      "Identify which rhythm is being played",
      "Select the matching pattern name",
    ],
  };
}

function validateRhythmRecognition(answer, pattern) {
  return answer === pattern.label;
}

// ── Melody Recognition ────────────────────────────────────────────

function generateMelodyRecognition(difficulty = "beginner") {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.beginner;
  const pool = MELODIES[difficulty] || MELODIES.beginner;
  const count = difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5;

  const melodies = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let melody;
    do {
      melody = pickRandom(pool);
    } while (usedNames.has(melody.name) && usedNames.size < pool.length);
    usedNames.add(melody.name);

    melodies.push({
      name: melody.name,
      notes: melody.notes,
      noteCount: melody.notes.length,
    });
  }

  const allNames = shuffleArray(pool.map((m) => m.name)).slice(0,
    difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5
  );

  return {
    type: "melody_recognition",
    difficulty,
    melodies,
    totalQuestions: count,
    options: allNames,
    instructions: [
      "Listen to the generated melody",
      "Identify which melody is being played",
      "Select the matching name",
    ],
  };
}

function validateMelodyRecognition(answer, melody) {
  return answer === melody.name;
}

// ── Musical Memory ────────────────────────────────────────────────

function generateMusicalMemory(difficulty = "beginner") {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.beginner;
  const sequenceLength = difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 5 : 7;
  const rounds = difficulty === "beginner" ? 3 : difficulty === "intermediate" ? 4 : 5;

  const sequences = [];
  for (let r = 0; r < rounds; r++) {
    const seq = [];
    const availableNotes = NOTE_NAMES.slice(0, difficulty === "beginner" ? 5 : NOTE_NAMES.length);
    for (let i = 0; i < sequenceLength; i++) {
      seq.push({
        note: pickRandom(availableNotes),
        octave: pickRandom(d.octaves),
      });
    }
    sequences.push({
      round: r + 1,
      notes: seq,
      display: seq.map((n) => `${n.note}${n.octave}`),
    });
  }

  return {
    type: "musical_memory",
    difficulty,
    sequences,
    totalRounds: rounds,
    sequenceLength,
    instructions: [
      "Listen to the sequence of notes",
      "After it finishes, recreate the sequence by playing the notes",
      "The sequence gets longer each round",
    ],
  };
}

function validateMusicalMemory(userSequence, targetSequence) {
  if (userSequence.length !== targetSequence.length) return false;
  return userSequence.every((n, i) => {
    const target = targetSequence[i];
    return n.note === target.note && (n.octave || 4) === (target.octave || 4);
  });
}

// ── Score Computation ─────────────────────────────────────────────

function computeScore(correct, total) {
  if (total === 0) return 0;
  const accuracy = (correct / total) * 100;
  return Math.round(accuracy * 0.7 + 30);
}

function scoreToGrade(score) {
  if (score >= 90) return { letter: "A+", color: "#6DBF73", label: "Excellent" };
  if (score >= 80) return { letter: "A", color: "#6DBF73", label: "Great" };
  if (score >= 70) return { letter: "B", color: "#5BA8A0", label: "Good" };
  if (score >= 60) return { letter: "C", color: "#D4A84A", label: "Fair" };
  return { letter: "D", color: "#D46A6A", label: "Needs Practice" };
}

function getFeedback(isCorrect, streak) {
  if (isCorrect) {
    if (streak >= 5) return { type: "success", message: "On fire! " + streak + " in a row!" };
    if (streak >= 3) return { type: "success", message: "Great streak! Keep going!" };
    return { type: "success", message: "Correct!" };
  }
  if (streak === 0) return { type: "error", message: "Not quite — try again!" };
  return { type: "warning", message: "Good effort! The streak ended." };
}

// ── Difficulty Progression ────────────────────────────────────────

function getNextDifficulty(currentDifficulty, recentScores) {
  if (recentScores.length < 3) return currentDifficulty;

  const avg = recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3;

  if (avg >= 85 && currentDifficulty !== "advanced") {
    return currentDifficulty === "beginner" ? "intermediate" : "advanced";
  }
  if (avg < 55 && currentDifficulty !== "beginner") {
    return currentDifficulty === "advanced" ? "intermediate" : "beginner";
  }
  return currentDifficulty;
}

export {
  DIFFICULTY,
  NOTE_NAMES,
  pickRandom,
  shuffleArray,
  generateNoteRecognition,
  validateNoteRecognition,
  generateIntervalTraining,
  validateIntervalTraining,
  generateRhythmRecognition,
  validateRhythmRecognition,
  generateMelodyRecognition,
  validateMelodyRecognition,
  generateMusicalMemory,
  validateMusicalMemory,
  computeScore,
  scoreToGrade,
  getFeedback,
  getNextDifficulty,
};
