/**
 * Smart Query Parser - Main Entry Point
 * Optimized AI-powered natural language search with:
 * - Chain-of-thought prompting with 15 few-shot examples
 * - Query preprocessing (spell check, abbreviation expansion)
 * - Query caching for instant results on common searches
 * - Parallel multi-interpretation search
 * - Intelligent AI-guided fallback decisions
 * - Result re-ranking based on relevance and ICP
 * - Runtime synonym generation for unknown titles
 */

import type { SmartParsedFilters, SmartParseResult, ParseConfidence, SearchStrategy, FallbackLevel } from "./types";
import { parseQueryWithAI, detectAmbiguity, classifyQueryIntent } from "./ai-parser";
import { generateFallbackLevels } from "./fallback-engine";
import { normalizeLocation, getApolloLocationFormats, broadenLocation } from "./location-normalizer";
import { expandJobTitle, mapToApolloIndustries } from "./synonyms";
import { preprocessQuery, detectNegations, detectBooleanOperators, extractEntities } from "./query-preprocessor";
import { queryCache, initializeQueryCache } from "./query-cache";
import { generateInterpretations, executeParallelSearches, mergeSearchResults, shouldUseParallelSearch } from "./parallel-search";
import { generateIntelligentFallbacks, selectBestFallbackStrategy } from "./intelligent-fallback";
import { searchAnalytics } from "./search-analytics";
import { rankLeads } from "./result-ranker";
import { expandTitlesWithAI, getIndustryContextualSynonyms } from "./runtime-synonyms";

let cacheInitialized = false;

export async function smartParseQuery(query: string): Promise<SmartParseResult> {
  console.log(`[SmartQueryParser] Parsing: "${query}"`);

  if (!cacheInitialized) {
    initializeQueryCache();
    cacheInitialized = true;
  }

  const preprocessResult = preprocessQuery(query);
  const cleanedQuery = preprocessResult.cleanedQuery;

  if (preprocessResult.corrections.length > 0) {
    console.log(`[SmartQueryParser] Spell corrections: ${preprocessResult.corrections.join(', ')}`);
  }
  if (preprocessResult.expansions.length > 0) {
    console.log(`[SmartQueryParser] Abbreviation expansions: ${preprocessResult.expansions.join(', ')}`);
  }

  const cached = queryCache.get(cleanedQuery);
  if (cached) {
    console.log(`[SmartQueryParser] Cache hit for "${cleanedQuery}"`);
    return {
      filters: cached.filters,
      confidence: cached.confidence,
      explanation: cached.explanation + ' (cached)',
      searchStrategy: determineSearchStrategy(cached.filters, cached.confidence),
      fallbackFilters: generateFallbackLevels(cached.filters).map(f => f.filters)
    };
  }

  const ambiguityCheck = detectAmbiguity(cleanedQuery);
  const queryIntent = classifyQueryIntent(cleanedQuery);
  const negations = detectNegations(cleanedQuery);
  const booleanOps = detectBooleanOperators(cleanedQuery);

  if (ambiguityCheck.isAmbiguous) {
    console.log(`[SmartQueryParser] Detected ambiguity: ${ambiguityCheck.reason}`);
  }
  console.log(`[SmartQueryParser] Query intent: ${queryIntent}`);

  if (negations.hasNegation) {
    console.log(`[SmartQueryParser] Negations detected: ${negations.negatedTerms.join(', ')}`);
  }
  if (booleanOps.hasOr) {
    console.log(`[SmartQueryParser] OR operators detected: ${booleanOps.orTerms.map(t => t.join(' OR ')).join(', ')}`);
  }

  const { filters, confidence, explanation } = await parseQueryWithAI(cleanedQuery);

  if (ambiguityCheck.isAmbiguous && !confidence.disambiguationNeeded) {
    confidence.disambiguationNeeded = true;
    confidence.disambiguationReason = ambiguityCheck.reason;
    confidence.overall = Math.min(confidence.overall, 0.5);
  }

  if (filters.jobTitles.length > 0 && filters.industries.length > 0) {
    const industryContext = filters.industries[0];
    const contextualSynonyms: string[] = [];

    for (const title of filters.jobTitles) {
      const synonyms = getIndustryContextualSynonyms(title, industryContext);
      contextualSynonyms.push(...synonyms);
    }

    if (contextualSynonyms.length > filters.expandedJobTitles.length) {
      filters.expandedJobTitles = [...new Set([...filters.expandedJobTitles, ...contextualSynonyms])];
    }
  }

  if (preprocessResult.regionExpanded) {
    const { region, states } = preprocessResult.regionExpanded;
    console.log(`[SmartQueryParser] Expanded region "${region}" to ${states.length} states`);

    filters.locations = states.map(state => `${state}, United States`);
    filters.normalizedLocations = states.map(state => ({
      original: state,
      state,
      country: 'United States',
      apolloFormat: `${state}, United States`
    }));
  }

  const searchStrategy = determineSearchStrategy(filters, confidence);
  const fallbackFilters = generateFallbackLevels(filters);

  queryCache.set(cleanedQuery, filters, confidence, explanation);

  console.log(`[SmartQueryParser] Result: ${filters.jobTitles.length} titles, ${filters.locations.length} locations, confidence=${confidence.overall.toFixed(2)}`);
  console.log(`[SmartQueryParser] Generated ${fallbackFilters.length} fallback levels`);

  return {
    filters,
    confidence,
    explanation,
    searchStrategy,
    fallbackFilters: fallbackFilters.map(f => f.filters)
  };
}

