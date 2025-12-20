/**
 * Query Cache
 * Caches popular query patterns for instant results
 */

import type { SmartParsedFilters, ParseConfidence } from "./types";

interface CachedParseResult {
  filters: SmartParsedFilters;
  confidence: ParseConfidence;
  explanation: string;
  cachedAt: number;
  hitCount: number;
}

interface CacheEntry {
  result: CachedParseResult;
  lastAccessed: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 500;
const MIN_HITS_FOR_PERSISTENCE = 3;

class QueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hitCounts: Map<string, number> = new Map();

  private normalizeQueryForCache(query: string): string {
    // Step 1: Basic text normalization
    let normalized = query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?'"]/g, '');

    // Step 2: Location abbreviation normalization
    // Converts common city/state abbreviations to full names for better cache matching
    const locationMap: Record<string, string> = {
      'nyc': 'new york',
      'ny': 'new york',
      'sf': 'san francisco',
      'la': 'los angeles',
      'dc': 'washington',
      'philly': 'philadelphia',
      'chi': 'chicago',
      'atl': 'atlanta',
      'boston': 'boston',
      'seattle': 'seattle',
      'miami': 'miami',
      'denver': 'denver',
      'austin': 'austin',
      'dallas': 'dallas',
    };

    for (const [abbr, full] of Object.entries(locationMap)) {
      // Use word boundaries to avoid partial matches
      normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }

    // Step 3: Job title abbreviation normalization
    // Expands common title abbreviations for semantic equivalence
    const titleMap: Record<string, string> = {
      'ceo': 'chief executive officer',
      'cto': 'chief technology officer',
      'cfo': 'chief financial officer',
      'cmo': 'chief marketing officer',
      'coo': 'chief operating officer',
      'cio': 'chief information officer',
      'vp': 'vice president',
      'svp': 'senior vice president',
      'evp': 'executive vice president',
      'hr': 'human resources',
    };

    for (const [abbr, full] of Object.entries(titleMap)) {
      normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }

    // Step 4: Synonym normalization
    // Maps synonymous terms to canonical form for cache consistency
    const synonymMap: Record<string, string> = {
      'software developer': 'software engineer',
      'programmer': 'software engineer',
      'coder': 'software engineer',
      'dev': 'developer',
      'sales rep': 'sales representative',
      'account exec': 'account executive',
      'bizdev': 'business development',
    };

    for (const [synonym, canonical] of Object.entries(synonymMap)) {
      normalized = normalized.replace(new RegExp(`\\b${synonym}\\b`, 'g'), canonical);
    }

    // Step 5: Sort words alphabetically for canonical ordering
    // This makes "CEOs in NYC" equivalent to "in NYC CEOs"
    const words = normalized.split(' ').sort();
    return words.join(' ');
  }

  get(query: string): CachedParseResult | null {
    const normalizedQuery = this.normalizeQueryForCache(query);
    const entry = this.cache.get(normalizedQuery);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.result.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(normalizedQuery);
      console.log(`[QueryCache] Expired: "${normalizedQuery}"`);
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.result.hitCount++;

    console.log(`[QueryCache] HIT: "${normalizedQuery}" (hits: ${entry.result.hitCount})`);
    return entry.result;
  }

