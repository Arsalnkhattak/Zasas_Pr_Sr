/**
 * Cache Utility — Cache-Aside Pattern with Graceful Fallback
 *
 * CONCEPT: Cache-Aside (Lazy Loading)
 *   1. Application checks cache first on every read.
 *   2. Cache MISS → query MongoDB, store result in Redis with a TTL, return data.
 *   3. Cache HIT  → return data immediately (sub-millisecond vs ~20-50ms MongoDB round-trip).
 *   4. On write/delete → invalidate affected cache keys so stale data is never served.
 *
 * GRACEFUL FALLBACK: Every Redis call is wrapped in try-catch.
 * If Redis is not running, the app simply logs a warning and queries MongoDB directly.
 * Zero crashes, zero downtime — Redis is an optimisation, not a hard dependency.
 */

import { getRedisClient } from '../config/redis';
import { logger } from './logger';

const DEFAULT_TTL_SECONDS = 60;

/**
 * Get a cached value by key.
 * Returns null on cache miss OR if Redis is unavailable.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err: any) {
    logger.debug(`[Cache] GET miss/error for key "${key}": ${err.message}`);
    return null;
  }
}

/**
 * Store a value in cache with an optional TTL (default 60 seconds).
 * Silently skips if Redis is unavailable.
 */
export async function setCache(
  key: string,
  data: unknown,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    logger.debug(`[Cache] SET key "${key}" (TTL: ${ttlSeconds}s)`);
  } catch (err: any) {
    logger.debug(`[Cache] SET error for key "${key}": ${err.message}`);
  }
}

/**
 * Delete a specific cache key.
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
    logger.debug(`[Cache] DEL key "${key}"`);
  } catch (err: any) {
    logger.debug(`[Cache] DEL error for key "${key}": ${err.message}`);
  }
}

/**
 * Invalidate all cache keys matching a prefix pattern.
 *
 * CONCEPT: Prefix-Based Invalidation
 *   We namespace keys like `users:list:*` so we can wipe an entire group of
 *   cached pages at once whenever the underlying data changes.
 *   This avoids manually tracking every individual cache key.
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    // SCAN is non-blocking, unlike KEYS which can block Redis in production.
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
        logger.debug(`[Cache] Invalidated ${keys.length} keys with prefix "${prefix}"`);
      }
    } while (cursor !== '0');
  } catch (err: any) {
    logger.debug(`[Cache] Invalidation error for prefix "${prefix}": ${err.message}`);
  }
}
