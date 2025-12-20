import type { Express } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import {
  campaigns,
  campaignContacts,
  contacts,
} from "@shared/schema";
import { personalizeVariantForContact } from "../services/openai";
import { SendSchedulingEngine } from "../send-scheduling-engine";
import { EmailTrackingService } from "../services/email-tracking";
import { requireAuth } from "../auth/middleware";

export function registerCampaignExecutionRoutes(app: Express) {
  // POST /api/campaigns/:id/personalize - Generate personalized preview for a contact (Multi-tenant)
  app.post("/api/campaigns/:id/personalize", requireAuth, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { contactId, variant } = req.body;

      if (!contactId || !variant) {
        return res.status(400).json({ error: 'Contact ID and variant required' });
      }

      // Multi-tenant: Verify contact belongs to this user
      const [contact] = await db
        .select()
        .from(contacts)
        .where(and(
          eq(contacts.id, contactId),
          eq(contacts.userId, userId)
        ))
        .limit(1);

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const preferences = await storage.getEmailPreferences(userId);

      const personalizedEmail = await personalizeVariantForContact(
        variant,
        contact.name,
        contact.company,
        contact.pronoun || "Mr.",
        contact.notes || undefined,
        preferences
      );

      res.json(personalizedEmail);
    } catch (error: any) {
      console.error('Error personalizing email:', error);
      res.status(500).json({ error: error.message || 'Failed to personalize email' });
    }
  });

  // POST /api/campaigns/:id/send - Send campaign emails to all contacts (Multi-tenant)
  app.post("/api/campaigns/:id/send", requireAuth, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.session.userId;

      // Multi-tenant: Verify campaign belongs to this user
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        ))
        .limit(1);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      if (!campaign.subject || !campaign.body) {
        return res.status(400).json({ error: 'Campaign missing subject or body' });
      }

      // Multi-tenant: Filter contacts to only those belonging to this user
      const contactsData = await db
        .select()
        .from(campaignContacts)
        .where(eq(campaignContacts.campaignId, campaignId))
        .leftJoin(contacts, and(
          eq(campaignContacts.contactId, contacts.id),
          eq(contacts.userId, userId)
        ));

      if (contactsData.length === 0) {
        return res.status(400).json({ error: 'No contacts in campaign' });
      }

      const results = [];
      const errors = [];
      const preferences = await storage.getEmailPreferences(userId);

      for (const row of contactsData) {
        const contact = row.contacts;
        const campaignContact = row.campaign_contacts;
        if (!contact) continue;

        try {
          const personalizedEmail = await personalizeVariantForContact(
            { approach: campaign.writingStyle || "professional", subject: campaign.subject, body: campaign.body },
            contact.name,
            contact.company,
            contact.pronoun || "Mr.",
            contact.notes || undefined,
            preferences
          );

          // Use EmailTrackingService for 100% accurate tracking
          const sendResult = await EmailTrackingService.sendTrackedEmail({
            userId,
            contactId: contact.id,
            to: contact.email,
            subject: personalizedEmail.subject,
            body: personalizedEmail.body,
            writingStyle: campaign.writingStyle || undefined,
            campaignId: campaignId,
            campaignContactId: campaignContact?.id,
            provider: 'gmail',
          });

          if (!sendResult.success) {
            throw new Error(sendResult.error || 'Failed to send email');
          }

          results.push({ contact: contact.name, success: true, sentEmailId: sendResult.sentEmailId });
        } catch (error: any) {
          console.error(`Error sending to ${contact.name}:`, error);
          errors.push({ contact: contact.name, error: error.message });
        }
      }

      // Only mark as sent if at least some emails were sent
      if (results.length > 0) {
        await db
          .update(campaigns)
          .set({ status: 'sent' })
          .where(eq(campaigns.id, campaignId));
      }

      // Return proper success/failure status based on actual results
      const allFailed = results.length === 0 && errors.length > 0;
      const partialSuccess = results.length > 0 && errors.length > 0;

      if (allFailed) {
        // All emails failed - return error with details
        return res.status(400).json({
          success: false,
          error: errors[0]?.error || 'All emails failed to send',
          sent: 0,
          failed: errors.length,
          errors
        });
      }

      res.json({
        success: true,
        sent: results.length,
        failed: errors.length,
        partialSuccess,
        results,
        errors
      });
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to send campaign' });
    }
  });

  // POST /api/campaigns/:id/schedule - Schedule a campaign for later (Multi-tenant)
  app.post("/api/campaigns/:id/schedule", requireAuth, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { sendTime, batchSize, enableSpintax } = req.body;

      if (!sendTime) {
        return res.status(400).json({ error: 'Send time is required' });
      }

      // Multi-tenant: Verify campaign belongs to this user
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        ))
        .limit(1);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      await SendSchedulingEngine.scheduleCampaign(campaignId, {
        mode: "scheduled",
        scheduledTime: new Date(sendTime),
        batchSize: batchSize || 30,
        enableSpintax: enableSpintax || false,
      });

      res.json({ success: true, message: 'Campaign scheduled successfully', enableSpintax });
    } catch (error: any) {
      console.error('Error scheduling campaign:', error);
      res.status(500).json({ error: error.message || 'Failed to schedule campaign' });
    }
  });

  // GET /api/campaigns/:id/schedule - Get campaign schedule (Multi-tenant)
  app.get("/api/campaigns/:id/schedule", requireAuth, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.session.userId;

      // Multi-tenant: Verify campaign belongs to this user
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        ))
        .limit(1);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const schedule = await SendSchedulingEngine.getSchedule(campaignId);
      res.json(schedule);
    } catch (error: any) {
      console.error('Error getting campaign schedule:', error);
      res.status(500).json({ error: error.message || 'Failed to get campaign schedule' });
    }
  });

  // POST /api/campaigns/:id/enroll-sequence - Enroll a campaign in a sequence (Multi-tenant)
  app.post("/api/campaigns/:id/enroll-sequence", requireAuth, async (req: any, res) => {
    try {
      const { SequenceAutomationService } = await import("../sequence-automation");
      const { followUpSequences } = await import("@shared/schema");
      const campaignId = parseInt(req.params.id);
      const userId = req.session.userId;
      const sequenceId = parseInt(req.body.sequenceId);

      // Multi-tenant: Verify campaign belongs to this user
      const [campaign] = await db
        .select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.userId, userId)
        ))
        .limit(1);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Multi-tenant: CRITICAL - Verify sequence also belongs to this user
      // Prevents cross-tenant data access via guessed sequence IDs
      const [sequence] = await db
        .select()
        .from(followUpSequences)
        .where(and(
          eq(followUpSequences.id, sequenceId),
          eq(followUpSequences.userId, userId)
        ))
        .limit(1);

      if (!sequence) {
        return res.status(404).json({ error: 'Sequence not found' });
      }

      // Pass userId for defense-in-depth validation in service layer
      await SequenceAutomationService.enrollCampaignInSequence(campaignId, sequenceId, userId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error enrolling campaign in sequence:', error);
      res.status(500).json({ error: 'Failed to enroll campaign in sequence' });
    }
  });
}
