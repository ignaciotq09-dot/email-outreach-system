export interface SmartParsedFilters {
  jobTitles: string[];
  expandedJobTitles: string[];
  locations: string[];
  normalizedLocations: NormalizedLocation[];
  industries: string[];
  companySizes: string[];
  seniorities: string[];
  keywords: string[];
  companies: string[];
  // P0: Technology stack filter
  technologies: string[];
  // Advanced filters for precision targeting
  emailStatuses?: string[];
  managementLevels?: string[];
  previousCompanies?: string[];
  schools?: string[];
  recentJobChange?: boolean;
  // P1: Revenue and intent filters
  revenueRanges?: string[];
  intentTopics?: string[];
  // P2: Exclusion filters for negative filtering
  excludeJobTitles?: string[];
  excludeIndustries?: string[];
  excludeCompanies?: string[];
}

export interface NormalizedLocation {
  original: string;
  city?: string;
  state?: string;
  country?: string;
  apolloFormat: string;
}

export interface ParseConfidence {
  overall: number;
  jobTitleConfidence: number;
  locationConfidence: number;
  industryConfidence: number;
  disambiguationNeeded: boolean;
  disambiguationReason?: string;
  alternativeInterpretations?: AlternativeInterpretation[];
}

export interface AlternativeInterpretation {
  description: string;
  filters: Partial<SmartParsedFilters>;
  confidence: number;
}

export interface SmartParseResult {
  filters: SmartParsedFilters;
  confidence: ParseConfidence;
  explanation: string;
  searchStrategy: SearchStrategy;
  fallbackFilters?: SmartParsedFilters[];
}

export interface SearchStrategy {
  approach: 'exact' | 'expanded' | 'broadened' | 'keywords';
  filtersApplied: string[];
  estimatedResultCount: 'high' | 'medium' | 'low' | 'unknown';
  fallbacksAvailable: number;
}

export interface FallbackLevel {
  level: number;
  description: string;
  filters: SmartParsedFilters;
  changes: string[];
}
