export interface ParsedFilters {
  jobTitles: string[];
  locations: string[];
  industries: string[];
  companySizes: string[];
  companies: string[];
  seniorities: string[];
  technologies: string[];
  keywords: string[];
  revenueRanges: string[];
  intentTopics: string[];
  // Advanced filters for precision targeting
  emailStatuses?: string[]; // 'verified', 'likely', 'guessed', 'unavailable'
  managementLevels?: string[]; // 'executive', 'director', 'manager', 'individual_contributor'
  previousCompanies?: string[]; // Employment history - find people who worked at specific companies
  schools?: string[]; // Education filtering
  recentJobChange?: boolean; // Find people who changed jobs in last 90 days
}

export interface QueryParseResult {
  filters: ParsedFilters;
  confidence: number;
  explanation: string;
  clarifyingQuestions: string[];
  needsClarification: boolean;
  queryType: 'specific' | 'broad' | 'ambiguous';
  expandedFromOriginal: boolean;
}

export interface QueryClassification {
  intent: 'find_leads' | 'refine_search' | 'find_similar' | 'unclear';
  specificity: 'high' | 'medium' | 'low';
  hasRoleInfo: boolean;
  hasLocationInfo: boolean;
  hasCompanyInfo: boolean;
  hasIndustryInfo: boolean;
  suggestedClarifications: string[];
}
