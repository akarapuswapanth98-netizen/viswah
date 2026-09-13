import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cachedFetch, getCached, setCache, invalidateCache, invalidateExact } from '../utils/cache';

beforeEach(() => {
  invalidateCache(null);
});

describe('cache', () => {
  it('stores and retrieves data', () => {
    setCache('test:key', { name: 'test' }, 60000);
    expect(getCached('test:key')).toEqual({ name: 'test' });
  });

  it('returns null for expired entries', () => {
    setCache('test:expire', 'data', -1);
    expect(getCached('test:expire')).toBeNull();
  });

  it('invalidates by prefix', () => {
    setCache('get:/api/courses', [{ id: 1 }], 60000);
    setCache('get:/api/progress', [{ id: 2 }], 60000);
    invalidateCache('get:/api/courses');
    expect(getCached('get:/api/courses')).toBeNull();
    expect(getCached('get:/api/progress')).toEqual([{ id: 2 }]);
  });

  it('invalidates exact keys', () => {
    setCache('get:/api/enrolled', [{ id: 1 }], 60000);
    setCache('get:/api/courses', [{ id: 2 }], 60000);
    invalidateExact('get:/api/enrolled');
    expect(getCached('get:/api/enrolled')).toBeNull();
    expect(getCached('get:/api/courses')).toEqual([{ id: 2 }]);
  });

  it('clears all on null pattern', () => {
    setCache('a', 1, 60000);
    setCache('b', 2, 60000);
    invalidateCache(null);
    expect(getCached('a')).toBeNull();
    expect(getCached('b')).toBeNull();
  });

  it('deduplicates in-flight requests', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      return 'result';
    };
    const [r1, r2] = await Promise.all([
      cachedFetch('dedup:test', fetchFn, 60000),
      cachedFetch('dedup:test', fetchFn, 60000),
    ]);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(callCount).toBe(1);
  });
});
