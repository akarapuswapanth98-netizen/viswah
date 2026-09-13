// Musical micro-interactions — shared audio feedback
// Uses Web Audio API for instant, lightweight sounds
import { useRef, useCallback, useEffect } from "react";

let sharedCtx = null;
let muted = false;

function getCtx() {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

// Pentatonic scale frequencies (Sa, Re, Ga, Pa, Dha)
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];

function playTone(freq, duration, volume = 0.15, type = "sine") {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function useAudioFeedback() {
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, []);

  const buttonClick = useCallback(() => {
    if (mutedRef.current) return;
    // Soft click — like a wooden mallet
    playTone(PENTATONIC[0], 0.08, 0.1, "triangle");
  }, []);

  const navChime = useCallback(() => {
    if (mutedRef.current) return;
    // Gentle ascending — like a hand brushing strings
    const ctx = getCtx();
    const now = ctx.currentTime;
    PENTATONIC.slice(0, 3).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.06);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.15 + i * 0.06);
    });
  }, []);

  const completion = useCallback(() => {
    if (mutedRef.current) return;
    // Warm resolution — root then fifth
    playTone(PENTATONIC[0], 0.2, 0.12, "sine");
    setTimeout(() => playTone(PENTATONIC[4], 0.3, 0.1, "sine"), 150);
  }, []);

  const error = useCallback(() => {
    if (mutedRef.current) return;
    // Soft descending
    playTone(PENTATONIC[3], 0.1, 0.08, "triangle");
    setTimeout(() => playTone(PENTATONIC[1], 0.15, 0.06, "triangle"), 100);
  }, []);

  const toggleMute = useCallback(() => {
    muted = !muted;
    mutedRef.current = muted;
    return muted;
  }, []);

  const isMuted = useCallback(() => mutedRef.current, []);

  return { buttonClick, navChime, completion, error, toggleMute, isMuted };
}
