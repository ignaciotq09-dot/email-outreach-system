import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { campaigns, campaignContacts, contacts, sentEmails, scheduledJobs } from "@shared/schema";
import { sendEmail } from "../gmail";
import { personalizeVariantForContact } from "../services/openai";
import { AnalyticsService, embedTrackingPixel, wrapLinksForTracking } from "../analytics";
import { TemplatePerformanceService } from "../template-performance";
import type { Campaign } from "@shared/schema";

export async function executeCampaignBatch(job: any): Promise<void> {
  const campaignId = job.entityId;
  const metadata = job.metadata;
  const campaignContactIds = metadata.campaignContactIds || [];

  console.log(`[SendEngine] Executing batch send for campaign ${campaignId}, ${campaignContactIds.length} recipients`);

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  for (const ccId of campaignContactIds) {
    try {
      await sendToContact(campaign, ccId);
    } catch (error) {
      console.error(`[SendEngine] Error sending to campaign_contact ${ccId}:`, error);
    }
    await sleep(100);
  }

  await AnalyticsService.updateCampaignMetrics(campaignId);
  if (campaign.templateId) await TemplatePerformanceService.updateTemplateMetrics(campaign.templateId);

  console.log(`[SendEngine] Batch send completed for campaign ${campaignId}`);
}

async function sendToContact(campaign: Campaign, campaignContactId: number): Promise<void> {
  const [cc] = await db.select({ id: campaignContacts.id, contactId: campaignContacts.contactId, contact: contacts })
    .from(campaignContacts).innerJoin(contacts, eq(campaignContacts.contactId, contacts.id))
    .where(eq(campaignContacts.id, campaignContactId)).limit(1);

  if (!cc || !cc.contact) throw new Error(`Campaign contact ${campaignContactId} not found`);

  const contact = cc.contact;
  const personalizedEmail = await personalizeVariantForContact(
    { subject: campaign.subject || "", body: campaign.body || "" },
    contact.name, contact.company, contact.pronoun || "", contact.notes || undefined, null
  );

  const [sentEmailRecord] = await db.insert(sentEmails).values({
    contactId: contact.id, subject: personalizedEmail.subject, body: personalizedEmail.body,
    gmailMessageId: null, gmailThreadId: null, writingStyle: campaign.writingStyle,
  }).returning();

  const baseUrl = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000";
  let trackedBody = personalizedEmail.body;
  trackedBody = wrapLinksForTracking(trackedBody, sentEmailRecord.id, baseUrl);
  trackedBody = embedTrackingPixel(trackedBody, sentEmailRecord.id.toString(), baseUrl);

  const result = await sendEmail(campaign.userId, contact.email, personalizedEmail.subject, trackedBody);
  if (!result.messageId) throw new Error(`Failed to send email - no message ID returned`);

  await db.update(sentEmails).set({ gmailMessageId: result.messageId, gmailThreadId: result.threadId, body: trackedBody }).where(eq(sentEmails.id, sentEmailRecord.id));
  await db.update(campaignContacts).set({ sentEmailId: sentEmailRecord.id }).where(eq(campaignContacts.id, campaignContactId));
  await AnalyticsService.logSendEvent({ sentEmailId: sentEmailRecord.id, contactId: contact.id, campaignId: campaign.id, metadata: { batchSend: true } });

  console.log(`[SendEngine] Email sent to ${contact.email} (${contact.name})`);
}

export async function cancelScheduledCampaign(campaignId: number): Promise<void> {
  await db.delete(scheduledJobs).where(and(eq(scheduledJobs.entityId, campaignId), eq(scheduledJobs.entityType, "campaign"), eq(scheduledJobs.status, "pending")));
  await db.update(campaigns).set({ status: "draft", scheduledFor: null }).where(eq(campaigns.id, campaignId));
  console.log(`[SendEngine] Campaign ${campaignId} scheduling cancelled`);
}

export async function getCampaignSchedulePreview(campaignId: number): Promise<{ sendTime: Date; contactIds: number[] }[]> {
  const jobs = await db.select().from(scheduledJobs).where(and(eq(scheduledJobs.entityId, campaignId), eq(scheduledJobs.entityType, "campaign"), eq(scheduledJobs.jobType, "send_campaign_batch")));
  return jobs.map(job => ({ sendTime: job.scheduledFor, contactIds: (job.metadata as any)?.contactIds || [] }));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
