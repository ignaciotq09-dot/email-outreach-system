import { db } from "../../db";
import { contacts, campaignContacts, sentEmails } from "@shared/schema";
import { eq, asc, count, and, isNull, ne } from "drizzle-orm";
import { getAvailableIndustries, getCompanySizeOptions } from "../../services/apollo-service";
import { callOpenAIFast } from "../../ai/openai-client";
import { MAX_CONTACTS } from "./schemas";

export async function enforceContactLimit(userId: number) {
  const [{ count: totalCount }] = await db.select({ count: count() }).from(contacts).where(and(eq(contacts.userId, userId), ne(contacts.source, 'lead_finder')));
  
  if (Number(totalCount) > MAX_CONTACTS) {
    const excess = Number(totalCount) - MAX_CONTACTS;
    const oldestContacts = await db.select({ id: contacts.id, source: contacts.source }).from(contacts).leftJoin(sentEmails, eq(contacts.id, sentEmails.contactId)).where(and(eq(contacts.userId, userId), ne(contacts.source, 'lead_finder'), isNull(sentEmails.id))).orderBy(asc(contacts.id)).limit(excess);
    
    let deletedCount = 0;
    for (const oldContact of oldestContacts) {
      if (oldContact.source === 'lead_finder') { console.log(`[Leads] SAFETY: Refusing to delete lead_finder contact ${oldContact.id}`); continue; }
      try {
        await db.delete(campaignContacts).where(eq(campaignContacts.contactId, oldContact.id));
        await db.delete(contacts).where(eq(contacts.id, oldContact.id));
        deletedCount++;
      } catch (err) { console.log(`[Leads] Skipping contact ${oldContact.id} - has related records`); }
    }
    if (deletedCount > 0) console.log(`[Leads] FIFO cleanup for user ${userId}: removed ${deletedCount} oldest NON-lead_finder contact(s) to maintain ${MAX_CONTACTS} limit`);
  }
}

export async function parseQueryWithAI(query: string): Promise<{ jobTitles: string[]; locations: string[]; industries: string[]; companySizes: string[]; }> {
  const companySizeOptions = getCompanySizeOptions();
  const industryOptions = getAvailableIndustries();
  const validCompanySizes = new Set(companySizeOptions.map(s => s.value));
  const validIndustries = new Set(industryOptions.map(i => i.toLowerCase()));
  
  const systemPrompt = `You are a search query parser. Extract structured filters from natural language queries about finding business contacts/leads.

Available company size options (use EXACT values only): ${companySizeOptions.map(s => s.value).join(', ')}
Available industry options: ${industryOptions.join(', ')}

Return a JSON object with these fields:
- jobTitles: array of SPECIFIC job titles (e.g., ["CEO", "Marketing Director", "Sales Manager"])
- locations: array of locations mentioned (e.g., ["California", "New York", "United States"])
- industries: array of industries that EXACTLY match our options above
- companySizes: array of company size values that EXACTLY match our options above

CRITICAL - Expand broad industry/profession terms into MULTIPLE specific job titles:
- "general contractors" or "contractors" → ["General Contractor", "Contractor", "Construction Manager", "Project Manager", "Site Manager", "Owner", "President"]
- "plumbers" → ["Plumber", "Master Plumber", "Plumbing Contractor", "Owner", "President"]
- "electricians" → ["Electrician", "Master Electrician", "Electrical Contractor", "Owner", "President"]
- "lawyers" or "attorneys" → ["Attorney", "Lawyer", "Partner", "Associate", "Counsel", "Legal Counsel"]
- "doctors" or "physicians" → ["Doctor", "Physician", "MD", "Owner", "Medical Director"]

IMPORTANT DISTINCTION - Real Estate Developers vs Real Estate Agents:
- "real estate developers" → ["Real Estate Developer", "Property Developer", "Land Developer", "Development Director", "VP of Development"] with industry "Real Estate"
- "realtors", "real estate agents" → ["Realtor", "Real Estate Agent", "Broker", "Real Estate Broker", "Owner"] with industry "Real Estate"

Also set the relevant industry when applicable:
- contractors, construction, builders → add "Construction" to industries
- lawyers, attorneys → add "Law Practice" to industries

Be smart about interpreting:
- "startup" or "small companies" → "1-10" or "11-50"
- "enterprise" or "large companies" → "1001-5000" or "5001-10000" or "10001+"
- Regional terms like "US", "USA" → "United States"`;

  try {
    const content = await callOpenAIFast([{ role: "system", content: systemPrompt }, { role: "user", content: query }], { responseFormat: { type: "json_object" } });
    const parsed = JSON.parse(content);
    
    const jobTitles = Array.isArray(parsed.jobTitles) ? parsed.jobTitles.filter((t: any) => typeof t === 'string' && t.trim()) : [];
    const locations = Array.isArray(parsed.locations) ? parsed.locations.filter((l: any) => typeof l === 'string' && l.trim()) : [];
    const industries = Array.isArray(parsed.industries) ? parsed.industries.filter((ind: any) => typeof ind === 'string' && validIndustries.has(ind.toLowerCase())).map((ind: string) => industryOptions.find(i => i.toLowerCase() === ind.toLowerCase()) || ind) : [];
    const companySizes = Array.isArray(parsed.companySizes) ? parsed.companySizes.filter((size: any) => typeof size === 'string' && validCompanySizes.has(size)) : [];
    
    console.log('[Leads] Validated parsed filters:', { jobTitles, locations, industries, companySizes });
    return { jobTitles, locations, industries, companySizes };
  } catch (error) {
    console.error("[Leads] AI parsing error:", error);
    return { jobTitles: [query], locations: [], industries: [], companySizes: [] };
  }
}
