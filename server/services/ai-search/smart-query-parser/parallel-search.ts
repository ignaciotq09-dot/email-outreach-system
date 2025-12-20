/**
 * Parallel Multi-Interpretation Search
 * Executes multiple query interpretations simultaneously and merges results
 */

import type { SmartParsedFilters, ParseConfidence, AlternativeInterpretation } from "./types";

export interface SearchInterpretation {
  description: string;
  filters: SmartParsedFilters;
  confidence: number;
  isPrimary: boolean;
}

export interface ParallelSearchResult {
  interpretation: SearchInterpretation;
  results: any[];
  total: number;
  searchTime: number;
}

export interface MergedSearchResult {
  results: any[];
  total: number;
  interpretationsUsed: Array<{ description: string; confidence: number; resultCount: number }>;
  primaryInterpretation: string;
  deduplicatedCount: number;
}

export function generateInterpretations(
  primaryFilters: SmartParsedFilters,
  primaryConfidence: ParseConfidence,
  explanation: string
): SearchInterpretation[] {
  const interpretations: SearchInterpretation[] = [];
  
  interpretations.push({
    description: explanation || 'Primary interpretation',
    filters: primaryFilters,
    confidence: primaryConfidence.overall,
    isPrimary: true
  });
  
  if (primaryConfidence.alternativeInterpretations && primaryConfidence.alternativeInterpretations.length > 0) {
    for (const alt of primaryConfidence.alternativeInterpretations.slice(0, 2)) {
      const altFilters: SmartParsedFilters = {
        jobTitles: alt.filters.jobTitles || primaryFilters.jobTitles,
        expandedJobTitles: alt.filters.expandedJobTitles || alt.filters.jobTitles || [],
        locations: alt.filters.locations || primaryFilters.locations,
        normalizedLocations: primaryFilters.normalizedLocations,
        industries: alt.filters.industries || primaryFilters.industries,
        companySizes: alt.filters.companySizes || primaryFilters.companySizes,
        seniorities: alt.filters.seniorities || primaryFilters.seniorities,
        keywords: alt.filters.keywords || primaryFilters.keywords,
        companies: alt.filters.companies || primaryFilters.companies
      };
      
      interpretations.push({
        description: alt.description,
        filters: altFilters,
        confidence: alt.confidence,
        isPrimary: false
      });
    }
  }
  
  return interpretations;
}

export async function executeParallelSearches(
  interpretations: SearchInterpretation[],
  searchFn: (filters: SmartParsedFilters) => Promise<{ results: any[]; total: number }>,
  options?: { maxParallel?: number; timeout?: number }
): Promise<ParallelSearchResult[]> {
  const maxParallel = options?.maxParallel || 3;
  const timeout = options?.timeout || 10000;
  
  const limitedInterpretations = interpretations.slice(0, maxParallel);
  
  console.log(`[ParallelSearch] Executing ${limitedInterpretations.length} interpretations in parallel`);
  
  const searchPromises = limitedInterpretations.map(async (interpretation, index) => {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        searchFn(interpretation.filters),
        new Promise<{ results: any[]; total: number }>((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), timeout)
        )
      ]);
      
      const searchTime = Date.now() - startTime;
      
      console.log(`[ParallelSearch] Interpretation ${index + 1} "${interpretation.description}": ${result.total} results in ${searchTime}ms`);
      
      return {
        interpretation,
        results: result.results,
        total: result.total,
        searchTime
      };
    } catch (error) {
      console.error(`[ParallelSearch] Interpretation ${index + 1} failed:`, error);
      return {
        interpretation,
        results: [],
        total: 0,
        searchTime: Date.now() - startTime
      };
    }
  });
  
  const results = await Promise.all(searchPromises);
  
  return results;
}

export function mergeSearchResults(
  parallelResults: ParallelSearchResult[],
  options?: { maxResults?: number; dedupeKey?: string }
): MergedSearchResult {
  const maxResults = options?.maxResults || 50;
  const dedupeKey = options?.dedupeKey || 'id';
  
  parallelResults.sort((a, b) => {
    if (a.interpretation.isPrimary !== b.interpretation.isPrimary) {
      return a.interpretation.isPrimary ? -1 : 1;
    }
    return b.interpretation.confidence - a.interpretation.confidence;
  });
  
  const seen = new Set<string>();
  const mergedResults: any[] = [];
  let deduplicatedCount = 0;
  
  for (const parallelResult of parallelResults) {
    for (const result of parallelResult.results) {
      const key = result[dedupeKey];
      
      if (key && seen.has(key)) {
        deduplicatedCount++;
        continue;
      }
      
      if (key) {
        seen.add(key);
      }
      
      if (mergedResults.length < maxResults) {
        mergedResults.push(result);
      }
    }
  }
  
  const interpretationsUsed = parallelResults.map(pr => ({
    description: pr.interpretation.description,
    confidence: pr.interpretation.confidence,
    resultCount: pr.total
  }));
  
  const primaryResult = parallelResults.find(pr => pr.interpretation.isPrimary);
  
  console.log(`[ParallelSearch] Merged ${mergedResults.length} results, deduplicated ${deduplicatedCount}`);
  
  return {
    results: mergedResults,
    total: mergedResults.length,
    interpretationsUsed,
    primaryInterpretation: primaryResult?.interpretation.description || interpretationsUsed[0]?.description || 'Unknown',
    deduplicatedCount
  };
}

export function shouldUseParallelSearch(confidence: ParseConfidence): boolean {
  if (confidence.disambiguationNeeded) {
    return true;
  }
  
  if (confidence.overall < 0.7) {
    return true;
  }
  
  if (confidence.alternativeInterpretations && confidence.alternativeInterpretations.length > 0) {
    const hasHighConfidenceAlternative = confidence.alternativeInterpretations.some(
      alt => alt.confidence > 0.5
    );
    if (hasHighConfidenceAlternative) {
      return true;
    }
  }
  
  return false;
}
