import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { leadSearchSessions, type ParsedFilters, type AdaptiveGuidance } from "@shared/schema";
import { parseQueryFast } from "../unified-query-parser";
import { enhancedSearch, deduplicateLeads } from "../enhanced-apollo";
import { fetchIcpProfile, scoreLeadsBatch, generateSuggestionsFromProfile } from "../batch-icp-scorer";
import { getCachedResult, setCachedResult, getCacheStats } from "../search-cache";
import type { AISearchResult, ScoredLead } from "./types";
import { PerformanceTimer } from "./timer";
import { generateSearchGuidance } from "./guidance";
import { calculatePostSearchConfidence } from "./confidence";
import { trackSearchPattern } from "./patterns";
import { estimateResultCount } from "../smart-query-parser/confidence-strategy";

export async function aiSearch(userId: number, query: string, options: { page?: number; perPage?: number; useIcpScoring?: boolean } = {}): Promise<AISearchResult> {
  const timer = new PerformanceTimer();
  console.log(`[AISearch] Starting optimized search for user ${userId}: "${query}"`);
  const cachedResult = getCachedResult(userId, query, options);
  if (cachedResult) { timer.mark('Cache HIT'); timer.print('AISearch'); return { ...cachedResult, searchMetadata: { ...cachedResult.searchMetadata, durationMs: timer.total(), cached: true } }; }
  timer.mark('Cache MISS');
  const parseResult = await parseQueryFast(query);
  timer.mark('AI Parse (unified)');
  console.log(`[AISearch] Parsed with ${(parseResult.confidence * 100).toFixed(0)}% confidence`);
  const useIcp = options.useIcpScoring !== false;
  const [sessionResult, icpProfile] = await Promise.all([db.insert(leadSearchSessions).values({ userId, originalQuery: query, parsedFilters: parseResult.filters as any, parseConfidence: parseResult.confidence, parseExplanation: parseResult.explanation, status: 'active' }).returning(), useIcp ? fetchIcpProfile(userId) : Promise.resolve(null)]);
  const session = sessionResult[0];
  timer.mark('Session + ICP fetch (parallel)');
  if (parseResult.needsClarification) { const result: AISearchResult = { sessionId: session.id, query, parsedFilters: parseResult.filters, explanation: parseResult.explanation, confidence: parseResult.confidence, needsClarification: true, clarifyingQuestions: parseResult.clarifyingQuestions, leads: [], pagination: { page: 1, perPage: 25, totalPages: 0, totalResults: 0 }, suggestions: [], searchMetadata: { durationMs: timer.total(), filtersApplied: 0, icpScoringEnabled: false }, adaptiveGuidance: { searchCategory: parseResult.searchCategory, specificityScore: parseResult.specificityScore, tips: [], suggestedAdditions: [], hasRecommendations: false } }; timer.mark('Early return (clarification needed)'); timer.print('AISearch'); return result; }
  // RESULT COUNT ESTIMATION - optimize pagination based on expected results
  const estimatedCount = estimateResultCount(parseResult.filters);
  console.log(`[AISearch] Estimated result count: ${estimatedCount}`);

  // Adjust per_page based on estimation to avoid wasting quota
  let perPage = options.perPage || 25;
  if (estimatedCount === 'low') {
    perPage = Math.min(perPage, 10); // Don't waste quota on low-result searches
    console.log(`[AISearch] Limiting to ${perPage} results (low count expected)`);
  } else if (estimatedCount === 'high') {
    perPage = Math.max(perPage, 50); // Get more results when plenty available
    console.log(`[AISearch] Requesting ${perPage} results (high count expected)`);
  }

  // PARALLEL EXECUTION: Run guidance + Apollo search concurrently (saves 50-200ms)
  const [guidance, searchResult] = await Promise.all([
    generateSearchGuidance(userId, parseResult.filters, parseResult.searchCategory, parseResult.missingSignals, icpProfile),
    enhancedSearch(parseResult.filters, { page: options.page || 1, perPage })
  ]);
  timer.mark('Guidance + Apollo search (parallel)');
  const uniqueLeads = deduplicateLeads(searchResult.leads);
  timer.mark('Deduplication');
  const icpEnabled = icpProfile !== null && icpProfile.icpConfidence >= 0.2;
  let scoredLeads: ScoredLead[];
  if (icpEnabled) { scoredLeads = scoreLeadsBatch(icpProfile, uniqueLeads); scoredLeads.sort((a, b) => b.overallScore - a.overallScore); }
  else { scoredLeads = uniqueLeads.map(lead => ({ ...lead, icpScore: 50, matchReasons: [], unmatchReasons: [], overallScore: 50 })); }
  timer.mark('ICP scoring (batch)');
  const suggestions: Array<{ text: string; filters: Partial<ParsedFilters>; reasoning: string }> = [];
  if (icpEnabled) { const icpSuggestions = generateSuggestionsFromProfile(icpProfile!); for (const s of icpSuggestions.slice(0, 2)) { suggestions.push({ text: s.description, filters: s.filters, reasoning: s.reasoning }); } }
  if (scoredLeads.length > 50) { suggestions.push({ text: 'Narrow down: Add seniority filter', filters: { seniorities: ['Senior', 'Director', 'VP'] }, reasoning: `${searchResult.pagination.totalResults} results found - try adding seniority to focus` }); }
  if (scoredLeads.length === 0 && parseResult.filters.jobTitles.length > 3) { suggestions.push({ text: 'Broaden search: Use fewer job titles', filters: { jobTitles: parseResult.filters.jobTitles.slice(0, 2) }, reasoning: 'No results - try using fewer specific titles' }); }
  timer.mark('Suggestions');
  const durationMs = timer.total();
  Promise.all([db.update(leadSearchSessions).set({ resultsCount: searchResult.pagination.totalResults, searchDurationMs: durationMs, updatedAt: new Date() }).where(eq(leadSearchSessions.id, session.id)), trackSearchPattern(userId, parseResult.filters, searchResult.pagination.totalResults)]).catch(err => { console.error('[AISearch] Background update error:', err); });
  timer.mark('Background ops scheduled');
  const postSearchConfidence = calculatePostSearchConfidence(parseResult.confidence, parseResult.filters, scoredLeads.length, { domainFiltered: searchResult.searchMetadata.domainFiltered, resolvedDomains: searchResult.searchMetadata.resolvedDomains });
  const adaptiveGuidance: AdaptiveGuidance = { searchCategory: parseResult.searchCategory, specificityScore: parseResult.specificityScore, tips: guidance.tips, suggestedAdditions: guidance.suggestedAdditions, hasRecommendations: guidance.hasRecommendations };
  const result: AISearchResult = { sessionId: session.id, query, parsedFilters: parseResult.filters, explanation: parseResult.explanation, confidence: postSearchConfidence, needsClarification: false, clarifyingQuestions: [], leads: scoredLeads, pagination: searchResult.pagination, suggestions, searchMetadata: { durationMs, filtersApplied: searchResult.searchMetadata.filtersApplied, icpScoringEnabled: icpEnabled, cached: false }, adaptiveGuidance };
  setCachedResult(userId, query, options, result);
  timer.mark('Result cached');
  timer.print('AISearch');
  console.log(`[AISearch] Completed in ${durationMs}ms: ${scoredLeads.length} leads, ${suggestions.length} suggestions`);
  const stats = getCacheStats();
  if (stats.hits + stats.misses > 0 && (stats.hits + stats.misses) % 10 === 0) { console.log(`[AISearch] Cache stats: ${stats.hits} hits, ${stats.misses} misses (${(stats.hitRate * 100).toFixed(1)}% hit rate)`); }
  return result;
}
