type CacheEntry<T = unknown> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export const getCached = <T = unknown>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
};

export const setCached = <T = unknown>(key: string, value: T, ttlMs: number): void => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const clearCachedByPrefix = (prefix: string): void => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

