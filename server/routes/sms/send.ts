import { Express } from "express";
import { z } from "zod";
import { db } from "../../db";
import { contacts, emailPreferences } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sendSms, sendBulkSms } from "../../services/twilio-sms";
import { personalizeSmsForContact } from "../../services/sms-personalization";
import { requireAuth, sendSmsSchema, sendBulkSmsSchema } from "./schemas";

export function registerSendRoutes(app: Express) {
  app.post("/api/sms/send", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { contactId, message, campaignId } = sendSmsSchema.parse(req.body);
      const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId))).limit(1);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      if (!contact.phone) return res.status(400).json({ error: "Contact has no phone number" });
      const result = await sendSms({ userId, contactId, campaignId, toPhone: contact.phone, message });
      if (result.success) res.json({ success: true, smsId: result.smsId, status: result.status });
      else res.status(400).json({ success: false, error: result.error });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request data", details: error.errors });
      console.error("[SMS] Error sending SMS:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  app.post("/api/sms/send-bulk", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { contactIds, message, campaignId, writingStyle } = sendBulkSmsSchema.parse(req.body);
      const contactList = await db.select().from(contacts).where(eq(contacts.userId, userId));
      const validContacts = contactList.filter(c => contactIds.includes(c.id) && c.phone);
      const resultsWithContactId: Array<{ contactId: number; success: boolean; error?: string }> = [];
      const contactsWithoutPhone = contactIds.filter(id => { const c = contactList.find(x => x.id === id); return !c || !c.phone; });
      for (const contactId of contactsWithoutPhone) resultsWithContactId.push({ contactId, success: false, error: "No phone number available" });
      if (validContacts.length > 0) {
        const [prefs] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
        const senderName = prefs?.senderName || undefined;
        const smsList = [];
        for (const contact of validContacts) {
          try {
            const personalizedMessage = await personalizeSmsForContact({ baseMessage: message, contact, senderName, writingStyle });
            smsList.push({ userId, contactId: contact.id, campaignId, toPhone: contact.phone!, message, personalizedMessage });
          } catch (error) {
            console.error(`[SMS] Personalization failed for ${contact.id}:`, error);
            smsList.push({ userId, contactId: contact.id, campaignId, toPhone: contact.phone!, message, personalizedMessage: message });
          }
        }
        const smsResults = await sendBulkSms(smsList, 1000);
        for (let i = 0; i < validContacts.length; i++) resultsWithContactId.push({ contactId: validContacts[i].id, success: smsResults[i].success, error: smsResults[i].error });
      }
      const successful = resultsWithContactId.filter(r => r.success).length;
      const failed = resultsWithContactId.filter(r => !r.success).length;
      const skipped = resultsWithContactId.filter(r => r.error === "No phone number available").length;
      console.log(`[SMS] Bulk: ${successful} successful, ${failed} failed, ${skipped} skipped`);
      const accurateResults = resultsWithContactId.map(r => ({ contactId: r.contactId, success: r.success, error: r.error || null, status: r.success ? 'sent' : (r.error === "No phone number available" ? 'skipped' : 'failed'), recordedAt: new Date().toISOString() }));
      res.json({ summary: { total: resultsWithContactId.length, successful, failed, skipped, timestamp: new Date().toISOString() }, results: accurateResults });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request data", details: error.errors });
      console.error("[SMS] Error sending bulk SMS:", error);
      res.status(500).json({ error: "Failed to send bulk SMS" });
    }
  });
}
