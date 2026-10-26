import rateLimit, { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { redis, isRedisConnected } from '../config/redis';
import { Request, Response } from 'express';

/**
 * Resilient Rate Limit Store:
 * Automatically uses Redis when available and falls back to memory store when offline.
 */
class ResilientRateLimitStore implements Store {
  prefix: string;
  private windowMs: number = 15 * 60 * 1000;
  private memoryMap = new Map<string, { totalHits: number; resetTime: Date }>();

  constructor(prefix: string) {
    this.prefix = `rl:${prefix}:`;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();

    if (isRedisConnected()) {
      try {
        const hits = await redis.incr(fullKey);
        if (hits === 1) {
          await redis.pexpire(fullKey, this.windowMs);
        }
        const pttl = await redis.pttl(fullKey);
        const resetTime = new Date(now + (pttl > 0 ? pttl : this.windowMs));
        return {
          totalHits: hits,
          resetTime,
        };
      } catch {
        // Fallback to memory on runtime Redis error
      }
    }

    // In-memory fallback
    const entry = this.memoryMap.get(fullKey);
    if (!entry || entry.resetTime.getTime() <= now) {
      const resetTime = new Date(now + this.windowMs);
      const newEntry = { totalHits: 1, resetTime };
      this.memoryMap.set(fullKey, newEntry);
      return newEntry;
    }

    entry.totalHits += 1;
    return entry;
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (isRedisConnected()) {
      try {
        await redis.decr(fullKey);
        return;
      } catch {}
    }
    const entry = this.memoryMap.get(fullKey);
    if (entry && entry.totalHits > 0) {
      entry.totalHits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    if (isRedisConnected()) {
      try {
        await redis.del(fullKey);
      } catch {}
    }
    this.memoryMap.delete(fullKey);
  }

  async resetAll(): Promise<void> {
    if (isRedisConnected()) {
      try {
        const keys = await redis.keys(`${this.prefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch {}
    }
    this.memoryMap.clear();
  }
}

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  store: new ResilientRateLimitStore('api'),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    });
  },
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/api/v1/health';
  },
});

/**
 * Strict Auth/Login Rate Limiter
 * 10 login attempts per 15 minutes per IP address to prevent brute-force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('auth'),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    });
  },
});
