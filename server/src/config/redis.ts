import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

let isConnected = false;
let redisClientInstance: Redis | null = null;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const DEFAULT_DASHBOARD_TTL = parseInt(process.env.REDIS_DASHBOARD_TTL || '60', 10);

// In-memory fallback cache store for development / offline resilience
interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheEntry>();

let hasLoggedOfflineWarning = false;

const redisOptions: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000,
  retryStrategy(times) {
    // In local development without Redis, stop retrying after 3 attempts to avoid console spam
    if (times > 3) {
      return null;
    }
    return 1000;
  },
};

export const getRedisClient = (): Redis => {
  if (!redisClientInstance) {
    try {
      redisClientInstance = new Redis(redisUrl, redisOptions);

      redisClientInstance.on('connect', () => {
        isConnected = true;
        hasLoggedOfflineWarning = false;
        logger.info(`[Redis] Connected successfully to ${redisUrl}`);
      });

      redisClientInstance.on('ready', () => {
        isConnected = true;
        hasLoggedOfflineWarning = false;
        logger.info('[Redis] Client is ready for operations');
      });

      redisClientInstance.on('error', (err: Error) => {
        isConnected = false;
        if (!hasLoggedOfflineWarning) {
          hasLoggedOfflineWarning = true;
          logger.warn(
            `[Redis] Redis offline (${err.message || 'connection refused'}). Seamlessly operating with in-memory cache and rate limiter.`
          );
        }
      });

      redisClientInstance.on('close', () => {
        isConnected = false;
      });

      redisClientInstance.on('reconnecting', () => {});

      // Initiate connection asynchronously
      redisClientInstance.connect().catch((err) => {
        isConnected = false;
        if (!hasLoggedOfflineWarning) {
          hasLoggedOfflineWarning = true;
          logger.warn(
            `[Redis] Initial connection unavailable (${err.message || 'connection refused'}). Operating in fallback mode.`
          );
        }
      });
    } catch (err: any) {
      isConnected = false;
      logger.warn(`[Redis] Initialization error: ${err.message}. Operating in fallback mode.`);
      redisClientInstance = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
    }
  }

  return redisClientInstance;
};

export const redis: Redis = getRedisClient();

export const isRedisConnected = (): boolean => {
  return isConnected && redis.status === 'ready';
};

/**
 * Retrieve JSON cached value by key.
 * Uses Redis if online; falls back to internal memory cache if offline.
 */
export const getCache = async <T = unknown>(key: string): Promise<T | null> => {
  try {
    if (isRedisConnected()) {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    }

    // Memory fallback
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  } catch (error: any) {
    logger.warn(`[Redis] getCache error for key '${key}': ${error.message}`);
    return null;
  }
};

/**
 * Store JSON value into cache with TTL (in seconds).
 * Uses Redis if online; stores in memory cache if offline.
 */
export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_DASHBOARD_TTL
): Promise<boolean> => {
  try {
    const serialized = JSON.stringify(value);

    if (isRedisConnected()) {
      if (ttlSeconds > 0) {
        await redis.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    }

    // Memory fallback
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    memoryCache.set(key, { value: serialized, expiresAt });
    return true;
  } catch (error: any) {
    logger.warn(`[Redis] setCache error for key '${key}': ${error.message}`);
    return false;
  }
};

/**
 * Delete a specific key from cache.
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    if (isRedisConnected()) {
      await redis.del(key);
    }
    memoryCache.delete(key);
    return true;
  } catch (error: any) {
    logger.warn(`[Redis] deleteCache error for key '${key}': ${error.message}`);
    memoryCache.delete(key);
    return false;
  }
};

/**
 * Delete all keys matching a given pattern (e.g. 'assetguard:dashboard*').
 */
export const deleteCachePattern = async (pattern: string): Promise<number> => {
  try {
    let deletedCount = 0;

    if (isRedisConnected()) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        deletedCount = await redis.del(...keys);
      }
    }

    // Clear matching memory keys
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regexPattern.test(key)) {
        memoryCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error: any) {
    logger.warn(`[Redis] deleteCachePattern error for pattern '${pattern}': ${error.message}`);
    return 0;
  }
};

/**
 * Reusable helper to invalidate all dashboard cache entries across roles.
 * Triggered on asset, wiping, verification, and disposal mutations.
 */
export const invalidateDashboardCache = async (): Promise<void> => {
  try {
    await deleteCachePattern('assetguard:dashboard*');
    logger.info('[Redis] Dashboard cache invalidated.');
  } catch (error: any) {
    logger.warn(`[Redis] Failed to invalidate dashboard cache: ${error.message}`);
  }
};

/**
 * Cleanly close connection for teardown in test suites.
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClientInstance) {
    try {
      await redisClientInstance.quit();
    } catch {
      redisClientInstance.disconnect();
    }
    redisClientInstance = null;
    isConnected = false;
  }
  memoryCache.clear();
};
