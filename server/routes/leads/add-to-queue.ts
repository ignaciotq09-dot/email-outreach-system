import type { Express } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { contacts, campaignContacts, campaigns } from "@shared/schema";
import { requireAuth } from "../../auth/middleware";
import { enrichPersonById, enrichPersonByDetails } from "../../services/apollo-service";
import { getOrCreateQuota, checkAndDeductQuota, refundQuota } from "../../services/apollo-quota-service";
import { normalizePhone } from "../../services/sms-opt-out";
import { addToQueueSchema, type LeadOutcome } from "./schemas";
import { enforceContactLimit } from "./helpers";

export function registerAddToQueueRoutes(app: Express) {
  app.post("/api/leads/add-to-queue", requireAuth, async (req: any, res) => {
    try {
      const { leads } = addToQueueSchema.parse(req.body);
      if (leads.length === 0) return res.status(400).json({ error: 'No leads to add' });

      const userId = req.session.userId;
      
      let activeCampaign = await db.query.campaigns.findFirst({ where: and(eq(campaigns.userId, userId), eq(campaigns.status, 'draft')), orderBy: [desc(campaigns.createdAt)] });
      if (!activeCampaign) {
        console.log(`[Leads] No draft campaign found for user ${userId}, creating one...`);
        const [newCampaign] = await db.insert(campaigns).values({ userId, subject: '', body: '', status: 'draft' }).returning();
        activeCampaign = newCampaign;
        console.log(`[Leads] Created draft campaign ${activeCampaign.id} for user ${userId}`);
      } else { console.log(`[Leads] Using existing draft campaign ${activeCampaign.id} for user ${userId}`); }
      
      const leadsWithEmail = leads.filter(l => l.email && l.email.includes('@'));
      const leadsNeedingEnrichment = leads.filter(l => !l.email || !l.email.includes('@'));
      console.log(`[Leads] Add to queue: ${leadsWithEmail.length} with email, ${leadsNeedingEnrichment.length} needing enrichment`);

      const results = {
        enriched: 0, imported: 0, linkedExisting: 0, alreadyLinked: 0, failed: 0,
        failedNames: [] as string[], failedLeadIds: [] as string[], importedLeadIds: [] as string[],
        linkedExistingLeadIds: [] as string[], duplicateEmails: [] as string[], duplicateLeadIds: [] as string[],
        skippedEnrichment: 0, addedContactIds: [] as number[], campaignId: activeCampaign.id, outcomes: [] as LeadOutcome[],
      };

      for (const lead of leadsWithEmail) {
        try {
          const existing = await db.query.contacts.findFirst({ where: and(eq(contacts.email, lead.email!), eq(contacts.userId, userId)) });
          if (existing) {
            const existingLink = await db.query.campaignContacts.findFirst({ where: and(eq(campaignContacts.campaignId, activeCampaign.id), eq(campaignContacts.contactId, existing.id)) });
            if (existingLink) {
              results.alreadyLinked++; results.duplicateEmails.push(lead.email!); results.duplicateLeadIds.push(lead.id);
              results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'duplicate_already_linked', email: lead.email! });
            } else {
              await db.insert(campaignContacts).values({ campaignId: activeCampaign.id, contactId: existing.id }).onConflictDoNothing();
              results.linkedExisting++; results.linkedExistingLeadIds.push(lead.id); results.addedContactIds.push(existing.id);
              results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'linked_existing', email: lead.email! });
            }
            results.skippedEnrichment++; continue;
          }
          let normalizedPhone: string | null = null;
          if (lead.title === 'phone' && lead.company) { try { normalizedPhone = normalizePhone(lead.company); } catch (e) { } }
          const contactData = { userId, name: lead.name, email: lead.email!, phone: normalizedPhone, company: lead.company || null, position: lead.title || null, location: lead.location || null, industry: lead.industry || null, companySize: lead.companySize || null, notes: lead.linkedinUrl ? `LinkedIn: ${lead.linkedinUrl}` : null, enrichmentSource: 'apollo', source: 'lead_finder' };
          const newContact = await db.transaction(async (tx) => {
            const [contact] = await tx.insert(contacts).values(contactData).returning();
            await tx.insert(campaignContacts).values({ campaignId: activeCampaign.id, contactId: contact.id }).onConflictDoNothing();
            return contact;
          });
          results.addedContactIds.push(newContact.id); results.importedLeadIds.push(lead.id); results.imported++; results.skippedEnrichment++;
          results.outcomes.push({ leadId: lead.id, contactId: newContact.id, status: 'imported', email: lead.email! });
        } catch (err: any) {
          console.error(`[Leads] Error importing lead with email ${lead.email}:`, err);
          results.failed++; results.failedNames.push(lead.name); results.failedLeadIds.push(lead.id);
          results.outcomes.push({ leadId: lead.id, contactId: null, status: 'failed', email: lead.email!, reason: err.message });
        }
      }

      if (leadsNeedingEnrichment.length > 0) {
        const quotaResult = await checkAndDeductQuota(userId, leadsNeedingEnrichment.length);
        if (!quotaResult.success) {
          for (const lead of leadsNeedingEnrichment) {
            results.failed++; results.failedNames.push(lead.name || `${lead.firstName} ${lead.lastName}`); results.failedLeadIds.push(lead.id);
            results.outcomes.push({ leadId: lead.id, contactId: null, status: 'quota_exceeded', email: null, reason: 'Quota exceeded' });
          }
        } else {
          const creditsDeducted = quotaResult.deducted; let creditsUsed = 0;
          for (let i = 0; i < leadsNeedingEnrichment.length && i < creditsDeducted; i++) {
            const lead = leadsNeedingEnrichment[i];
            try {
              let enrichedLead = await enrichPersonById(lead.id);
              if (!enrichedLead || !enrichedLead.email) enrichedLead = await enrichPersonByDetails({ firstName: lead.firstName, lastName: lead.lastName, company: lead.company || undefined, linkedinUrl: lead.linkedinUrl || undefined });
              if (!enrichedLead || !enrichedLead.email) { results.failed++; results.failedNames.push(lead.name || `${lead.firstName} ${lead.lastName}`); results.failedLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: null, status: 'failed', email: null, reason: 'No email found' }); continue; }
              creditsUsed++; results.enriched++;
              const existing = await db.query.contacts.findFirst({ where: and(eq(contacts.email, enrichedLead.email), eq(contacts.userId, userId)) });
              if (existing) {
                const existingLink = await db.query.campaignContacts.findFirst({ where: and(eq(campaignContacts.campaignId, activeCampaign.id), eq(campaignContacts.contactId, existing.id)) });
                if (existingLink) { results.alreadyLinked++; results.duplicateEmails.push(enrichedLead.email); results.duplicateLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'duplicate_already_linked', email: enrichedLead.email }); }
                else {
                  try {
                    const [linkResult] = await db.insert(campaignContacts).values({ campaignId: activeCampaign.id, contactId: existing.id }).onConflictDoNothing().returning();
                    if (linkResult) { results.linkedExisting++; results.linkedExistingLeadIds.push(lead.id); results.addedContactIds.push(existing.id); results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'linked_existing', email: enrichedLead.email }); }
                    else {
                      const verifyLink = await db.query.campaignContacts.findFirst({ where: and(eq(campaignContacts.campaignId, activeCampaign.id), eq(campaignContacts.contactId, existing.id)) });
                      if (verifyLink) { results.alreadyLinked++; results.duplicateEmails.push(enrichedLead.email); results.duplicateLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'duplicate_already_linked', email: enrichedLead.email }); }
                      else { results.failed++; results.failedNames.push(lead.name || `${lead.firstName} ${lead.lastName}`); results.failedLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'failed', email: enrichedLead.email, reason: 'Link insert failed' }); }
                    }
                  } catch (linkErr: any) { results.failed++; results.failedNames.push(lead.name || `${lead.firstName} ${lead.lastName}`); results.failedLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: existing.id, status: 'failed', email: enrichedLead.email, reason: `Failed to link: ${linkErr.message}` }); }
                }
                continue;
              }
              const contactData = { userId, name: enrichedLead.name || lead.name || `${lead.firstName} ${lead.lastName}`, email: enrichedLead.email, company: enrichedLead.company || lead.company || null, position: enrichedLead.title || lead.title || null, location: enrichedLead.location || lead.location || null, industry: enrichedLead.industry || lead.industry || null, companySize: enrichedLead.companySize || lead.companySize || null, notes: lead.linkedinUrl ? `LinkedIn: ${lead.linkedinUrl}` : null, enrichmentSource: 'apollo', source: 'lead_finder' };
              const newContact = await db.transaction(async (tx) => { const [contact] = await tx.insert(contacts).values(contactData).returning(); await tx.insert(campaignContacts).values({ campaignId: activeCampaign.id, contactId: contact.id }).onConflictDoNothing(); return contact; });
              results.addedContactIds.push(newContact.id); results.importedLeadIds.push(lead.id); results.imported++;
              results.outcomes.push({ leadId: lead.id, contactId: newContact.id, status: 'imported', email: enrichedLead.email });
            } catch (err: any) { results.failed++; results.failedNames.push(lead.name || `${lead.firstName} ${lead.lastName}`); results.failedLeadIds.push(lead.id); results.outcomes.push({ leadId: lead.id, contactId: null, status: 'failed', email: null, reason: err.message || 'Unknown error' }); }
          }
          const creditsToRefund = creditsDeducted - creditsUsed;
          if (creditsToRefund > 0) { console.log(`[Leads] Refunding ${creditsToRefund} credit(s) for failed enrichments`); await refundQuota(userId, creditsToRefund); }
        }
      }

      await enforceContactLimit(userId);
      const updatedQuota = await getOrCreateQuota(userId);
      const actualCampaignContacts = await db.query.campaignContacts.findMany({ where: eq(campaignContacts.campaignId, activeCampaign.id) });
      const actualCount = actualCampaignContacts.length;
      const expectedLinkedCount = results.imported + results.linkedExisting;
      const addedContactIdSet = new Set(results.addedContactIds);
      const verifiedLinkedCount = actualCampaignContacts.filter(cc => addedContactIdSet.has(cc.contactId)).length;
      const isVerified = verifiedLinkedCount === expectedLinkedCount;
      
      console.log(`[Leads] BULLETPROOF VERIFICATION: Expected ${expectedLinkedCount}, Verified ${verifiedLinkedCount}, Total ${actualCount}, ${isVerified ? 'PASSED ✓' : 'MISMATCH ✗'}`);
      console.log(`[Leads] Add to queue complete: ${results.enriched} enriched, ${results.imported} new, ${results.linkedExisting} linked existing, ${results.alreadyLinked} already in campaign, ${results.failed} failed`);

      res.json({
        success: true, enriched: results.enriched, imported: results.imported, linkedExisting: results.linkedExisting,
        alreadyLinked: results.alreadyLinked, failed: results.failed, failedNames: results.failedNames,
        failedLeadIds: results.failedLeadIds, importedLeadIds: results.importedLeadIds, linkedExistingLeadIds: results.linkedExistingLeadIds,
        duplicateEmails: results.duplicateEmails, duplicateLeadIds: results.duplicateLeadIds, skippedEnrichment: results.skippedEnrichment,
        addedContactIds: results.addedContactIds, campaignId: results.campaignId, outcomes: results.outcomes,
        verification: { expectedLinkedCount, verifiedLinkedCount, actualCampaignContactCount: actualCount, isVerified, discrepancy: isVerified ? 0 : expectedLinkedCount - verifiedLinkedCount },
        quota: { limit: updatedQuota.monthlyLimit, used: updatedQuota.used, remaining: updatedQuota.remaining, resetDate: updatedQuota.resetDate },
        quotaMessage: results.skippedEnrichment > 0 ? `${results.skippedEnrichment} contact(s) imported directly (had email). ${results.enriched} enriched using credits.` : undefined,
      });
    } catch (error: any) {
      console.error('[Leads] Add to queue error:', error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid lead data', details: error.errors });
      res.status(500).json({ error: 'Failed to add leads to queue' });
    }
  });
}