function determineSearchStrategy(filters: SmartParsedFilters, confidence: ParseConfidence): SearchStrategy {
  const filtersApplied: string[] = [];

  if (filters.jobTitles.length > 0) filtersApplied.push('jobTitles');
  if (filters.locations.length > 0) filtersApplied.push('locations');
  if (filters.industries.length > 0) filtersApplied.push('industries');
  if (filters.companySizes.length > 0) filtersApplied.push('companySizes');
  if (filters.seniorities.length > 0) filtersApplied.push('seniorities');
  if (filters.keywords.length > 0) filtersApplied.push('keywords');

  let approach: 'exact' | 'expanded' | 'broadened' | 'keywords' = 'exact';
  if (filters.expandedJobTitles.length > filters.jobTitles.length) {
    approach = 'expanded';
  }
  if (filters.keywords.length > 0 && filters.jobTitles.length === 0) {
    approach = 'keywords';
  }

  let estimatedResultCount: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
  if (filtersApplied.length <= 1) {
    estimatedResultCount = 'high';
  } else if (filtersApplied.length <= 3) {
    estimatedResultCount = 'medium';
  } else {
    estimatedResultCount = 'low';
  }

  return {
    approach,
    filtersApplied,
    estimatedResultCount,
    fallbacksAvailable: 0
  };
}

export async function parseAndSearch(
  query: string,
  searchFn: (filters: SmartParsedFilters) => Promise<{ results: any[]; total: number }>,
  options?: {
    minResults?: number;
    maxFallbackAttempts?: number;
    userId?: number;
    useParallelSearch?: boolean;
    icpProfile?: any;
  }
): Promise<{
  results: any[];
  total: number;
  parseResult: SmartParseResult;
  fallbackUsed: FallbackLevel | null;
  searchAttempts: number;
  interpretationsUsed?: Array<{ description: string; confidence: number; resultCount: number }>;
}> {
  const minResults = options?.minResults || 5;
  const maxAttempts = options?.maxFallbackAttempts || 5;

  const parseResult = await smartParseQuery(query);

  if (options?.userId) {
    searchAnalytics.recordSearch(
      options.userId,
      query,
      parseResult.filters,
      0,
      parseResult.confidence.overall
    );
  }

  const useParallel = options?.useParallelSearch ?? shouldUseParallelSearch(parseResult.confidence);

  if (useParallel && parseResult.confidence.alternativeInterpretations?.length > 0) {
    console.log(`[SmartQueryParser] Using parallel multi-interpretation search`);

    const interpretations = generateInterpretations(
      parseResult.filters,
      parseResult.confidence,
      parseResult.explanation
    );

    const parallelResults = await executeParallelSearches(interpretations, searchFn);
    const merged = mergeSearchResults(parallelResults);

    let rankedResults = merged.results;
    if (options?.icpProfile) {
      rankedResults = rankLeads(merged.results, parseResult.filters, options.icpProfile);
    }

    return {
      results: rankedResults,
      total: merged.total,
      parseResult,
      fallbackUsed: null,
      searchAttempts: parallelResults.length,
      interpretationsUsed: merged.interpretationsUsed
    };
  }

  let currentFilters = parseResult.filters;
  let searchAttempts = 0;
  let fallbackUsed: FallbackLevel | null = null;

  const fallbackStrategy = selectBestFallbackStrategy(parseResult.filters);
  const fallbacks = generateIntelligentFallbacks(parseResult.filters, fallbackStrategy);
  parseResult.searchStrategy.fallbacksAvailable = fallbacks.length;

  console.log(`[SmartQueryParser] Starting search with ${fallbacks.length} intelligent fallback levels`);

  try {
    searchAttempts++;
    const result = await searchFn(currentFilters);
    console.log(`[SmartQueryParser] Initial search returned ${result.total} results`);

    let rankedResults = result.results;
    if (options?.icpProfile && result.results.length > 0) {
      rankedResults = rankLeads(result.results, currentFilters, options.icpProfile);
    }

    if (result.total >= minResults) {
      return {
        results: rankedResults,
        total: result.total,
        parseResult,
        fallbackUsed: null,
        searchAttempts
      };
    }

    for (let i = 0; i < Math.min(fallbacks.length, maxAttempts - 1); i++) {
      const fallback = fallbacks[i];
      console.log(`[SmartQueryParser] Trying fallback level ${fallback.level}: ${fallback.description}`);

      searchAttempts++;
      const fallbackResult = await searchFn(fallback.filters);
      console.log(`[SmartQueryParser] Fallback ${fallback.level} returned ${fallbackResult.total} results`);

      if (fallbackResult.total >= minResults) {
        let rankedFallbackResults = fallbackResult.results;
        if (options?.icpProfile) {
          rankedFallbackResults = rankLeads(fallbackResult.results, fallback.filters, options.icpProfile);
        }

        return {
          results: rankedFallbackResults,
          total: fallbackResult.total,
          parseResult,
          fallbackUsed: fallback,
          searchAttempts
        };
      }

      if (fallbackResult.total > result.total) {
        fallbackUsed = fallback;
      }
    }

    if (fallbackUsed) {
      const finalResult = await searchFn(fallbackUsed.filters);
      let rankedFinalResults = finalResult.results;
      if (options?.icpProfile) {
        rankedFinalResults = rankLeads(finalResult.results, fallbackUsed.filters, options.icpProfile);
      }

      return {
        results: rankedFinalResults,
        total: finalResult.total,
        parseResult,
        fallbackUsed,
        searchAttempts
      };
    }

    return {
      results: rankedResults,
      total: result.total,
      parseResult,
      fallbackUsed: null,
      searchAttempts
    };

  } catch (error) {
    console.error('[SmartQueryParser] Search error:', error);
    throw error;
  }
}

