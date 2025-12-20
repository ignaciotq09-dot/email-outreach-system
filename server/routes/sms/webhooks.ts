import { Express } from "express";
import { db } from "../../db";
import { contacts, smsSettings, smsReplies } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { handleTwilioWebhook } from "../../services/twilio-sms";
import { SmsOptOutService, normalizePhone } from "../../services/sms-opt-out";
import { requireAuth } from "./schemas";

export function registerWebhookRoutes(app: Express) {
  app.post("/api/webhooks/twilio/sms-status", async (req, res) => {
    try {
      await handleTwilioWebhook(req.body);
      res.status(200).send("OK");
    } catch (error) {
      console.error("[SMS] Webhook error:", error);
      res.status(500).send("Error processing webhook");
    }
  });

  app.post("/api/webhooks/twilio/sms-incoming", async (req, res) => {
    try {
      const { From, To, Body, MessageSid } = req.body;
      if (!From || !To || !Body) { console.warn("[SMS] Incoming webhook missing required fields"); return res.status(200).send("OK"); }
      const normalizedFrom = normalizePhone(From);
      const normalizedTo = normalizePhone(To);
      const messageText = Body.trim();
      console.log(`[SMS] Incoming message from ${normalizedFrom} to ${normalizedTo}`);
      const [settings] = await db.select().from(smsSettings).where(eq(smsSettings.twilioPhoneNumber, normalizedTo)).limit(1);
      if (!settings) { console.warn(`[SMS] No user found for Twilio number ${normalizedTo}`); return res.status(200).send("OK"); }
      const userId = settings.userId!;
      const [contact] = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.phone, normalizedFrom))).limit(1);
      if (SmsOptOutService.isOptOutKeyword(messageText)) {
        console.log(`[SMS] Processing opt-out from ${normalizedFrom}`);
        await SmsOptOutService.recordOptOut(userId, normalizedFrom, normalizedTo, "webhook", contact?.id);
        if (contact) await db.insert(smsReplies).values({ userId, contactId: contact.id, fromPhone: normalizedFrom, toPhone: normalizedTo, message: messageText, twilioSid: MessageSid, isOptOut: 1 });
        console.log(`[SMS] Opt-out recorded for ${normalizedFrom}`);
      } else if (SmsOptOutService.isResubscribeKeyword(messageText)) {
        console.log(`[SMS] Processing resubscribe from ${normalizedFrom}`);
        await SmsOptOutService.recordResubscribe(userId, normalizedFrom);
        if (contact) await db.insert(smsReplies).values({ userId, contactId: contact.id, fromPhone: normalizedFrom, toPhone: normalizedTo, message: messageText, twilioSid: MessageSid, isOptOut: 0 });
        console.log(`[SMS] Resubscribe recorded for ${normalizedFrom}`);
      } else if (contact) {
        await db.insert(smsReplies).values({ userId, contactId: contact.id, fromPhone: normalizedFrom, toPhone: normalizedTo, message: messageText, twilioSid: MessageSid, isOptOut: 0 });
        await db.update(contacts).set({ totalSmsReplies: (contact.totalSmsReplies || 0) + 1, lastEngagement: new Date() }).where(eq(contacts.id, contact.id));
        console.log(`[SMS] Reply recorded from contact ${contact.id}`);
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("[SMS] Incoming webhook error:", error);
      res.status(200).send("OK");
    }
  });

  app.get("/api/sms/opt-out/check/:phone", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const phone = req.params.phone;
      const result = await SmsOptOutService.checkOptOut(userId, phone);
      res.json(result);
    } catch (error) {
      console.error("[SMS] Error checking opt-out:", error);
      res.status(500).json({ error: "Failed to check opt-out status" });
    }
  });
}