  set(query: string, filters: SmartParsedFilters, confidence: ParseConfidence, explanation: string): void {
    const normalizedQuery = this.normalizeQueryForCache(query);

    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    const result: CachedParseResult = {
      filters: { ...filters },
      confidence: { ...confidence },
      explanation,
      cachedAt: Date.now(),
      hitCount: 1
    };

    this.cache.set(normalizedQuery, {
      result,
      lastAccessed: Date.now()
    });

    console.log(`[QueryCache] SET: "${normalizedQuery}"`);
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.result.hitCount < MIN_HITS_FOR_PERSISTENCE && entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (!oldestKey) {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[QueryCache] EVICTED: "${oldestKey}"`);
    }
  }

  recordHit(query: string): void {
    const normalizedQuery = this.normalizeQueryForCache(query);
    const currentHits = this.hitCounts.get(normalizedQuery) || 0;
    this.hitCounts.set(normalizedQuery, currentHits + 1);
  }

  getPopularQueries(limit: number = 20): Array<{ query: string; hits: number }> {
    const sorted = [...this.hitCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([query, hits]) => ({ query, hits }));
  }

  getStats(): { size: number; totalHits: number; cacheHitRate: number } {
    let totalHits = 0;
    let cacheHits = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.result.hitCount;
      if (entry.result.hitCount > 1) {
        cacheHits += entry.result.hitCount - 1;
      }
    }

    return {
      size: this.cache.size,
      totalHits,
      cacheHitRate: totalHits > 0 ? cacheHits / totalHits : 0
    };
  }

  clear(): void {
    this.cache.clear();
    console.log('[QueryCache] Cleared');
  }

  prewarm(commonQueries: Array<{ query: string; filters: SmartParsedFilters; confidence: ParseConfidence; explanation: string }>): void {
    for (const { query, filters, confidence, explanation } of commonQueries) {
      this.set(query, filters, confidence, explanation);
    }
    console.log(`[QueryCache] Prewarmed with ${commonQueries.length} queries`);
  }
}

export const queryCache = new QueryCache();

export const PREWARM_QUERIES: Array<{
  query: string;
  filters: SmartParsedFilters;
  confidence: ParseConfidence;
  explanation: string
}> = [
    {
      query: 'ceos at startups',
      filters: {
        jobTitles: ['CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder', 'President'],
        expandedJobTitles: ['CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder', 'President', 'Owner'],
        locations: [],
        normalizedLocations: [],
        industries: ['Computer Software', 'Information Technology and Services', 'Internet'],
        companySizes: ['1-10', '11-50', '51-200'],
        seniorities: ['C-Level', 'Founder', 'Owner'],
        keywords: ['startup'],
        companies: []
      },
      confidence: { overall: 0.9, jobTitleConfidence: 0.95, locationConfidence: 0.5, industryConfidence: 0.8, disambiguationNeeded: false },
      explanation: 'Searching for CEOs and founders at startup companies'
    },
    {
      query: 'software engineers in san francisco',
      filters: {
        jobTitles: ['Software Engineer', 'Software Developer', 'Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
        expandedJobTitles: ['Software Engineer', 'Software Developer', 'Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Senior Software Engineer', 'Staff Engineer'],
        locations: ['San Francisco, California, United States'],
        normalizedLocations: [{ original: 'San Francisco', city: 'San Francisco', state: 'California', country: 'United States', apolloFormat: 'San Francisco, California, United States' }],
        industries: ['Computer Software', 'Information Technology and Services', 'Internet'],
        companySizes: [],
        seniorities: [],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.95, jobTitleConfidence: 0.95, locationConfidence: 0.95, industryConfidence: 0.85, disambiguationNeeded: false },
      explanation: 'Searching for software engineers in San Francisco, CA'
    },
    {
      query: 'sales managers',
      filters: {
        jobTitles: ['Sales Manager', 'Sales Director', 'VP of Sales', 'Head of Sales', 'Regional Sales Manager'],
        expandedJobTitles: ['Sales Manager', 'Sales Director', 'VP of Sales', 'Head of Sales', 'Regional Sales Manager', 'Account Executive', 'Business Development Manager'],
        locations: [],
        normalizedLocations: [],
        industries: [],
        companySizes: [],
        seniorities: ['Manager', 'Director', 'VP'],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.9, jobTitleConfidence: 0.95, locationConfidence: 0.5, industryConfidence: 0.5, disambiguationNeeded: false },
      explanation: 'Searching for sales managers and sales leadership'
    },
    {
      query: 'marketing directors at tech companies',
      filters: {
        jobTitles: ['Marketing Director', 'Director of Marketing', 'VP of Marketing', 'Head of Marketing', 'CMO'],
        expandedJobTitles: ['Marketing Director', 'Director of Marketing', 'VP of Marketing', 'Head of Marketing', 'CMO', 'Chief Marketing Officer', 'Marketing Manager'],
        locations: [],
        normalizedLocations: [],
        industries: ['Computer Software', 'Information Technology and Services', 'Internet'],
        companySizes: [],
        seniorities: ['Director', 'VP', 'C-Level'],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.92, jobTitleConfidence: 0.95, locationConfidence: 0.5, industryConfidence: 0.9, disambiguationNeeded: false },
      explanation: 'Searching for marketing directors at technology companies'
    },
    {
      query: 'real estate agents in miami',
      filters: {
        jobTitles: ['Real Estate Agent', 'Realtor', 'Real Estate Broker', 'Broker Associate', 'Listing Agent'],
        expandedJobTitles: ['Real Estate Agent', 'Realtor', 'Real Estate Broker', 'Broker Associate', 'Listing Agent', 'Buyer\'s Agent', 'Licensed Realtor'],
        locations: ['Miami, Florida, United States'],
        normalizedLocations: [{ original: 'Miami', city: 'Miami', state: 'Florida', country: 'United States', apolloFormat: 'Miami, Florida, United States' }],
        industries: ['Real Estate'],
        companySizes: [],
        seniorities: [],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.95, jobTitleConfidence: 0.95, locationConfidence: 0.95, industryConfidence: 0.95, disambiguationNeeded: false },
      explanation: 'Searching for real estate agents in Miami, FL'
    },
    {
      query: 'hr managers',
      filters: {
        jobTitles: ['HR Manager', 'Human Resources Manager', 'HR Director', 'Director of HR', 'VP of HR', 'Head of HR'],
        expandedJobTitles: ['HR Manager', 'Human Resources Manager', 'HR Director', 'Director of HR', 'VP of HR', 'Head of HR', 'People Operations Manager', 'Talent Manager'],
        locations: [],
        normalizedLocations: [],
        industries: [],
        companySizes: [],
        seniorities: ['Manager', 'Director', 'VP'],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.9, jobTitleConfidence: 0.95, locationConfidence: 0.5, industryConfidence: 0.5, disambiguationNeeded: false },
      explanation: 'Searching for HR managers and HR leadership'
    },
    {
      query: 'founders',
      filters: {
        jobTitles: ['Founder', 'Co-Founder', 'CEO', 'Owner', 'President'],
        expandedJobTitles: ['Founder', 'Co-Founder', 'CEO', 'Owner', 'President', 'Entrepreneur'],
        locations: [],
        normalizedLocations: [],
        industries: [],
        companySizes: [],
        seniorities: ['Founder', 'Owner', 'C-Level'],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.85, jobTitleConfidence: 0.9, locationConfidence: 0.5, industryConfidence: 0.5, disambiguationNeeded: false },
      explanation: 'Searching for company founders and co-founders'
    },
    {
      query: 'vp of engineering',
      filters: {
        jobTitles: ['VP of Engineering', 'Vice President of Engineering', 'VP Engineering', 'Head of Engineering', 'CTO'],
        expandedJobTitles: ['VP of Engineering', 'Vice President of Engineering', 'VP Engineering', 'Head of Engineering', 'CTO', 'Chief Technology Officer', 'Engineering Director'],
        locations: [],
        normalizedLocations: [],
        industries: ['Computer Software', 'Information Technology and Services'],
        companySizes: [],
        seniorities: ['VP', 'C-Level', 'Director'],
        keywords: [],
        companies: []
      },
      confidence: { overall: 0.93, jobTitleConfidence: 0.95, locationConfidence: 0.5, industryConfidence: 0.85, disambiguationNeeded: false },
      explanation: 'Searching for VP of Engineering and engineering leadership'
    }
  ];

export function initializeQueryCache(): void {
  queryCache.prewarm(PREWARM_QUERIES);
}
