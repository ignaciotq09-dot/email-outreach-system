import { APOLLO_API_BASE } from "./constants";
import { mapPersonToLead } from "./utils";
import type { ApolloLead } from "./types";

export async function enrichPerson(email: string): Promise<ApolloLead | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY environment variable is not set');
  console.log('[Apollo] Enriching person by email:', email);
  try {
    const response = await fetch(`${APOLLO_API_BASE}/people/match`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey }, body: JSON.stringify({ email, reveal_personal_emails: true }) });
    if (!response.ok) { const errorText = await response.text(); console.error('[Apollo] Enrichment error:', response.status, errorText); return null; }
    const data = await response.json();
    const person = data.person;
    console.log('[Apollo] Enrichment response:', person ? 'Found' : 'Not found', person?.email ? '(has email)' : '(no email)');
    if (!person) return null;
    return mapPersonToLead(person);
  } catch (error) { console.error('[Apollo] Enrichment failed:', error); return null; }
}

export async function enrichPersonById(personId: string): Promise<ApolloLead | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY environment variable is not set');
  console.log('[Apollo] Enriching person by ID:', personId);
  try {
    const response = await fetch(`${APOLLO_API_BASE}/people/match`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey }, body: JSON.stringify({ id: personId, reveal_personal_emails: true }) });
    if (!response.ok) { const errorText = await response.text(); console.error('[Apollo] Enrichment by ID error:', response.status, errorText); return null; }
    const data = await response.json();
    const person = data.person;
    console.log('[Apollo] Enrichment by ID response:', person ? 'Found' : 'Not found', person?.email ? `(email: ${person.email})` : '(no email)');
    if (!person) return null;
    return mapPersonToLead(person);
  } catch (error) { console.error('[Apollo] Enrichment by ID failed:', error); return null; }
}

export async function enrichPersonByDetails(details: { firstName: string; lastName: string; company?: string; linkedinUrl?: string; domain?: string }): Promise<ApolloLead | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY environment variable is not set');
  const requestBody: Record<string, any> = { first_name: details.firstName, last_name: details.lastName, reveal_personal_emails: true };
  if (details.company && details.company.length > 0) requestBody.organization_name = details.company;
  if (details.linkedinUrl) requestBody.linkedin_url = details.linkedinUrl;
  if (details.domain) requestBody.domain = details.domain;
  console.log('[Apollo] Enriching person by details:', requestBody);
  try {
    const response = await fetch(`${APOLLO_API_BASE}/people/match`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey }, body: JSON.stringify(requestBody) });
    if (!response.ok) { const errorText = await response.text(); console.error('[Apollo] Enrichment error:', response.status, errorText); return null; }
    const data = await response.json();
    const person = data.person;
    console.log('[Apollo] Enrichment response:', person ? 'Found' : 'Not found', person?.email ? '(has email)' : '(no email)');
    if (!person) return null;
    return mapPersonToLead(person, { firstName: details.firstName, lastName: details.lastName, linkedinUrl: details.linkedinUrl });
  } catch (error) { console.error('[Apollo] Enrichment by details failed:', error); return null; }
}
