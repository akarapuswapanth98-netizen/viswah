import { vi, describe, it, expect } from 'vitest';

describe('MusicLabUI regression: missing constants', () => {
  it('C object has surfaceHover defined', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/components/musicLab/MusicLabUI.jsx'),
      'utf-8'
    );
    expect(src).toContain('surfaceHover:');
  });

  it('C object has borderAccent defined', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/components/musicLab/MusicLabUI.jsx'),
      'utf-8'
    );
    expect(src).toContain('borderAccent:');
  });

  it('border opacity is at least 0.10 for visibility', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/components/musicLab/MusicLabUI.jsx'),
      'utf-8'
    );
    const borderMatch = src.match(/border:\s*"rgba\(240,\s*235,\s*227,\s*([\d.]+)\)"\s*,/);
    expect(borderMatch).toBeTruthy();
    if (borderMatch) {
      const opacity = parseFloat(borderMatch[1]);
      expect(opacity).toBeGreaterThanOrEqual(0.10);
    }
  });
});

describe('VocalGuru regression: setAudioBlob scope', () => {
  it('handlePracticeAgain uses recorder.setAudioBlob not bare setAudioBlob', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/pages/VocalGuru.jsx'),
      'utf-8'
    );
    // Find handlePracticeAgain function body
    const match = src.match(/handlePracticeAgain\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n  \};/);
    expect(match).toBeTruthy();
    if (match) {
      const body = match[1];
      expect(body).toContain('recorder.setAudioBlob(null)');
      // Ensure no bare setAudioBlob call in this function
      const lines = body.split('\n').filter(l => l.trim().startsWith('setAudioBlob'));
      expect(lines).toHaveLength(0);
    }
  });
});
