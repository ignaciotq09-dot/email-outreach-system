import { APOLLO_API_BASE } from "../apollo-svc/constants";
import type { CompanyEnrichmentResult } from "./types";
import type { Contact } from "@shared/schema";

export async function enrichCompany(contact: Contact): Promise<CompanyEnrichmentResult> {
  if (!contact.company) {
    console.log('[DeepDive:Company] No company for contact');
    return { found: false, confidence: 0 };
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.log('[DeepDive:Company] No Apollo API key');
    return { found: false, confidence: 0 };
  }

  console.log('[DeepDive:Company] Enriching company:', contact.company);

  try {
    const searchResponse = await fetch(`${APOLLO_API_BASE}/organizations/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({
        q_organization_name: contact.company,
        page: 1,
        per_page: 1
      })
    });

    if (!searchResponse.ok) {
      console.error('[DeepDive:Company] Search failed:', searchResponse.status);
      return { found: false, confidence: 0 };
    }

    const searchData = await searchResponse.json();
    const org = searchData.organizations?.[0];

    if (!org) {
      console.log('[DeepDive:Company] No organization found');
      return { found: false, confidence: 0 };
    }

    console.log('[DeepDive:Company] Found organization:', org.name);

    const techStack = org.technologies?.slice(0, 10) || [];
    const recentNews: string[] = [];

    if (org.latest_funding_stage) {
      recentNews.push(`Latest funding: ${org.latest_funding_stage}`);
    }
    if (org.founded_year) {
      recentNews.push(`Founded in ${org.founded_year}`);
    }

    return {
      found: true,
      data: {
        name: org.name,
        domain: org.primary_domain || org.website_url,
        industry: org.industry,
        size: org.estimated_num_employees ? `${org.estimated_num_employees} employees` : undefined,
        funding: org.latest_funding_stage,
        techStack,
        recentNews,
        competitors: [],
        description: org.short_description || org.description,
      },
      confidence: 0.8,
    };
  } catch (error) {
    console.error('[DeepDive:Company] Error:', error);
    return { found: false, confidence: 0 };
  }
}
