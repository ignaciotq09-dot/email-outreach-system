import type { ParsedFilters } from "@shared/schema";

export function calculatePostSearchConfidence(parseConfidence: number, filters: ParsedFilters, resultsCount: number, searchMeta: { domainFiltered?: boolean; resolvedDomains?: number }): number {
  let confidence = parseConfidence;
  if (resultsCount > 100) { confidence -= 0.1; }
  else if (resultsCount > 0 && resultsCount <= 25) { confidence += 0.1; }
  else if (resultsCount === 0) { confidence -= 0.2; }
  if (filters.companies?.length > 0 && searchMeta.domainFiltered) { confidence += 0.1; }
  if (searchMeta.resolvedDomains && searchMeta.resolvedDomains > 0) { confidence += 0.05; }
  const filtersUsed = [filters.jobTitles?.length, filters.industries?.length, filters.locations?.length, filters.companies?.length, filters.seniorities?.length].filter(Boolean).length;
  if (filtersUsed >= 3) { confidence += 0.1; }
  else if (filtersUsed === 1) { confidence -= 0.1; }
  return Math.max(0.1, Math.min(0.99, confidence));
}
