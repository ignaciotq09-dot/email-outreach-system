import { db } from "../db";
import { contacts, campaigns, sentEmails, campaignContacts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function updateContactEngagement(contactId: number, eventType: "open" | "click" | "reply"): Promise<void> {
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!contact) return;

  const now = new Date();
  const updates: any = { lastEngagement: now };

  if (eventType === "open") updates.totalOpens = (contact.totalOpens || 0) + 1;
  else if (eventType === "click") updates.totalClicks = (contact.totalClicks || 0) + 1;
  else if (eventType === "reply") updates.totalReplies = (contact.totalReplies || 0) + 1;

  const totalOpens = updates.totalOpens || contact.totalOpens || 0;
  const totalClicks = updates.totalClicks || contact.totalClicks || 0;
  const totalReplies = updates.totalReplies || contact.totalReplies || 0;

  const rawScore = totalOpens * 1 + totalClicks * 2 + totalReplies * 5;
  updates.engagementScore = Math.min(100, rawScore);

  await db.update(contacts).set(updates).where(eq(contacts.id, contactId));
}

export async function updateCampaignMetrics(campaignId: number): Promise<void> {
  const sentEmailStats = await db
    .select({
      totalSent: sql<number>`COUNT(*)`,
      totalOpened: sql<number>`SUM(CASE WHEN ${sentEmails.opened} = true THEN 1 ELSE 0 END)`,
      totalClicked: sql<number>`SUM(CASE WHEN ${sentEmails.clicked} = true THEN 1 ELSE 0 END)`,
      totalReplied: sql<number>`SUM(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 ELSE 0 END)`,
    })
    .from(sentEmails)
    .where(sql`${sentEmails.id} IN (SELECT sent_email_id FROM campaign_contacts WHERE campaign_id = ${campaignId})`);

  const stats = sentEmailStats[0];
  if (!stats) return;

  const totalSent = Number(stats.totalSent) || 0;
  const totalOpened = Number(stats.totalOpened) || 0;
  const totalClicked = Number(stats.totalClicked) || 0;
  const totalReplied = Number(stats.totalReplied) || 0;

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  await db.update(campaigns).set({ totalSent, totalOpened, totalClicked, totalReplied, openRate, clickRate, replyRate }).where(eq(campaigns.id, campaignId));
  console.log(`[Analytics] Campaign ${campaignId} metrics updated: ${openRate}% open, ${clickRate}% click, ${replyRate}% reply`);
}
