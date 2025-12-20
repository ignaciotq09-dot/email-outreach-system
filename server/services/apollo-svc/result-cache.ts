/**
 * Apollo Search Result Cache
 * Caches full search results for identical filter combinations to reduce API calls
 * TTL: 15 minutes (Apollo data doesn't change frequently)
 */

import type { ApolloSearchResponse, ApolloSearchFilters } from "./types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 100; // Max cached results

interface CacheEntry {
    response: ApolloSearchResponse;
    createdAt: number;
    hits: number;
}

class ApolloResultCache {
    private cache: Map<string, CacheEntry> = new Map();

    /**
     * Generate a unique cache key from filters
     * Normalizes and sorts to ensure consistent keys
     */
    private generateKey(filters: ApolloSearchFilters): string {
        const normalized = {
            jobTitles: [...(filters.jobTitles || [])].sort().map(t => t.toLowerCase().trim()),
            locations: [...(filters.locations || [])].sort().map(l => l.toLowerCase().trim()),
            industries: [...(filters.industries || [])].sort().map(i => i.toLowerCase().trim()),
            companySizes: [...(filters.companySizes || [])].sort(),
            companies: [...(filters.companies || [])].sort().map(c => c.toLowerCase().trim()),
            emailStatuses: [...(filters.emailStatuses || [])].sort(),
            page: filters.page || 1,
            perPage: filters.perPage || 25,
        };

        return JSON.stringify(normalized);
    }

    /**
     * Get cached result if exists and not expired
     */
    get(filters: ApolloSearchFilters): ApolloSearchResponse | null {
        const key = this.generateKey(filters);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
            this.cache.delete(key);
            console.log(`[ApolloCache] EXPIRED: ${this.summarizeFilters(filters)}`);
            return null;
        }

        entry.hits++;
        console.log(`[ApolloCache] HIT: ${this.summarizeFilters(filters)} (hits: ${entry.hits})`);
        return entry.response;
    }

    /**
     * Cache search result
     */
    set(filters: ApolloSearchFilters, response: ApolloSearchResponse): void {
        // Evict if at max size
        if (this.cache.size >= MAX_CACHE_SIZE) {
            this.evictOldest();
        }

        const key = this.generateKey(filters);
        this.cache.set(key, {
            response,
            createdAt: Date.now(),
            hits: 1,
        });

        console.log(`[ApolloCache] SET: ${this.summarizeFilters(filters)} (${response.leads.length} leads)`);
    }

    /**
     * Evict oldest entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of Array.from(this.cache.entries())) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`[ApolloCache] EVICTED oldest entry`);
        }
    }

    /**
     * Create short summary of filters for logging
     */
    private summarizeFilters(filters: ApolloSearchFilters): string {
        const parts: string[] = [];
        if (filters.jobTitles?.length) parts.push(`titles:${filters.jobTitles.slice(0, 2).join(',')}`);
        if (filters.locations?.length) parts.push(`loc:${filters.locations[0]}`);
        if (filters.industries?.length) parts.push(`ind:${filters.industries[0]}`);
        return parts.join(' | ') || 'no-filters';
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; totalHits: number } {
        let totalHits = 0;
        for (const entry of Array.from(this.cache.values())) {
            totalHits += entry.hits;
        }
        return { size: this.cache.size, totalHits };
    }

    /**
     * Clear all cached results
     */
    clear(): void {
        this.cache.clear();
        console.log('[ApolloCache] Cleared');
    }
}

export const apolloResultCache = new ApolloResultCache();
