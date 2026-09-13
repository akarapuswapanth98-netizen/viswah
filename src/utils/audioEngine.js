// Centralized Audio Engine for VISWAH Music Lab
// All Web Audio API operations go through this module.
// Exercises are generated client-side; audio is clearly labeled as
// "Generated practice tone" in the UI.

let sharedCtx = null;
let masterGain = null;
const activeNodes = new Map();
let nodeCounter = 0;

function getCtx() {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = sharedCtx.createGain();
    masterGain.connect(sharedCtx.destination);
    masterGain.gain.value = 1;
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

function getMasterGain() {
  getCtx();
  return masterGain;
}

// ── Note Frequencies ──────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const BASE_FREQUENCIES = {
  C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63, F: 349.23,
  "F#": 369.99, G: 392.00, "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88,
};

function noteFrequency(note, octave) {
  if (typeof note === "number") return note;
  const base = BASE_FREQUENCIES[note.replace("♭", "b").replace("♯", "#")];
  if (!base) return 440;
  const octDiff = (octave || 4) - 4;
  return base * Math.pow(2, octDiff);
}

function frequencyToNote(freq) {
  const semitones = 12 * Math.log2(freq / 440);
  const noteIdx = Math.round(semitones) + 9; // A=9 → C=0
  const octave = 4 + Math.floor((noteIdx + 9) / 12);
  const name = NOTE_NAMES[((noteIdx % 12) + 12) % 12];
  return { note: name, octave, frequency: freq };
}

// ── Interval Definitions ──────────────────────────────────────────

const INTERVALS = [
  { semitones: 0, name: "Unison", short: "P1" },
  { semitones: 1, name: "Minor 2nd", short: "m2" },
  { semitones: 2, name: "Major 2nd", short: "M2" },
  { semitones: 3, name: "Minor 3rd", short: "m3" },
  { semitones: 4, name: "Major 3rd", short: "M3" },
  { semitones: 5, name: "Perfect 4th", short: "P4" },
  { semitones: 6, name: "Tritone", short: "TT" },
  { semitones: 7, name: "Perfect 5th", short: "P5" },
  { semitones: 8, name: "Minor 6th", short: "m6" },
  { semitones: 9, name: "Major 6th", short: "M6" },
  { semitones: 10, name: "Minor 7th", short: "m7" },
  { semitones: 11, name: "Major 7th", short: "M7" },
  { semitones: 12, name: "Octave", short: "P8" },
];

// ── Rhythm Patterns ───────────────────────────────────────────────

const RHYTHM_PATTERNS = {
  simple: [
    { label: "Quarter Notes", beats: [1, 1, 1, 1], timeSignature: "4/4" },
    { label: "Waltz", beats: [1, 0.7, 0.7], timeSignature: "3/4" },
    { label: "March", beats: [1, 0.5, 1, 0.5], timeSignature: "4/4" },
  ],
  intermediate: [
    { label: "Syncopation", beats: [1, 0, 1, 0.7, 0, 1, 0.7, 0], timeSignature: "4/4" },
    { label: "Triplet Feel", beats: [1, 0.6, 0.6, 1, 0.6, 0.6], timeSignature: "4/4" },
    { label: "Bossa Nova", beats: [1, 0, 0.7, 0, 1, 0.7, 0, 0.7], timeSignature: "4/4" },
  ],
  advanced: [
    { label: "Tala Teentaal", beats: [1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5], timeSignature: "16/4" },
    { label: "Polyrhythm 3:2", beats: [1, 0, 0.6, 0.7, 0, 0.6], timeSignature: "6/8" },
    { label: "Afro-Cuban Clave", beats: [1, 0, 0.7, 0, 0.7, 0, 1, 0, 0.7, 0, 0.7, 0], timeSignature: "4/4" },
  ],
};

// ── Melody Patterns ───────────────────────────────────────────────

