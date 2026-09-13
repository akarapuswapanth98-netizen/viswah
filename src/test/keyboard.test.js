import { describe, it, expect, vi } from 'vitest';
import { onKeyDown } from '../utils/keyboard';

describe('onKeyDown', () => {
  it('calls onClick on Enter key', () => {
    const handler = vi.fn();
    onKeyDown({ key: 'Enter', preventDefault: vi.fn() }, handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Space key', () => {
    const handler = vi.fn();
    onKeyDown({ key: ' ', preventDefault: vi.fn() }, handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick on other keys', () => {
    const handler = vi.fn();
    onKeyDown({ key: 'Tab', preventDefault: vi.fn() }, handler);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call onClick if handler is null', () => {
    expect(() => onKeyDown({ key: 'Enter', preventDefault: vi.fn() }, null)).not.toThrow();
  });
});
