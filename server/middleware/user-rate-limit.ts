/**
 * Per-User Rate Limiting Middleware
 * Prevents individual users from exhausting system resources
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class UserRateLimiter {
    private limits: Map<number, RateLimitEntry>;
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests = 100, windowMinutes = 1) {
        this.limits = new Map();
        this.maxRequests = maxRequests;
        this.windowMs = windowMinutes * 60 * 1000;

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if user has exceeded rate limit
     */
    checkLimit(userId: number): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        let entry = this.limits.get(userId);

        // Create new entry or reset if window expired
        if (!entry || now >= entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + this.windowMs,
            };
            this.limits.set(userId, entry);
        }

        // Check if under limit
        if (entry.count < this.maxRequests) {
            entry.count++;
            return {
                allowed: true,
                remaining: this.maxRequests - entry.count,
                resetTime: entry.resetTime,
            };
        }

        // Rate limit exceeded
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Remove expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [userId, entry] of Array.from(this.limits.entries())) {
            if (now >= entry.resetTime) {
                this.limits.delete(userId);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[RateLimit] Cleaned up ${removed} expired rate limit entries`);
        }
    }

    /**
     * Get current stats
     */
    getStats() {
        return {
            trackedUsers: this.limits.size,
            maxRequests: this.maxRequests,
            windowMs: this.windowMs,
        };
    }
}

// Create rate limiter instances
export const standardRateLimiter = new UserRateLimiter(100, 1); // 100 requests per minute
export const bulkEmailRateLimiter = new UserRateLimiter(10, 1);  // 10 bulk requests per minute

/**
 * Middleware factory for per-user rate limiting
 */
export function createUserRateLimit(limiter: UserRateLimiter) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip if no user (unauthenticated routes)
        const user = (req as any).user;
        if (!user || !user.id) {
            return next();
        }

        const result = limiter.checkLimit(user.id);
        const stats = limiter.getStats();

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', stats.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        if (!result.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Too many requests. Please try again after ${new Date(result.resetTime).toISOString()}`,
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            });
        }

        next();
    };
}

// Export standard middleware
export const userRateLimit = createUserRateLimit(standardRateLimiter);
export const bulkEmailRateLimit = createUserRateLimit(bulkEmailRateLimiter);
