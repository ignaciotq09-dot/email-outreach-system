import type { ParsedFilters } from "../query-parser";
import { resolveDomain } from "../domain-resolver";
import type { EnhancedApolloLead, EnhancedSearchResponse } from "./types";
import { APOLLO_API_BASE, SENIORITY_MAP, REVENUE_MAP, COMPANY_SIZE_MAP, formatRevenueRange } from "./constants";

export async function enhancedSearch(filters: ParsedFilters, options?: { page?: number; perPage?: number }): Promise<EnhancedSearchResponse> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY environment variable is not set');
  const startTime = Date.now(); const page = options?.page || 1; const perPage = options?.perPage || 25;
  let filtersApplied = 0; let domainFiltered = false; let resolvedDomainsForMetadata: string[] = [];
  const requestBody: Record<string, any> = { page, per_page: perPage };
  if (filters.jobTitles?.length > 0) { requestBody.person_titles = filters.jobTitles; filtersApplied++; }
  if (filters.locations?.length > 0) { requestBody.person_locations = filters.locations; filtersApplied++; }
  if (filters.industries?.length > 0) { requestBody.organization_industry_tags = filters.industries; filtersApplied++; }
  if (filters.companySizes?.length > 0) { const sizes = filters.companySizes.map(s => COMPANY_SIZE_MAP[s]).filter(Boolean); if (sizes.length > 0) { requestBody.organization_num_employees_ranges = sizes; filtersApplied++; } }
  if (filters.seniorities?.length > 0) { const seniorities = [...new Set(filters.seniorities.flatMap(s => SENIORITY_MAP[s] || []))]; if (seniorities.length > 0) { requestBody.person_seniorities = seniorities; filtersApplied++; } }
  if (filters.technologies?.length > 0) { requestBody.currently_using_any_of_technology_uids = filters.technologies; filtersApplied++; }
  if (filters.keywords?.length > 0) { requestBody.q_keywords = filters.keywords.join(' OR '); filtersApplied++; }
  if (filters.revenueRanges?.length > 0) { const ranges = filters.revenueRanges.map(r => REVENUE_MAP[r]).filter(Boolean); if (ranges.length > 0) { requestBody.organization_revenue_ranges = ranges; filtersApplied++; } }

  // ADVANCED FILTERS FOR PRECISION TARGETING

  // Email status filtering - only return contacts with specific email verification status
  if (filters.emailStatuses?.length > 0) {
    const statusMap: Record<string, string[]> = {
      'verified': ['verified'],
      'likely': ['likely_to_engage'],
      'guessed': ['guessed'],
      'unavailable': ['unavailable'],
    };

    const apolloStatuses = filters.emailStatuses.flatMap(
      status => statusMap[status] || []
    );

    if (apolloStatuses.length > 0) {
      requestBody.contact_email_status = apolloStatuses;
      filtersApplied++;
    }
  }

  // Management level filtering - more precise than seniority
  if (filters.managementLevels?.length > 0) {
    // Apollo supports: 'executive', 'director', 'manager', 'individual_contributor'
    requestBody.person_management_levels = filters.managementLevels;
    filtersApplied++;
  }

  // Employment history filtering - find people who previously worked at specific companies
  if (filters.previousCompanies?.length > 0) {
    requestBody.person_past_company_names = filters.previousCompanies;
    filtersApplied++;
  }

  // Education filtering - target specific schools/universities
  if (filters.schools?.length > 0) {
    requestBody.person_school_names = filters.schools;
    filtersApplied++;
  }

  // Recent job change signal - find people who changed roles in last 90 days
  if (filters.recentJobChange === true) {
    requestBody.person_titles_changed_in_last_90_days = true;
    filtersApplied++;
  }

  // END ADVANCED FILTERS

  if (filters.companies?.length > 0) { const resolvedDomains: string[] = []; for (const company of filters.companies) { const isDomain = /\.(com|io|org|net|co|ai|edu|gov)$/i.test(company.trim()); if (isDomain) { let domain = company.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]; resolvedDomains.push(domain); } else { const domain = await resolveDomain(company); if (domain) resolvedDomains.push(domain); } } if (resolvedDomains.length > 0) { requestBody.q_organization_domains_list = resolvedDomains; filtersApplied++; domainFiltered = true; resolvedDomainsForMetadata = resolvedDomains; } else { return { leads: [], pagination: { page, perPage, totalPages: 0, totalResults: 0 }, searchMetadata: { filtersApplied: 0, durationMs: Date.now() - startTime, apolloCreditsUsed: 0 } }; } }
  console.log('[EnhancedApollo] Searching with', filtersApplied, 'filters:', JSON.stringify(requestBody, null, 2));
  try { const response = await fetch(`${APOLLO_API_BASE}/mixed_people/api_search`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'Cache-Control': 'no-cache', 'accept': 'application/json' }, body: JSON.stringify(requestBody) }); if (!response.ok) { const errorText = await response.text(); console.error('[EnhancedApollo] API Error Details:', response.status, errorText); throw new Error(`Apollo API error: ${response.status} - ${errorText}`); } const data = await response.json(); console.log('[EnhancedApollo] Found', data.pagination?.total_entries || 0, 'results'); const leads: EnhancedApolloLead[] = (data.people || []).map((person: any) => ({ id: person.id, firstName: person.first_name || '', lastName: person.last_name || '', name: [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Unknown', email: person.email || null, title: person.title || null, seniority: person.seniority || null, company: person.organization?.name || null, companyWebsite: person.organization?.website_url || null, location: [person.city, person.state, person.country].filter(Boolean).join(', ') || null, city: person.city || null, state: person.state || null, country: person.country || null, industry: person.organization?.industry || null, companySize: person.organization?.estimated_num_employees ? `${person.organization.estimated_num_employees} employees` : null, employeeCount: person.organization?.estimated_num_employees || null, revenue: person.organization?.annual_revenue_printed || null, revenueRange: person.organization?.annual_revenue ? formatRevenueRange(person.organization.annual_revenue) : null, technologies: person.organization?.technologies?.map((t: any) => t.name || t) || [], linkedinUrl: person.linkedin_url || null, photoUrl: person.photo_url || null, emailStatus: person.email_status || null, intentTopics: person.organization?.intent_topics?.map((t: any) => t.name || t) || [], keywords: person.organization?.keywords || [] })); return { leads, pagination: { page: data.pagination?.page || page, perPage: data.pagination?.per_page || perPage, totalPages: data.pagination?.total_pages || 1, totalResults: data.pagination?.total_entries || leads.length }, searchMetadata: { filtersApplied, durationMs: Date.now() - startTime, apolloCreditsUsed: 0, domainFiltered, resolvedDomains: resolvedDomainsForMetadata } }; } catch (error) { console.error('[EnhancedApollo] Search failed:', error); throw error; }
}
