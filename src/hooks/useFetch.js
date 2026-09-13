import { useState, useEffect, useCallback } from 'react';
import { cachedFetch, invalidateCache } from '../utils/cache';

export function useFetch(fetchFn, deps = [], options = {}) {
  const { ttl = 30000, cacheKey = null, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (skipCache = false) => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      if (skipCache && cacheKey) invalidateCache(cacheKey);
      const result = cacheKey
        ? await cachedFetch(cacheKey, fetchFn, ttl)
        : await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled, cacheKey, ttl, fetchFn]);

  useEffect(() => {
    execute();
  }, deps);

  const refetch = useCallback(() => execute(true), [execute]);

  return { data, loading, error, refetch };
}
