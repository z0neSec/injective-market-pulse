/**
 * Generic in-memory caching layer with TTL support.
 *
 * Uses node-cache under the hood. Each service creates cache keys
 * with namespaced prefixes to avoid collisions.
 */

import NodeCache from 'node-cache';
import { config } from '../config';

const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  useClones: false, // Return reference for performance
});

/**
 * Get a value from cache, or compute + store it if missing.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const existing = cache.get<T>(key);
  if (existing !== undefined) {
    return { data: existing, cached: true };
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  return { data, cached: false };
}

/**
 * Invalidate a specific cache key.
 */
export function cacheInvalidate(key: string): void {
  cache.del(key);
}

/**
 * Get cache statistics for the status endpoint.
 */
export function cacheStats() {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0
      ? parseFloat(((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1))
      : 0,
  };
}

/** Default TTLs from config */
export const cacheTTL = {
  markets: config.cache.markets,
  orderbook: config.cache.orderbook,
  trades: config.cache.trades,
  health: config.cache.health,
  analytics: config.cache.analytics,
};
