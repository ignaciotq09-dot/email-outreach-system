import { callOpenAIFast } from "../../../ai/openai-client";
import { getAvailableIndustries, getCompanySizeOptions } from "../../apollo-service";
import type { QueryParseResult, QueryClassification, ParsedFilters } from "./types";
import { buildUnifiedPrompt } from "./prompt";
import { analyzeSpecificity } from "./specificity";
import { SENIORITY_LEVELS } from "./constants";

export async function parseQueryFast(query: string): Promise<QueryParseResult> {
  const startTime = Date.now(); console.log('[UnifiedParser] Parsing query:', query);
  const companySizeOptions = getCompanySizeOptions(); const industryOptions = getAvailableIndustries();
  const validCompanySizes = new Set(companySizeOptions.map(s => s.value));
  const validIndustries = new Set(industryOptions.map(i => i.toLowerCase()));
  const validSeniorities = new Set(SENIORITY_LEVELS.map(s => s.toLowerCase()));
  try {
    const response = await callOpenAIFast([{ role: "system", content: buildUnifiedPrompt() }, { role: "user", content: query }], { responseFormat: { type: "json_object" } });
    const parsed = JSON.parse(response); console.log(`[UnifiedParser] AI responded in ${Date.now() - startTime}ms`);
    const classification: QueryClassification = { intent: parsed.classification?.intent || 'find_leads', specificity: parsed.classification?.specificity || 'medium', hasRoleInfo: parsed.classification?.hasRoleInfo || false, hasLocationInfo: parsed.classification?.hasLocationInfo || false, hasCompanyInfo: parsed.classification?.hasCompanyInfo || false, hasIndustryInfo: parsed.classification?.hasIndustryInfo || false, suggestedClarifications: Array.isArray(parsed.classification?.suggestedClarifications) ? parsed.classification.suggestedClarifications : [] };
    const filters: ParsedFilters = { jobTitles: Array.isArray(parsed.filters?.jobTitles) ? parsed.filters.jobTitles.filter((t: any) => typeof t === 'string' && t.trim()) : [], locations: Array.isArray(parsed.filters?.locations) ? parsed.filters.locations.filter((l: any) => typeof l === 'string' && l.trim()) : [], industries: Array.isArray(parsed.filters?.industries) ? parsed.filters.industries.filter((ind: any) => typeof ind === 'string' && validIndustries.has(ind.toLowerCase())).map((ind: string) => industryOptions.find(i => i.toLowerCase() === ind.toLowerCase()) || ind) : [], companySizes: Array.isArray(parsed.filters?.companySizes) ? parsed.filters.companySizes.filter((s: any) => typeof s === 'string' && validCompanySizes.has(s)) : [], companies: Array.isArray(parsed.filters?.companies) ? parsed.filters.companies.filter((c: any) => typeof c === 'string' && c.trim()) : [], seniorities: Array.isArray(parsed.filters?.seniorities) ? parsed.filters.seniorities.filter((s: any) => typeof s === 'string' && validSeniorities.has(s.toLowerCase())).map((s: string) => SENIORITY_LEVELS.find(l => l.toLowerCase() === s.toLowerCase()) || s) : [], technologies: Array.isArray(parsed.filters?.technologies) ? parsed.filters.technologies : [], keywords: Array.isArray(parsed.filters?.keywords) ? parsed.filters.keywords : [], revenueRanges: Array.isArray(parsed.filters?.revenueRanges) ? parsed.filters.revenueRanges : [], intentTopics: Array.isArray(parsed.filters?.intentTopics) ? parsed.filters.intentTopics : [] };
    const specificity = analyzeSpecificity(filters); const confidence = parsed.confidence || 0.5; const explanation = parsed.explanation || '';
    // Smarter clarification logic - only request clarification for truly vague searches
    const hasMinimumViableSearch = (
      (filters.jobTitles.length > 0 && filters.locations.length > 0) ||  // who + where (e.g., "real estate developers in Florida")
      (filters.jobTitles.length > 0 && filters.industries.length > 0) || // who + what industry
      (filters.companies.length > 0) ||  // specific companies = always sufficient
      (filters.jobTitles.length > 0 && specificity.score >= 0.5) // good enough with just job titles if AI is confident
    );

    // Only request clarification when we truly don't have enough to search on
    const needsClarification = !hasMinimumViableSearch &&
      (classification.specificity === 'low' || (confidence < 0.4 && specificity.filterCount < 2));
    const queryType = classification.specificity === 'high' ? 'specific' : classification.specificity === 'medium' ? 'broad' : 'ambiguous'; const expandedFromOriginal = filters.jobTitles.length > 1 || filters.seniorities.length > 0;
    console.log(`[UnifiedParser] Result: ${filters.jobTitles.length} titles, ${filters.locations.length} locations, confidence=${confidence.toFixed(2)}`);
    return { filters, confidence, explanation, clarifyingQuestions: classification.suggestedClarifications, needsClarification, queryType, expandedFromOriginal, specificityScore: specificity.score, missingSignals: specificity.missingSignals, searchCategory: specificity.category };
  } catch (error) { console.error('[UnifiedParser] Parse error:', error); return { filters: { jobTitles: [], locations: [], industries: [], companySizes: [], companies: [], seniorities: [], technologies: [], keywords: [], revenueRanges: [], intentTopics: [] }, confidence: 0.3, explanation: 'Failed to parse query', clarifyingQuestions: [], needsClarification: true, queryType: 'ambiguous', expandedFromOriginal: false, specificityScore: 0, missingSignals: ['job_title', 'location'], searchCategory: 'vague' }; }
}

export function describeFilters(filters: ParsedFilters): string {
  const parts: string[] = [];
  if (filters.jobTitles?.length) parts.push(`Titles: ${filters.jobTitles.slice(0, 3).join(', ')}${filters.jobTitles.length > 3 ? '...' : ''}`);
  if (filters.locations?.length) parts.push(`Locations: ${filters.locations.join(', ')}`);
  if (filters.industries?.length) parts.push(`Industries: ${filters.industries.join(', ')}`);
  if (filters.companySizes?.length) parts.push(`Sizes: ${filters.companySizes.join(', ')}`);
  if (filters.seniorities?.length) parts.push(`Seniorities: ${filters.seniorities.join(', ')}`);
  if (filters.companies?.length) parts.push(`Companies: ${filters.companies.join(', ')}`);
  return parts.join(' | ') || 'No filters applied';
}
