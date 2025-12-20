export interface EnhancedApolloLead {
  id: string; firstName: string; lastName: string; name: string; email: string | null; title: string | null;
  seniority: string | null; company: string | null; companyWebsite: string | null; location: string | null;
  city: string | null; state: string | null; country: string | null; industry: string | null;
  companySize: string | null; employeeCount: number | null; revenue: string | null; revenueRange: string | null;
  technologies: string[]; linkedinUrl: string | null; photoUrl: string | null; emailStatus: string | null;
  intentTopics: string[]; keywords: string[];
}

export interface EnhancedSearchResponse {
  leads: EnhancedApolloLead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
  searchMetadata: { filtersApplied: number; durationMs: number; apolloCreditsUsed: number; domainFiltered?: boolean; resolvedDomains?: string[] };
}
