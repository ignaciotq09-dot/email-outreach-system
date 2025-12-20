import { APOLLO_API_BASE, COMPANY_SIZE_RANGES } from "./constants";
import { isDomain, normalizeDomain, mapPersonToLead } from "./utils";
import type { ApolloSearchFilters, ApolloSearchResponse, ApolloLead } from "./types";
import { apolloResultCache } from "./result-cache";

export async function searchPeople(filters: ApolloSearchFilters): Promise<ApolloSearchResponse> {
  // Check cache first to save API calls
  const cachedResult = apolloResultCache.get(filters);
  if (cachedResult) {
    return cachedResult;
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY environment variable is not set');
  }

  const page = filters.page || 1;
  const perPage = Math.min(filters.perPage || 25, 100);
  const requestBody: Record<string, any> = {
    page,
    per_page: perPage,
  };

  // Apply job title filter
  if (filters.jobTitles && filters.jobTitles.length > 0) {
    requestBody.person_titles = filters.jobTitles;
  }

  // Apply location filter
  if (filters.locations && filters.locations.length > 0) {
    requestBody.person_locations = filters.locations;
  }

  // Apply company size filter
  if (filters.companySizes && filters.companySizes.length > 0) {
    const ranges = filters.companySizes
      .map(size => COMPANY_SIZE_RANGES[size])
      .filter(Boolean);
    if (ranges.length > 0) {
      requestBody.organization_num_employees_ranges = ranges;
    }
  }

  // Apply industry filter
  if (filters.industries && filters.industries.length > 0) {
    requestBody.organization_industry_tags = filters.industries;
  }

  // Email status filter - Apollo uses contact_email_status with values like "verified", "guessed", etc.
  // When user selects "verified", we pass ["verified"]. When "unverified", we don't filter (or could pass other statuses).
  if (filters.emailStatuses && filters.emailStatuses.length > 0) {
    // Only filter if "verified" is selected exclusively (not both)
    if (filters.emailStatuses.includes("verified") && !filters.emailStatuses.includes("unverified")) {
      requestBody.contact_email_status = ["verified"];
    }
    // If only "unverified" is selected, we exclude verified emails by not setting the filter
    // Apollo doesn't have a direct "unverified" status, so we filter client-side for unverified
  }

  // Apply company/domain filter
  if (filters.companies && filters.companies.length > 0) {
    const domains = filters.companies.filter(isDomain).map(normalizeDomain);
    const companyNames = filters.companies.filter(c => !isDomain(c));

    if (domains.length > 0) {
      requestBody.q_organization_domains = domains.join('\n');
    }
    if (companyNames.length > 0) {
      requestBody.q_organization_name = companyNames[0];
    }
  }

  // Request email reveals in search (uses Apollo credits)
  requestBody.reveal_personal_emails = true;

  console.log('[Apollo] Search request:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Cache-Control': 'no-cache',
        'accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] Search error:', response.status, errorText);
      throw new Error(`Apollo API error: ${response.status}`);
    }

    const data = await response.json();

    // Debug: log first person's email data
    if (data.people && data.people.length > 0) {
      const firstPerson = data.people[0];
      console.log('[Apollo] First person email data:', {
        email: firstPerson.email,
        emailStatus: firstPerson.email_status,
        personalEmails: firstPerson.personal_emails,
        emailsFromFile: firstPerson.emails_from_file,
        name: `${firstPerson.first_name} ${firstPerson.last_name}`,
      });
    }

    const leads: ApolloLead[] = (data.people || []).map((person: any) => mapPersonToLead(person));

    // Count leads with emails
    const leadsWithEmail = leads.filter(l => l.email).length;
    console.log(`[Apollo] Leads with email: ${leadsWithEmail}/${leads.length}`);

    // Sort by email quality: verified first, then guessed, then no email
    // This prioritizes high-quality contacts without changing the data
    leads.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        'verified': 0,
        'valid': 1,
        'guessed': 2,
        'unavailable': 3,
        '': 4
      };
      const aStatus = a.emailStatus || '';
      const bStatus = b.emailStatus || '';
      const aPriority = statusPriority[aStatus] ?? 4;
      const bPriority = statusPriority[bStatus] ?? 4;
      return aPriority - bPriority;
    });

    const pagination = {
      page,
      perPage,
      totalPages: Math.ceil((data.pagination?.total_entries || 0) / perPage),
      totalResults: data.pagination?.total_entries || 0,
    };

    const result = { leads, pagination };

    // Cache the result for future identical searches
    apolloResultCache.set(filters, result);

    console.log(`[Apollo] Found ${leads.length} leads, total: ${pagination.totalResults}`);
    return result;
  } catch (error) {
    console.error('[Apollo] Search failed:', error);
    throw error;
  }
}
