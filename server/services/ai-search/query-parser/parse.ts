import type { ParsedFilters, QueryParseResult } from "./types";
import { createEmptyFilters } from "./constants";
import { classifyQuery, generateClarifyingQuestions } from "./classify";
import { extractFilters } from "./extract";

export async function parseQuery(query: string): Promise<QueryParseResult> {
  console.log(`[QueryParser] Parsing query: "${query}"`);
  const classification = await classifyQuery(query);
  const { filters, confidence, explanation } = await extractFilters(query);
  const clarifyingQuestions = await generateClarifyingQuestions(query, classification);

  // Fix: Only need clarification if we don't have a minimum viable search
  const hasMinimumViableSearch = (
    (filters.jobTitles.length > 0 && filters.locations.length > 0) ||  // who + where
    (filters.jobTitles.length > 0 && filters.industries.length > 0) || // who + what industry
    (filters.companies?.length > 0)  // specific companies = always sufficient
  );

  const needsClarification = !hasMinimumViableSearch && (classification.specificity === 'low' || confidence < 0.4);
  const queryType = classification.specificity === 'high' ? 'specific' : classification.specificity === 'medium' ? 'broad' : 'ambiguous';
  const expandedFromOriginal = filters.jobTitles.length > 1 || filters.seniorities.length > 0;
  console.log(`[QueryParser] Result: ${filters.jobTitles.length} titles, ${filters.locations.length} locations, confidence=${confidence.toFixed(2)}, needsClarification=${needsClarification}`);
  return { filters, confidence, explanation, clarifyingQuestions, needsClarification, queryType, expandedFromOriginal };
}

export async function parseRefinement(query: string, currentFilters: ParsedFilters): Promise<QueryParseResult> {
  console.log(`[QueryParser] Parsing refinement: "${query}"`);
  const { filters: newFilters, confidence, explanation } = await extractFilters(query);
  const mergedFilters = createEmptyFilters();
  (Object.keys(mergedFilters) as (keyof ParsedFilters)[]).forEach(key => {
    const newValues = newFilters[key]; const currentValues = currentFilters[key];
    mergedFilters[key] = [...new Set([...currentValues, ...newValues])];
  });
  return { filters: mergedFilters, confidence, explanation, clarifyingQuestions: [], needsClarification: false, queryType: 'specific', expandedFromOriginal: false };
}

export function describeFilters(filters: ParsedFilters): string {
  const parts: string[] = [];
  if (filters.jobTitles.length) parts.push(`Titles: ${filters.jobTitles.slice(0, 3).join(', ')}${filters.jobTitles.length > 3 ? '...' : ''}`);
  if (filters.locations.length) parts.push(`Locations: ${filters.locations.join(', ')}`);
  if (filters.industries.length) parts.push(`Industries: ${filters.industries.join(', ')}`);
  if (filters.companySizes.length) parts.push(`Sizes: ${filters.companySizes.join(', ')}`);
  if (filters.seniorities.length) parts.push(`Seniorities: ${filters.seniorities.join(', ')}`);
  return parts.join(' | ') || 'No filters applied';
}
