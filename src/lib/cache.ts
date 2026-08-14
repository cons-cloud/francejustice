/**
 * Cache Engine for France Justice Application
 * Provides in-memory + LocalStorage caching with Time-To-Live (TTL) support
 * to reduce redundant backend/Supabase queries and boost instant UI responsiveness.
 */

interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp in ms
}

class ClientCacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();

  /**
   * Set item in cache with TTL (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    const entry: CacheEntry<T> = { value: data, expiry };

    // Save to memory
    this.memoryCache.set(key, entry);

    // Save to localStorage for persistence across reloads
    try {
      localStorage.setItem(`fj_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Storage full or restricted
    }
  }

  /**
   * Get item from cache if not expired
   */
  get<T>(key: string): T | null {
    // 1. Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiry) {
        return memEntry.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Fallback to localStorage
    try {
      const raw = localStorage.getItem(`fj_cache_${key}`);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() < entry.expiry) {
          // Restore into memory cache
          this.memoryCache.set(key, entry);
          return entry.value;
        }
        localStorage.removeItem(`fj_cache_${key}`);
      }
    } catch {
      // JSON parse error or access issue
    }

    return null;
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`fj_cache_${key}`);
    } catch {
      // Ignore
    }
  }

  /**
   * Clear all app-specific cached items
   */
  clear(): void {
    this.memoryCache.clear();
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('fj_cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // Ignore
    }
  }
}

export const clientCache = new ClientCacheService();
