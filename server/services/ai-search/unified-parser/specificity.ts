import type { ParsedFilters, MissingSignal, SearchCategory } from "@shared/schema";
import type { SpecificityAnalysis } from "./types";

export function analyzeSpecificity(filters: ParsedFilters): SpecificityAnalysis {
  const hasJobTitles = filters.jobTitles && filters.jobTitles.length > 0;
  const hasLocations = filters.locations && filters.locations.length > 0;
  const hasCompanies = filters.companies && filters.companies.length > 0;
  const hasIndustries = filters.industries && filters.industries.length > 0;
  const hasSeniorities = filters.seniorities && filters.seniorities.length > 0;
  const hasKeywords = filters.keywords && filters.keywords.length > 0;

  // Rebalanced weights: Job titles and locations are the most important for contact search
  const weights = {
    jobTitles: 0.40,      // Most important - who are we looking for?
    locations: 0.30,      // Very important - where are they?
    companies: 0.15,      // Optional but highly specific
    industries: 0.10,     // Optional context
    seniorities: 0.05,    // Fine-tuning only
    keywords: 0.10        // Bonus specificity
  };

  let score = 0;
  if (hasJobTitles) score += weights.jobTitles;
  if (hasLocations) score += weights.locations;
  if (hasCompanies) score += weights.companies;
  if (hasIndustries) score += weights.industries;
  if (hasSeniorities) score += weights.seniorities;
  if (hasKeywords) score += weights.keywords;

  // COMBINATION BONUSES: Common search patterns that are sufficiently specific
  // Job title + location is a COMPLETE, valid search (e.g., "real estate developers in Florida")
  if (hasJobTitles && hasLocations) {
    score = Math.max(score, 0.70); // Minimum 70% for this common combo
  }
  // Job title + industry is also a valid search (e.g., "sales managers in healthcare")
  if (hasJobTitles && hasIndustries) {
    score = Math.max(score, 0.65);
  }
  // Specific companies = highly targeted search
  if (hasCompanies) {
    score = Math.max(score, 0.75);
  }
  // Job title + company size = valid for broad prospecting
  if (hasJobTitles && filters.companySizes && filters.companySizes.length > 0) {
    score = Math.max(score, 0.60);
  }

  const filterCount = [hasJobTitles, hasLocations, hasCompanies, hasIndustries, hasSeniorities].filter(Boolean).length;

  // Only flag missing signals that would significantly improve the search
  const missingSignals: MissingSignal[] = [];
  // Only suggest job title if we have NOTHING to search on
  if (!hasJobTitles && !hasCompanies && !hasKeywords) missingSignals.push('job_title');
  // Only suggest location if we have job title but no other targeting
  if (hasJobTitles && !hasLocations && !hasIndustries && !hasCompanies) missingSignals.push('location');
  // Don't push company/industry/seniority as they're optional refinements

  let category: SearchCategory;
  if (filterCount >= 2) category = 'complete';
  else if (filterCount === 1) {
    if (hasJobTitles) category = 'job_only';
    else if (hasLocations) category = 'location_only';
    else if (hasCompanies) category = 'company_only';
    else if (hasIndustries) category = 'industry_only';
    else category = 'vague';
  }
  else category = 'vague';

  console.log(`[SpecificityAnalysis] Score: ${(score * 100).toFixed(0)}%, Category: ${category}, Filters: ${filterCount}`);
  return { score, category, missingSignals, filterCount };
}