export function convertToApolloFilters(filters: SmartParsedFilters): {
  person_titles?: string[];
  person_locations?: string[];
  organization_industry_tag_ids?: string[];
  organization_num_employees_ranges?: string[];
  person_seniorities?: string[];
  q_keywords?: string;
} {
  const apolloFilters: Record<string, any> = {};

  const titles = filters.expandedJobTitles.length > 0 ? filters.expandedJobTitles : filters.jobTitles;
  if (titles.length > 0) {
    apolloFilters.person_titles = titles;
  }

  if (filters.locations.length > 0) {
    apolloFilters.person_locations = filters.locations;
  }

  if (filters.industries.length > 0) {
    apolloFilters.organization_industry_tag_ids = filters.industries;
  }

  if (filters.companySizes.length > 0) {
    apolloFilters.organization_num_employees_ranges = filters.companySizes;
  }

  if (filters.seniorities.length > 0) {
    const seniorityMap: Record<string, string[]> = {
      'Entry': ['entry'],
      'Junior': ['entry'],
      'Senior': ['senior'],
      'Manager': ['manager'],
      'Director': ['director'],
      'VP': ['vp'],
      'C-Level': ['c_suite'],
      'Owner': ['owner'],
      'Founder': ['founder'],
      'Partner': ['partner']
    };
    const mapped = filters.seniorities.flatMap(s => seniorityMap[s] || []);
    if (mapped.length > 0) {
      apolloFilters.person_seniorities = [...new Set(mapped)];
    }
  }

  if (filters.keywords.length > 0) {
    apolloFilters.q_keywords = filters.keywords.join(' OR ');
  }

  return apolloFilters;
}

export { parseQueryWithAI, detectAmbiguity, classifyQueryIntent } from "./ai-parser";
export { generateFallbackLevels } from "./fallback-engine";
export { normalizeLocation, getApolloLocationFormats, broadenLocation } from "./location-normalizer";
export { expandJobTitle, mapToApolloIndustries, JOB_TITLE_SYNONYMS, INDUSTRY_MAPPINGS } from "./synonyms";
export { preprocessQuery, detectNegations, detectBooleanOperators, extractEntities } from "./query-preprocessor";
export { queryCache, initializeQueryCache } from "./query-cache";
export { generateInterpretations, executeParallelSearches, mergeSearchResults, shouldUseParallelSearch } from "./parallel-search";
export { generateIntelligentFallbacks, selectBestFallbackStrategy } from "./intelligent-fallback";
export { searchAnalytics, createSearchAnalyticsTable, persistSearchEvent, updateImportCount } from "./search-analytics";
export { rankLeads, reRankWithIcp, filterByMinRelevance } from "./result-ranker";
export { generateRuntimeSynonyms, expandTitlesWithAI, getIndustryContextualSynonyms, getSeniorityVariations } from "./runtime-synonyms";
export { determineSearchStrategy, adjustResultCountByConfidence, estimateResultCount } from "./confidence-strategy";
export type { SmartParsedFilters, SmartParseResult, ParseConfidence, SearchStrategy, FallbackLevel, NormalizedLocation, AlternativeInterpretation } from "./types";
