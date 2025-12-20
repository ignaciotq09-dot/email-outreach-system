import type { Express } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { contacts, campaignContacts } from "@shared/schema";
import { requireAuth } from "../../auth/middleware";
import { normalizePhone } from "../../services/sms-opt-out";
import { importLeadsSchema } from "./schemas";
import { enforceContactLimit } from "./helpers";

export function registerImportRoutes(app: Express) {
  app.post("/api/leads/import", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { leads } = importLeadsSchema.parse(req.body);
      
      if (leads.length === 0) return res.status(400).json({ error: 'No leads to import' });

      console.log(`[Leads] Importing ${leads.length} lead(s) for user ${userId}`);

      const results = { imported: 0, duplicates: 0, errors: 0, importedContacts: [] as any[], duplicateEmails: [] as string[] };

      for (const lead of leads) {
        try {
          const existing = await db.query.contacts.findFirst({ where: and(eq(contacts.email, lead.email), eq(contacts.userId, userId)) });
          if (existing) { results.duplicates++; results.duplicateEmails.push(lead.email); continue; }

          let normalizedPhone: string | null = null;
          if (lead.phone) {
            try { normalizedPhone = normalizePhone(lead.phone); console.log(`[Leads] Normalized phone ${lead.phone} -> ${normalizedPhone}`); }
            catch (e) { console.log(`[Leads] Could not normalize phone ${lead.phone}, storing as-is`); normalizedPhone = lead.phone; }
          }

          const contactData = {
            userId, name: lead.name, email: lead.email, phone: normalizedPhone,
            company: lead.company || null, position: lead.position || null, location: lead.location || null,
            industry: lead.industry || null, companySize: lead.companySize || null,
            notes: lead.linkedinUrl ? `LinkedIn: ${lead.linkedinUrl}` : null,
            enrichmentSource: 'apollo', source: 'lead_finder',
          };
          
          console.log(`[Leads] Creating contact with source='${contactData.source}' for ${lead.email}, phone=${normalizedPhone || 'none'}`);
          const [newContact] = await db.insert(contacts).values(contactData).returning();
          console.log(`[Leads] Contact created: id=${newContact.id}, source='${newContact.source}', email=${newContact.email}`);
          results.imported++; results.importedContacts.push(newContact);
        } catch (err: any) { console.error(`[Leads] Error importing lead ${lead.email}:`, err); results.errors++; }
      }

      await enforceContactLimit(userId);
      console.log(`[Leads] Import complete: ${results.imported} imported, ${results.duplicates} duplicates, ${results.errors} errors`);
      res.json({ success: true, imported: results.imported, duplicates: results.duplicates, errors: results.errors, duplicateEmails: results.duplicateEmails });
    } catch (error: any) {
      console.error('[Leads] Import error:', error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid lead data', details: error.errors });
      res.status(500).json({ error: 'Failed to import leads' });
    }
  });
}
