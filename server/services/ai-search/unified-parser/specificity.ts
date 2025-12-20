import type { ParsedFilters, MissingSignal, SearchCategory } from "@shared/schema";
import type { SpecificityAnalysis } from "./types";

export function analyzeSpecificity(filters: ParsedFilters): SpecificityAnalysis {
  const hasJobTitles = filters.jobTitles && filters.jobTitles.length > 0;
  const hasLocations = filters.locations && filters.locations.length > 0;
  const hasCompanies = filters.companies && filters.companies.length > 0;
  const hasIndustries = filters.industries && filters.industries.length > 0;
  const hasSeniorities = filters.seniorities && filters.seniorities.length > 0;
  const weights = { jobTitles: 0.35, companies: 0.25, locations: 0.15, industries: 0.15, seniorities: 0.10 };
  let score = 0;
  if (hasJobTitles) score += weights.jobTitles; if (hasCompanies) score += weights.companies;
  if (hasLocations) score += weights.locations; if (hasIndustries) score += weights.industries;
  if (hasSeniorities) score += weights.seniorities;
  const filterCount = [hasJobTitles, hasLocations, hasCompanies, hasIndustries, hasSeniorities].filter(Boolean).length;
  const missingSignals: MissingSignal[] = [];
  if (!hasJobTitles) missingSignals.push('job_title'); if (!hasLocations) missingSignals.push('location');
  if (!hasCompanies) missingSignals.push('company'); if (!hasIndustries) missingSignals.push('industry');
  if (!hasSeniorities) missingSignals.push('seniority');
  let category: SearchCategory;
  if (filterCount >= 2) category = 'complete';
  else if (filterCount === 1) { if (hasJobTitles) category = 'job_only'; else if (hasLocations) category = 'location_only'; else if (hasCompanies) category = 'company_only'; else if (hasIndustries) category = 'industry_only'; else category = 'vague'; }
  else category = 'vague';
  console.log(`[SpecificityAnalysis] Score: ${(score * 100).toFixed(0)}%, Category: ${category}, Filters: ${filterCount}`);
  return { score, category, missingSignals, filterCount };
}
