import { db } from "../../db";
import { sentEmails, campaignContacts } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { TrackingConfig, TrackingResult } from "./types";
import { getTrackingBaseUrl } from "./url-utils";
import { embedTrackingPixel, wrapLinksForTracking } from "./pixel-embed";

export async function prepareTrackedEmail(config: TrackingConfig): Promise<TrackingResult> {
  try {
    const { url: baseUrl, valid } = getTrackingBaseUrl();
    const now = new Date();
    const [sentEmail] = await db.insert(sentEmails).values({ userId: config.userId, contactId: config.contactId, campaignId: config.campaignId, subject: config.subject, body: config.body, writingStyle: config.writingStyle, status: 'pending', trackingEnabled: valid, sentAt: now }).returning();
    if (config.campaignContactId) { await db.update(campaignContacts).set({ sentAt: now, sentEmailId: sentEmail.id, status: 'sent' }).where(eq(campaignContacts.id, config.campaignContactId)); }
    let trackedBody = config.body;
    if (valid) {
      trackedBody = embedTrackingPixel(trackedBody, sentEmail.id, baseUrl);
      trackedBody = wrapLinksForTracking(trackedBody, sentEmail.id, baseUrl);
    }
    return { success: true, sentEmailId: sentEmail.id, trackedBody, trackingEnabled: valid };
  } catch (error: any) { console.error('[EmailTracking] Error preparing tracked email:', error); return { success: false, sentEmailId: 0, trackedBody: config.body, trackingEnabled: false, error: error.message }; }
}

export async function finalizeTracking(sentEmailId: number, messageId: string, threadId: string): Promise<void> {
  await db.update(sentEmails).set({ messageId, threadId, status: 'sent', sentAt: new Date() }).where(eq(sentEmails.id, sentEmailId));
  console.log(`[EmailTracking] Finalized tracking for email ${sentEmailId}: messageId=${messageId}, threadId=${threadId}`);
}

export async function markTrackingFailed(sentEmailId: number, error: string): Promise<void> {
  await db.update(sentEmails).set({ status: 'failed', error }).where(eq(sentEmails.id, sentEmailId));
  console.error(`[EmailTracking] Marked email ${sentEmailId} as failed: ${error}`);
}
