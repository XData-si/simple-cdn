import type { Config } from '../types';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(config: Config) {
    this.maxRequests = config.rateLimitRequests;
    this.windowMs = config.rateLimitWindow;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.limits.get(identifier);

    // Create new entry or reset if window expired
    if (!entry || now >= entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + this.windowMs,
      };
      this.limits.set(identifier, entry);
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, count: entry.count });
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(identifier);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limit entries cleaned up', { count: cleaned });
    }
  }
}
