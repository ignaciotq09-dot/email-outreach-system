import { db } from "../db";
import { analyticsEvents, sentEmails } from "@shared/schema";
import { eq } from "drizzle-orm";
import { updateContactEngagement, updateCampaignMetrics } from "./engagement";

export async function logSendEvent(data: { sentEmailId: number; contactId: number; campaignId?: number; metadata?: any; }): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: "send",
    sentEmailId: data.sentEmailId,
    contactId: data.contactId,
    campaignId: data.campaignId,
    metadata: data.metadata,
  });

  if (data.campaignId) {
    await updateCampaignMetrics(data.campaignId);
  }

  console.log(`[Analytics] Send event logged for email ${data.sentEmailId}`);
}

export async function logOpenEvent(data: { sentEmailId: number; contactId: number; campaignId?: number; userAgent?: string; ipAddress?: string; metadata?: any; }): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: "open",
    sentEmailId: data.sentEmailId,
    contactId: data.contactId,
    campaignId: data.campaignId,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    metadata: data.metadata,
  });

  const [sentEmail] = await db.select().from(sentEmails).where(eq(sentEmails.id, data.sentEmailId)).limit(1);
  if (sentEmail) {
    const isFirstOpen = !sentEmail.opened;
    const now = new Date();
    await db.update(sentEmails).set({ opened: true, firstOpenedAt: isFirstOpen ? now : sentEmail.firstOpenedAt, openCount: (sentEmail.openCount || 0) + 1, lastOpenedAt: now }).where(eq(sentEmails.id, data.sentEmailId));
    await updateContactEngagement(data.contactId, "open");
    if (data.campaignId) await updateCampaignMetrics(data.campaignId);
  }
  console.log(`[Analytics] Open event logged for email ${data.sentEmailId}`);
}

export async function logClickEvent(data: { sentEmailId: number; contactId: number; campaignId?: number; linkUrl: string; userAgent?: string; ipAddress?: string; metadata?: any; }): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: "click",
    sentEmailId: data.sentEmailId,
    contactId: data.contactId,
    campaignId: data.campaignId,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    metadata: { ...data.metadata, linkUrl: data.linkUrl },
  });

  const [sentEmail] = await db.select().from(sentEmails).where(eq(sentEmails.id, data.sentEmailId)).limit(1);
  if (sentEmail) {
    const now = new Date();
    await db.update(sentEmails).set({ clicked: true, clickCount: (sentEmail.clickCount || 0) + 1, lastClickedAt: now }).where(eq(sentEmails.id, data.sentEmailId));
    await updateContactEngagement(data.contactId, "click");
    if (data.campaignId) await updateCampaignMetrics(data.campaignId);
  }
  console.log(`[Analytics] Click event logged for email ${data.sentEmailId}, link: ${data.linkUrl}`);
}

export async function logReplyEvent(data: { sentEmailId: number; contactId: number; campaignId?: number; metadata?: any; }): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: "reply",
    sentEmailId: data.sentEmailId,
    contactId: data.contactId,
    campaignId: data.campaignId,
    metadata: data.metadata,
  });
  await updateContactEngagement(data.contactId, "reply");
  if (data.campaignId) await updateCampaignMetrics(data.campaignId);
  console.log(`[Analytics] Reply event logged for email ${data.sentEmailId}`);
}

export async function logBounceEvent(data: { sentEmailId: number; contactId: number; campaignId?: number; bounceType: string; metadata?: any; }): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: "bounce",
    sentEmailId: data.sentEmailId,
    contactId: data.contactId,
    campaignId: data.campaignId,
    metadata: { ...data.metadata, bounceType: data.bounceType },
  });
  console.log(`[Analytics] Bounce event logged for email ${data.sentEmailId}, type: ${data.bounceType}`);
}
