/**
 * AI Search Result Cache
 * In-memory cache with TTL for instant repeat query responses
 * 
 * Performance: Eliminates ~2500ms for identical queries within cache window
 */

import crypto from "crypto";
import type { AISearchResult } from "./search-service";

interface CacheEntry {
  result: AISearchResult;
  createdAt: number;
  hits: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (increased for stable high-confidence results)
const LOW_CONFIDENCE_TTL_MS = 5 * 60 * 1000; // 5 minutes for low-confidence results
const MAX_CACHE_SIZE = 100; // Per user
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean every minute

// Cache structure: userId -> queryHash -> CacheEntry
const searchCache = new Map<number, Map<string, CacheEntry>>();

// Track cache stats for monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
};

/**
 * Generate a deterministic hash for a search query + options
 */
function generateCacheKey(
  query: string,
  options: { page?: number; perPage?: number; useIcpScoring?: boolean }
): string {
  const normalized = {
    q: query.trim().toLowerCase(),
    p: options.page || 1,
    pp: options.perPage || 25,
    icp: options.useIcpScoring !== false,
  };

  const str = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 24);
}

/**
 * Deep clone a result to prevent mutations affecting cached copy
 */
function deepCloneResult(result: AISearchResult): AISearchResult {
  return {
    sessionId: result.sessionId,
    query: result.query,
    parsedFilters: {
      jobTitles: [...result.parsedFilters.jobTitles],
      locations: [...result.parsedFilters.locations],
      industries: [...result.parsedFilters.industries],
      companySizes: [...result.parsedFilters.companySizes],
      seniorities: [...result.parsedFilters.seniorities],
      technologies: [...result.parsedFilters.technologies],
      keywords: [...result.parsedFilters.keywords],
      revenueRanges: [...result.parsedFilters.revenueRanges],
      intentTopics: [...result.parsedFilters.intentTopics],
    },
    explanation: result.explanation,
    confidence: result.confidence,
    needsClarification: result.needsClarification,
    clarifyingQuestions: [...result.clarifyingQuestions],
    leads: result.leads.map(lead => ({ ...lead, matchReasons: [...lead.matchReasons], unmatchReasons: [...lead.unmatchReasons] })),
    pagination: { ...result.pagination },
    suggestions: result.suggestions.map(s => ({ ...s, filters: { ...s.filters } })),
    searchMetadata: { ...result.searchMetadata },
  };
}

/**
 * Get cached result if available and not expired
 */
export function getCachedResult(
  userId: number,
  query: string,
  options: { page?: number; perPage?: number; useIcpScoring?: boolean }
): AISearchResult | null {
  const userCache = searchCache.get(userId);
  if (!userCache) {
    cacheStats.misses++;
    return null;
  }

  const cacheKey = generateCacheKey(query, options);
  const entry = userCache.get(cacheKey);

  if (!entry) {
    cacheStats.misses++;
    return null;
  }

  // Check if expired
  const age = Date.now() - entry.createdAt;
  if (age > CACHE_TTL_MS) {
    userCache.delete(cacheKey);
    cacheStats.misses++;
    return null;
  }

  // Cache hit!
  entry.hits++;
  cacheStats.hits++;

  // CRITICAL: Deep clone to prevent mutations affecting cached copy
  const clonedResult = deepCloneResult(entry.result);

  // Update cloned result to reflect cache hit (doesn't affect original)
  clonedResult.searchMetadata.durationMs = 1; // Near instant
  clonedResult.searchMetadata.cached = true;

  console.log(`[SearchCache] HIT for user ${userId}: "${query.substring(0, 30)}..." (age: ${Math.round(age / 1000)}s)`);

  return clonedResult;
}

/**
 * Store a result in the cache
 */
export function setCachedResult(
  userId: number,
  query: string,
  options: { page?: number; perPage?: number; useIcpScoring?: boolean },
  result: AISearchResult
): void {
  let userCache = searchCache.get(userId);

  if (!userCache) {
    userCache = new Map();
    searchCache.set(userId, userCache);
  }

  // Enforce max cache size per user (LRU eviction)
  if (userCache.size >= MAX_CACHE_SIZE) {
    evictOldestEntry(userCache);
  }

  const cacheKey = generateCacheKey(query, options);

  // CRITICAL: Deep clone to store an immutable copy
  // This prevents the original result from being mutated after caching
  userCache.set(cacheKey, {
    result: deepCloneResult(result),
    createdAt: Date.now(),
    hits: 0,
  });

  console.log(`[SearchCache] STORED for user ${userId}: "${query.substring(0, 30)}..." (cache size: ${userCache.size})`);
}

/**
 * Invalidate cache for a user (e.g., when ICP profile changes)
 */
export function invalidateUserCache(userId: number): void {
  const deleted = searchCache.delete(userId);
  if (deleted) {
    console.log(`[SearchCache] Invalidated all cache for user ${userId}`);
  }
}

/**
 * Invalidate a specific query from cache
 */
export function invalidateQuery(
  userId: number,
  query: string,
  options: { page?: number; perPage?: number; useIcpScoring?: boolean }
): void {
  const userCache = searchCache.get(userId);
  if (userCache) {
    const cacheKey = generateCacheKey(query, options);
    userCache.delete(cacheKey);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  hits: number;
  misses: number;
  hitRate: number;
  totalUsers: number;
  totalEntries: number;
  evictions: number;
} {
  let totalEntries = 0;
  for (const userCache of searchCache.values()) {
    totalEntries += userCache.size;
  }

  const total = cacheStats.hits + cacheStats.misses;

  return {
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    hitRate: total > 0 ? cacheStats.hits / total : 0,
    totalUsers: searchCache.size,
    totalEntries,
    evictions: cacheStats.evictions,
  };
}

/**
 * Evict oldest entry from a user's cache
 */
function evictOldestEntry(userCache: Map<string, CacheEntry>): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of userCache) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    userCache.delete(oldestKey);
    cacheStats.evictions++;
  }
}

/**
 * Cleanup expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, userCache] of searchCache) {
    for (const [key, entry] of userCache) {
      if (now - entry.createdAt > CACHE_TTL_MS) {
        userCache.delete(key);
        cleaned++;
      }
    }

    // Remove empty user caches
    if (userCache.size === 0) {
      searchCache.delete(userId);
    }
  }

  if (cleaned > 0) {
    console.log(`[SearchCache] Cleanup: removed ${cleaned} expired entries`);
  }
}

// Start periodic cleanup
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
