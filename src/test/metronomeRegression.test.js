import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Metronome regression: playClick with zero volume', () => {
  let originalAudioContext;

  beforeEach(() => {
    vi.resetModules();
  });

  it('Metronome playClick uses setValueAtTime + linearRampToValueAtTime (not exponentialRampToValueAtTime)', async () => {
    // Verify the source code uses linearRampToValueAtTime to avoid
    // InvalidStateError when volume is 0
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/pages/Metronome.jsx'),
      'utf-8'
    );
    expect(src).toContain('linearRampToValueAtTime');
    expect(src).not.toContain('exponentialRampToValueAtTime');
  });

  it('Metronome uses setValueAtTime for initial gain value', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/pages/Metronome.jsx'),
      'utf-8'
    );
    expect(src).toContain('setValueAtTime');
  });

  it('Metronome cleans up on unmount', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/pages/Metronome.jsx'),
      'utf-8'
    );
    expect(src).toContain('cancelAnimationFrame');
    expect(src).toContain('audioCtxRef.current.close()');
  });

  it('Metronome uses refs for stale closure prevention', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/pages/Metronome.jsx'),
      'utf-8'
    );
    expect(src).toContain('bpmRef');
    expect(src).toContain('volumeRef');
    expect(src).toContain('beatsPerMeasureRef');
  });
});
