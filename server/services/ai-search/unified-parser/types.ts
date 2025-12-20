import { ParsedFilters, MissingSignal, SearchCategory } from "@shared/schema";
export type { ParsedFilters, MissingSignal, SearchCategory };

export interface QueryParseResult {
  filters: ParsedFilters; confidence: number; explanation: string; clarifyingQuestions: string[];
  needsClarification: boolean; queryType: 'specific' | 'broad' | 'ambiguous';
  expandedFromOriginal: boolean; specificityScore: number; missingSignals: MissingSignal[]; searchCategory: SearchCategory;
}

export interface QueryClassification {
  intent: 'find_leads' | 'refine_search' | 'find_similar' | 'unclear';
  specificity: 'high' | 'medium' | 'low'; hasRoleInfo: boolean; hasLocationInfo: boolean;
  hasCompanyInfo: boolean; hasIndustryInfo: boolean; suggestedClarifications: string[];
}

export interface SpecificityAnalysis { score: number; category: SearchCategory; missingSignals: MissingSignal[]; filterCount: number; }
