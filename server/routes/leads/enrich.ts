import type { Express } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth/middleware";
import { enrichPersonById, enrichPersonByDetails, type ApolloLead } from "../../services/apollo-service";
import { getOrCreateQuota, checkAndDeductQuota } from "../../services/apollo-quota-service";
import { enrichSchema } from "./schemas";

export function registerEnrichRoutes(app: Express) {
  app.post("/api/leads/enrich", requireAuth, async (req: any, res) => {
    try {
      const { leads } = enrichSchema.parse(req.body);
      if (leads.length === 0) return res.status(400).json({ error: 'No leads to enrich' });

      const userId = req.session.userId;
      const quotaResult = await checkAndDeductQuota(userId, leads.length);
      
      if (!quotaResult.success) {
        return res.status(429).json({ 
          error: 'Quota exceeded', message: quotaResult.message,
          quota: { limit: quotaResult.status.monthlyLimit, used: quotaResult.status.used, remaining: quotaResult.status.remaining, resetDate: quotaResult.status.resetDate },
        });
      }
      
      const leadsToProcess = leads.slice(0, quotaResult.deducted);
      if (leadsToProcess.length < leads.length) console.log(`[Leads] Quota limit applied: processing ${leadsToProcess.length} of ${leads.length} requested`);

      console.log(`[Leads] Enriching ${leadsToProcess.length} lead(s) to reveal emails using Apollo person IDs`);

      const results: { enriched: ApolloLead[]; failed: string[]; } = { enriched: [], failed: [] };

      for (const lead of leadsToProcess) {
        try {
          let enrichedLead = await enrichPersonById(lead.id);
          if (!enrichedLead || !enrichedLead.email) {
            console.log(`[Leads] ID enrichment returned no email for ${lead.firstName} ${lead.lastName}, trying fallback...`);
            enrichedLead = await enrichPersonByDetails({ firstName: lead.firstName, lastName: lead.lastName, company: lead.company || undefined, linkedinUrl: lead.linkedinUrl || undefined });
          }
          if (enrichedLead && enrichedLead.email) results.enriched.push(enrichedLead);
          else results.failed.push(`${lead.firstName} ${lead.lastName}`);
        } catch (err) {
          console.error(`[Leads] Failed to enrich ${lead.firstName} ${lead.lastName}:`, err);
          results.failed.push(`${lead.firstName} ${lead.lastName}`);
        }
      }
      
      const updatedQuota = await getOrCreateQuota(userId);
      console.log(`[Leads] Enrichment complete: ${results.enriched.length} found emails, ${results.failed.length} failed`);

      res.json({
        success: true, enriched: results.enriched, enrichedCount: results.enriched.length,
        failedCount: results.failed.length, failed: results.failed,
        quota: { limit: updatedQuota.monthlyLimit, used: updatedQuota.used, remaining: updatedQuota.remaining, resetDate: updatedQuota.resetDate },
        quotaMessage: quotaResult.message,
      });
    } catch (error: any) {
      console.error('[Leads] Enrichment error:', error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid lead data', details: error.errors });
      res.status(500).json({ error: 'Failed to enrich leads' });
    }
  });
}
