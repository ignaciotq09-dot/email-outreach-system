import { APOLLO_API_BASE } from "../apollo-svc/constants";
import type { ApolloEnrichmentResult } from "./types";
import type { Contact } from "@shared/schema";

export async function enrichWithApollo(contact: Contact): Promise<ApolloEnrichmentResult> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.log('[DeepDive:Apollo] No API key configured');
    return { found: false, confidence: 0 };
  }

  console.log('[DeepDive:Apollo] Enriching contact:', contact.name, contact.email);

  try {
    const requestBody: Record<string, any> = { reveal_personal_emails: true, reveal_phone_number: true };
    if (contact.email) requestBody.email = contact.email;
    if (contact.linkedinUrl) requestBody.linkedin_url = contact.linkedinUrl;
    if (!contact.email && !contact.linkedinUrl && contact.name) {
      const nameParts = contact.name.split(' ');
      requestBody.first_name = nameParts[0];
      requestBody.last_name = nameParts.slice(1).join(' ') || nameParts[0];
      if (contact.company) requestBody.organization_name = contact.company;
    }

    const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('[DeepDive:Apollo] API error:', response.status);
      return { found: false, confidence: 0 };
    }

    const data = await response.json();
    const person = data.person;

    if (!person) {
      console.log('[DeepDive:Apollo] No match found');
      return { found: false, confidence: 0 };
    }

    console.log('[DeepDive:Apollo] Found match:', person.name || person.first_name);

    const employmentHistory = person.employment_history?.map((job: any) => ({
      organizationName: job.organization_name || job.company_name,
      title: job.title,
      startDate: job.start_date,
      endDate: job.end_date,
      current: job.current || !job.end_date,
    })) || [];

    const education = person.education?.map((edu: any) => ({
      schoolName: edu.school_name || edu.school,
      degree: edu.degree,
      field: edu.field_of_study || edu.field,
      startYear: edu.start_year,
      endYear: edu.end_year,
    })) || [];

    return {
      found: true,
      data: {
        firstName: person.first_name,
        lastName: person.last_name,
        name: person.name || `${person.first_name} ${person.last_name}`,
        email: person.email,
        phone: person.phone_numbers?.[0]?.sanitized_number || person.phone,
        title: person.title,
        headline: person.headline,
        linkedinUrl: person.linkedin_url,
        photoUrl: person.photo_url,
        city: person.city,
        state: person.state,
        country: person.country,
        location: [person.city, person.state, person.country].filter(Boolean).join(', '),
        employmentHistory,
        education,
        skills: person.skills || [],
        organizationName: person.organization?.name,
        organizationIndustry: person.organization?.industry,
        organizationSize: person.organization?.estimated_num_employees?.toString(),
        organizationFunding: person.organization?.latest_funding_stage,
      },
      confidence: person.email ? 0.95 : 0.7,
    };
  } catch (error) {
    console.error('[DeepDive:Apollo] Error:', error);
    return { found: false, confidence: 0 };
  }
}
