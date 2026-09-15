import { vi, describe, it, expect, beforeEach } from 'vitest';

function readSource() {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.resolve('src/pages/Metronome.jsx'), 'utf-8');
}

describe('Metronome regression: playClick with zero volume', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Metronome playClick uses setValueAtTime + linearRampToValueAtTime (not exponentialRampToValueAtTime)', async () => {
    const src = readSource();
    expect(src).toContain('linearRampToValueAtTime');
    expect(src).not.toContain('exponentialRampToValueAtTime');
  });

  it('Metronome uses setValueAtTime for initial gain value', async () => {
    const src = readSource();
    expect(src).toContain('setValueAtTime');
  });

  it('Metronome cleans up on unmount', async () => {
    const src = readSource();
    expect(src).toContain('cancelAnimationFrame');
    expect(src).toContain('audioCtxRef.current.close()');
  });

  it('Metronome uses refs for stale closure prevention', async () => {
    const src = readSource();
    expect(src).toContain('bpmRef');
    expect(src).toContain('volumeRef');
    expect(src).toContain('beatsPerMeasureRef');
  });
});

describe('Metronome: no duplicate scheduler', () => {
  it('startMetronome guards against double-start', async () => {
    const src = readSource();
    expect(src).toContain('if (timerRef.current) return');
  });

  it('stopMetronome clears timerRef', async () => {
    const src = readSource();
    expect(src).toMatch(/cancelAnimationFrame\(timerRef\.current\)/);
    expect(src).toMatch(/timerRef\.current\s*=\s*null/);
  });
});

describe('Metronome: visual timer cleanup', () => {
  it('tracks beat visual timers via ref', async () => {
    const src = readSource();
    expect(src).toContain('beatVisualTimersRef');
  });

  it('clears visual timers on stop', async () => {
    const src = readSource();
    expect(src).toContain('clearBeatVisualTimers');
    const stopFn = src.substring(src.indexOf('stopMetronome'));
    expect(stopFn.substring(0, stopFn.indexOf('};')).replace(/\s+/g, ' ')).toContain('clearBeatVisualTimers()');
  });

  it('clears visual timers on unmount', async () => {
    const src = readSource();
    const cleanupEffect = src.substring(src.indexOf('Cleanup on unmount'));
    expect(cleanupEffect.replace(/\s+/g, ' ')).toContain('clearBeatVisualTimers()');
  });

  it('prevents state update after unmount via mountedRef', async () => {
    const src = readSource();
    expect(src).toContain('mountedRef');
    expect(src).toContain('if (mountedRef.current)');
  });
});

describe('Metronome: stale timeout prevention', () => {
  it('clears startTimeout before setting new one in time signature change', async () => {
    const src = readSource();
    const timeSigSection = src.substring(
      src.indexOf('{/* Time Signature */}'),
      src.indexOf('{/* Indian Tala */}')
    );
    expect(timeSigSection).toContain('if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)');
  });

  it('clears startTimeout before setting new one in selectTala', async () => {
    const src = readSource();
    const selectTalaFn = src.substring(src.indexOf('const selectTala'));
    expect(selectTalaFn.substring(0, selectTalaFn.indexOf('addToast')).replace(/\s+/g, ' ')).toContain('clearTimeout(startTimeoutRef.current)');
  });
});

describe('Metronome: volume zero handling', () => {
  it('skips audio entirely when volume is zero', async () => {
    const src = readSource();
    expect(src).toMatch(/if \(volumeRef\.current === 0\) return/);
  });
});
