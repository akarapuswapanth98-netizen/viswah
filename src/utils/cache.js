const cache = new Map();
const inflight = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttlMs = 30000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
}

export function invalidateExact(...keys) {
  for (const key of keys) {
    cache.delete(key);
  }
}

export async function cachedFetch(key, fetchFn, ttlMs = 30000) {
  const cached = getCached(key);
  if (cached !== null) return cached;

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = fetchFn()
    .then((data) => {
      setCache(key, data, ttlMs);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
