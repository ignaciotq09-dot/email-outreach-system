import { Express } from "express";
import { z } from "zod";
import { db } from "../../db";
import { emailPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";
import { personalizeSmsWithVariants, SmsVariant } from "../../services/sms-personalization";
import { requireAuth, personalizePreviewSchema } from "./schemas";

export function registerPersonalizeRoutes(app: Express) {
  app.post("/api/sms/personalize", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { baseMessage, contacts: inputContacts, writingStyleId } = personalizePreviewSchema.parse(req.body);
      console.log(`[SMS] Personalize preview request for ${inputContacts.length} contacts`);
      const [prefs] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
      const senderName = prefs?.senderName || undefined;
      const results: Array<{ contact: { firstName?: string; lastName?: string; company?: string; title?: string }; personalizedMessage: string; success: boolean; charCount: number; variants: SmsVariant[]; timing: { optimalWindow: string; timezone: string | null; localTime: string | null; reason: string }; contactWarmth: 'cold' | 'warm' | 'hot'; error?: string }> = [];
      for (let i = 0; i < inputContacts.length; i++) {
        const inputContact = inputContacts[i];
        const fullName = [inputContact.firstName, inputContact.lastName].filter(Boolean).join(' ') || 'Contact';
        const mockContact = { id: i + 1, userId, name: fullName, email: `contact${i}@example.com`, phone: inputContact.phone || null, company: inputContact.company || null, position: inputContact.title || null, notes: null, pronoun: '', timezone: null, optimalSendTime: null, industry: null, companySize: null, companyRevenue: null, recentNews: null, lastEnriched: null, enrichmentSource: null, location: null, engagementScore: 0, totalOpens: 0, totalClicks: 0, totalReplies: 0, lastEngagement: null, createdAt: new Date(), source: 'manual' as const };
        try {
          const result = await personalizeSmsWithVariants({ baseMessage, contact: mockContact, senderName, writingStyle: writingStyleId });
          results.push({ contact: { firstName: inputContact.firstName, lastName: inputContact.lastName, company: inputContact.company, title: inputContact.title }, personalizedMessage: result.recommended.message, success: true, charCount: result.recommended.charCount, variants: result.variants, timing: result.timing, contactWarmth: result.contactWarmth });
        } catch (error: any) {
          console.error(`[SMS] Personalization failed for contact ${i}:`, error);
          results.push({ contact: { firstName: inputContact.firstName, lastName: inputContact.lastName, company: inputContact.company, title: inputContact.title }, personalizedMessage: baseMessage, success: false, charCount: baseMessage.length, variants: [{ id: 'fallback', hookType: 'direct', message: baseMessage, charCount: baseMessage.length, hookPreview: baseMessage.substring(0, 40) }], timing: { optimalWindow: '10:00 AM - 11:00 AM', timezone: null, localTime: null, reason: 'Default recommendation' }, contactWarmth: 'cold', error: error.message || 'Personalization failed' });
        }
      }
      console.log(`[SMS] Personalize preview complete: ${results.filter(r => r.success).length}/${results.length} successful`);
      res.json({ results });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request data", details: error.errors });
      console.error("[SMS] Error in personalize preview:", error);
      res.status(500).json({ error: "Failed to personalize SMS messages" });
    }
  });
}
