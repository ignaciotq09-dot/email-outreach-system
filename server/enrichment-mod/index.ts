import { contacts } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import type { EnrichmentResult } from './types';
import { enrichWithGoogle, enrichWithClearbit, enrichWithApollo, enrichWithFullContact } from './providers';
export * from './types';

export class ContactEnrichmentService {
  static async enrichContact(contactId: number): Promise<EnrichmentResult | null> { console.log(`[Enrichment] Starting enrichment for contact ${contactId}`); const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, contactId) }); if (!contact) { console.error(`[Enrichment] Contact ${contactId} not found`); return null; }
  let result = await enrichWithGoogle(contact); if (!result && process.env.CLEARBIT_API_KEY) result = await enrichWithClearbit(contact); if (!result && process.env.APOLLO_API_KEY) result = await enrichWithApollo(contact); if (!result && process.env.FULLCONTACT_API_KEY) result = await enrichWithFullContact(contact);
  if (result) { await db.update(contacts).set({ industry: result.industry || contact.industry, companySize: result.companySize || contact.companySize, companyRevenue: result.companyRevenue || contact.companyRevenue, recentNews: result.recentNews || contact.recentNews, location: result.location || contact.location, lastEnriched: new Date(), enrichmentSource: result.source }).where(eq(contacts.id, contactId)); console.log(`[Enrichment] Successfully enriched contact ${contactId} using ${result.source}`); } else { console.log(`[Enrichment] No enrichment data found for contact ${contactId}`); }
  return result; }
}