const MELODIES = {
  beginner: [
    { name: "Mary Had a Little Lamb", notes: ["E4", "D4", "C4", "D4", "E4", "E4", "E4", "D4", "D4", "D4", "E4", "G4", "G4"] },
    { name: "Hot Cross Buns", notes: ["E4", "D4", "C4", "E4", "D4", "C4", "C4", "C4", "C4", "D4", "D4", "D4", "D4", "E4", "D4", "C4"] },
    { name: "Twinkle Twinkle", notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"] },
  ],
  intermediate: [
    { name: "Ode to Joy", notes: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4", "C4", "C4", "D4", "E4", "E4", "D4", "D4"] },
    { name: "Canon in D (simplified)", notes: ["F#4", "E4", "D4", "C#4", "B3", "A3", "B3", "C#4"] },
    { name: "Für Elise (simplified)", notes: ["E5", "D#5", "E5", "D#5", "E5", "B4", "D5", "C5", "A4"] },
  ],
  advanced: [
    { name: "Flight of the Bumblebee (excerpt)", notes: ["B4", "A#4", "B4", "A#4", "B4", "E4", "G4", "F#4", "E4", "D#4", "E4", "F#4", "G4", "A4", "B4"] },
    { name: "Moonlight Sonata (theme)", notes: ["C#4", "E4", "G#4", "C#5", "E5", "G#4", "C#5", "E5"] },
    { name: "Raga Yaman Arohana", notes: ["C4", "D4", "E4", "F#4", "G4", "A4", "B4", "C5"] },
  ],
};

// ── Sargam Note Map ───────────────────────────────────────────────

const SARGAM_TO_WESTERN = {
  Sa: "C4", Re: "D4", Ga: "E4", Ma: "F4", Pa: "G4", Dha: "A4", Ni: "B4", "Sa'": "C5",
  "Re♭": "C#4", "Re#": "D#4", "Ga♭": "D#4", "Ga#": "F4",
  "Ma♭": "E4", "Ma#": "F#4", "Dha♭": "G#4", "Dha#": "A#4",
  "Ni♭": "A#4", "Ni#": "C5",
};

// ── Core Audio Operations ─────────────────────────────────────────

function playNote(note, octave = 4, options = {}) {
  const {
    duration = 0.5,
    volume = 0.3,
    type = "triangle",
    delay = 0,
    label = null,
  } = options;

  const ctx = getCtx();
  const freq = noteFrequency(note, octave);
  const id = ++nodeCounter;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  const now = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.setValueAtTime(volume, now + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(getMasterGain());

  osc.start(now);
  osc.stop(now + duration + 0.01);

  const node = { osc, gain, id, label: label || `${note}${octave}` };
  activeNodes.set(id, node);

  osc.onended = () => {
    activeNodes.delete(id);
    try { osc.disconnect(); } catch (e) {}
    try { gain.disconnect(); } catch (e) {}
  };

  return id;
}

function playFrequency(freq, options = {}) {
  const {
    duration = 0.5,
    volume = 0.3,
    type = "triangle",
    delay = 0,
  } = options;

  const ctx = getCtx();
  const id = ++nodeCounter;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;

  const now = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.setValueAtTime(volume, now + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(getMasterGain());

  osc.start(now);
  osc.stop(now + duration + 0.01);

  const node = { osc, gain, id };
  activeNodes.set(id, node);

  osc.onended = () => {
    activeNodes.delete(id);
    try { osc.disconnect(); } catch (e) {}
    try { gain.disconnect(); } catch (e) {}
  };

  return id;
}

function playInterval(note1, octave1, note2, octave2, options = {}) {
  const { gap = 0.6 } = options;
  const id1 = playNote(note1, octave1, { ...options, delay: 0 });
  const id2 = playNote(note2, octave2, { ...options, delay: gap });
  return [id1, id2];
}

function playMelody(noteOctavePairs, options = {}) {
  const { noteDuration = 0.4, gap = 0.05 } = options;
  const ids = [];
  noteOctavePairs.forEach((pair, i) => {
    const [note, octave] = typeof pair === "string"
      ? [pair.replace(/[0-9]/g, ""), parseInt(pair.match(/[0-9]/)?.[0] || "4")]
      : [pair.note, pair.octave || 4];
    ids.push(playNote(note, octave, {
      duration: noteDuration,
      volume: options.volume || 0.3,
      type: options.type || "triangle",
      delay: i * (noteDuration + gap),
    }));
  });
  return ids;
}

function playRhythmPattern(beats, options = {}) {
  const { bpm = 120, volume = 0.4, accentVolume = 0.7 } = options;
  const beatDuration = 60 / bpm;
  const ids = [];

  beats.forEach((intensity, i) => {
    if (intensity > 0) {
      const vol = i === 0 ? accentVolume : volume * intensity;
      const freq = i === 0 ? 880 : 660;
      ids.push(playFrequency(freq, {
        duration: 0.1,
        volume: vol,
        type: "sine",
        delay: i * beatDuration,
      }));
    }
  });

  return ids;
}

function playClick(isAccent = false, volume = 0.4) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = isAccent ? 1000 : 800;
  gain.gain.value = volume * (isAccent ? 1.0 : 0.6);

  osc.connect(gain);
  gain.connect(getMasterGain());

  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.stop(now + 0.1);
}

function stopAll() {
  activeNodes.forEach((node) => {
    try {
      node.osc.stop();
      node.osc.disconnect();
      node.gain.disconnect();
    } catch (e) {}
  });
  activeNodes.clear();
}

function setMasterVolume(vol) {
  const mg = getMasterGain();
  mg.gain.value = Math.max(0, Math.min(1, vol));
}

function suspend() {
  if (sharedCtx && sharedCtx.state === "running") {
    sharedCtx.suspend();
  }
}

function resume() {
  getCtx();
}

function cleanup() {
  stopAll();
  if (sharedCtx && sharedCtx.state !== "closed") {
    sharedCtx.close().catch(() => {});
  }
  sharedCtx = null;
  masterGain = null;
}

function getState() {
  return sharedCtx ? sharedCtx.state : "closed";
}

export {
  getCtx,
  noteFrequency,
  frequencyToNote,
  playNote,
  playFrequency,
  playInterval,
  playMelody,
  playRhythmPattern,
  playClick,
  stopAll,
  setMasterVolume,
  suspend,
  resume,
  cleanup,
  getState,
  NOTE_NAMES,
  BASE_FREQUENCIES,
  INTERVALS,
  RHYTHM_PATTERNS,
  MELODIES,
  SARGAM_TO_WESTERN,
};
