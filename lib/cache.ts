type CacheEntry = {
  data: unknown;
  timestamp: number;
};

const store: Record<string, CacheEntry> = {};
const TTL = 5 * 60 * 1000; // 5分钟

export function getCache(key: string): unknown | null {
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    delete store[key];
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: unknown): void {
  store[key] = { data, timestamp: Date.now() };
}

export function invalidateCache(key: string): void {
  delete store[key];
}

export function invalidatePrefix(prefix: string): void {
  Object.keys(store).forEach(k => {
    if (k.startsWith(prefix)) delete store[k];
  });
}
