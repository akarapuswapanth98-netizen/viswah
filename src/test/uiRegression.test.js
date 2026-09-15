import { vi, describe, it, expect } from 'vitest';

describe('MusicLabUI regression: shared colors import', () => {
  it('imports C from shared colors module', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/components/musicLab/MusicLabUI.jsx'),
      'utf-8'
    );
    expect(src).toContain('import C from "../ui/colors"');
  });

  it('exports C for exercise pages', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve('src/components/musicLab/MusicLabUI.jsx'),
      'utf-8'
    );
    expect(src).toMatch(/export\s*\{[^}]*\bC\b[^}]*\}/s);
  });

  it('shared colors module has surfaceHover and borderActive', async () => {
    const colors = await import('../components/ui/colors');
    const C = colors.default;
    expect(C.surfaceHover).toBeDefined();
    expect(C.borderActive).toBeDefined();
    const opacity = parseFloat(C.border.replace(/^rgba\(\d+,\s*\d+,\s*\d+,\s*/, '').replace(/\)$/, ''));
    expect(opacity).toBeGreaterThanOrEqual(0.04);
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
    const match = src.match(/handlePracticeAgain\s*=\s*\(\)\s*=>\s*\{([\s\S]*?)\n  \};/);
    expect(match).toBeTruthy();
    if (match) {
      const body = match[1];
      expect(body).toContain('recorder.setAudioBlob(null)');
      const lines = body.split('\n').filter(l => l.trim().startsWith('setAudioBlob'));
      expect(lines).toHaveLength(0);
    }
  });
});
