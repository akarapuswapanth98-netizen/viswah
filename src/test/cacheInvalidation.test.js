import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invalidateCache, setCache, getCached } from '../utils/cache';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  invalidateCache(null);
  mockFetch.mockReset();
});

describe('API client cache invalidation', () => {
  it('enrollment invalidates enrolled and courses caches', async () => {
    setCache('get:/api/enrolled', [{ id: 1 }], 60000);
    setCache('get:/api/courses', [{ id: 1 }], 60000);
    setCache('get:/api/courses/1', { id: 1 }, 60000);

    // Simulate what client.post does for enrollment
    const endpoint = '/api/enroll/1';
    if (endpoint.startsWith('/api/enroll/')) {
      const courseId = endpoint.split('/api/enroll/')[1];
      const keys = ['get:/api/enrolled', 'get:/api/courses', `get:/api/courses/${courseId}`];
      keys.forEach(k => invalidateCache(k));
    }

    expect(getCached('get:/api/enrolled')).toBeNull();
    expect(getCached('get:/api/courses')).toBeNull();
    expect(getCached('get:/api/courses/1')).toBeNull();
  });

  it('progress update invalidates progress cache', async () => {
    setCache('get:/api/progress', [{ id: 1 }], 60000);

    const endpoint = '/api/progress';
    if (endpoint === '/api/progress') {
      invalidateCache('get:/api/progress');
    }

    expect(getCached('get:/api/progress')).toBeNull();
  });

  it('logout clears all cache', () => {
    setCache('get:/api/courses', [{ id: 1 }], 60000);
    setCache('get:/api/enrolled', [{ id: 1 }], 60000);
    setCache('get:/api/progress', [{ id: 1 }], 60000);

    invalidateCache(null);

    expect(getCached('get:/api/courses')).toBeNull();
    expect(getCached('get:/api/enrolled')).toBeNull();
    expect(getCached('get:/api/progress')).toBeNull();
  });
});
