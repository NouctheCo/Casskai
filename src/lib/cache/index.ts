/**
 * CassKai - Unified Cache Module
 *
 * Two simple, reusable cache primitives:
 * - MemoryCache: in-memory Map with TTL (for hot data, KPIs, etc.)
 * - PersistentCache: localStorage with TTL (survives page refresh)
 *
 * For other caching concerns see:
 * - src/lib/offline-db.ts          (Dexie/IndexedDB for offline-first)
 * - src/lib/ai-cache.ts            (Supabase-backed AI response cache)
 * - src/lib/cache-strategies.ts     (Service Worker / Cache API)
 */

/**
 * In-memory cache with TTL support.
 *
 * Usage:
 * ```ts
 * const cache = new MemoryCache<MyData>(5 * 60 * 1000); // 5 min default TTL
 * cache.set('key', data);
 * cache.set('key', data, 30_000); // override TTL to 30s
 * const value = cache.get('key'); // undefined if expired
 * ```
 */
export class MemoryCache<T = unknown> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private defaultTTL: number = 5 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Number of entries (including possibly expired ones). */
  get size(): number {
    return this.store.size;
  }

  /**
   * Remove all expired entries.
   * Call periodically if you care about memory on long-lived caches.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Persistent cache using localStorage with TTL.
 *
 * Usage:
 * ```ts
 * const cache = new PersistentCache<MyData>('ck_reports_');
 * cache.set('balance_sheet', data);
 * const value = cache.get('balance_sheet'); // undefined if expired
 * ```
 */
export class PersistentCache<T = unknown> {
  constructor(
    private prefix: string = 'ck_cache_',
    private defaultTTL: number = 30 * 60 * 1000 // 30 min default
  ) {}

  get(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return undefined;
      const entry = JSON.parse(raw) as { value: T; expiresAt: number };
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(this.prefix + key);
        return undefined;
      }
      return entry.value;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: T, ttl?: number): void {
    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify({
          value,
          expiresAt: Date.now() + (ttl ?? this.defaultTTL),
        })
      );
    } catch {
      // localStorage full or unavailable, silently fail
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(this.prefix)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  }
}
