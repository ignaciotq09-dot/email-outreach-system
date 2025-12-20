/**
 * Cache Service for High-Concurrency User Management
 * 
 * Implements in-memory LRU caching using lru-cache library
 * to reduce database load when supporting 1500+ concurrent users.
 */

import LRU from 'lru-cache';

interface CacheStats {
    hits: number;
    misses: number;
    entries: number;
    hitRate: string;
    memoryEstimateMB: number;
}

export class CacheService {
    private cache: LRU<string, any>;
    private hits: number;
    private misses: number;

    constructor(maxEntries = 1000, ttlMinutes = 5) {
        this.cache = new LRU({
            max: maxEntries,
            maxAge: ttlMinutes * 60 * 1000,
            updateAgeOnGet: true, // Refresh TTL on access
        });
        this.hits = 0;
        this.misses = 0;

        // Log stats every 10 minutes
        setInterval(() => this.logStats(), 10 * 60 * 1000);
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        const value = this.cache.get(key);

        if (value === undefined) {
            this.misses++;
            return null;
        }

        this.hits++;
        return value as T;
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, data: T): void {
        this.cache.set(key, data);
    }

    /**
     * Delete specific key from cache
     */
    delete(key: string): boolean {
        if (this.cache.has(key)) {
            this.cache.del(key);
            return true;
        }
        return false;
    }

    /**
     * Delete all keys matching a pattern
     * Note: LRU cache doesn't support pattern matching natively efficiently,
     * so we have to iterate. This usually isn't frequent.
     */
    deletePattern(pattern: string): number {
        let count = 0;
        const regex = new RegExp(pattern);

        // keys() returns an iterator
        const keys = this.cache.keys();
        for (const key of keys) {
            if (regex.test(key)) {
                this.cache.del(key);
                count++;
            }
        }

        return count;
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.reset();
        console.log('[Cache] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : '0.00';

        // Rough memory estimate
        const avgEntrySize = 1024; // Assume ~1KB per entry
        const memoryEstimateMB = (this.cache.length * avgEntrySize) / (1024 * 1024);

        return {
            hits: this.hits,
            misses: this.misses,
            entries: this.cache.length,
            hitRate: `${hitRate}%`,
            memoryEstimateMB: parseFloat(memoryEstimateMB.toFixed(2)),
        };
    }

    /**
     * Log cache statistics
     */
    private logStats(): void {
        const stats = this.getStats();
        console.log('[Cache] Statistics:', stats);
    }
}

// Singleton instance
export const cacheService = new CacheService(
    2000, // Max 2000 entries (for 1500 users + buffer)
    5     // 5 minute TTL
);

// Specialized cache key generators
export const CacheKeys = {
    user: {
        byId: (id: number) => `user:id:${id}`,
        byEmail: (email: string) => `user:email:${email}`,
        byReplitAuthId: (authId: string) => `user:replit:${authId}`,
    },
    oauth: {
        tokens: (userId: number, provider: string) => `oauth:${userId}:${provider}`,
    },
    preferences: {
        email: (userId: number) => `prefs:email:${userId}`,
    },
    // Pattern for invalidating all user-related cache
    userPattern: (userId: number) => `(user|oauth|prefs):.*:${userId}`,
};
