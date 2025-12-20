import { db } from "../db";
import { sentEmails } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { logOpenEvent, logClickEvent } from "./event-logging";

export async function recordEmailOpen(sentEmailId: number, userAgent: string): Promise<void> {
  try {
    const [sentEmail] = await db.select({ id: sentEmails.id, contactId: sentEmails.contactId }).from(sentEmails).where(eq(sentEmails.id, sentEmailId)).limit(1);
    if (!sentEmail) { console.warn(`[Analytics] Sent email ${sentEmailId} not found for open tracking`); return; }

    const campaignContactQuery = await db.execute(sql`SELECT campaign_id FROM campaign_contacts WHERE sent_email_id = ${sentEmailId} LIMIT 1`);
    const campaignId = campaignContactQuery.rows[0]?.campaign_id as number | undefined;

    await logOpenEvent({ sentEmailId, contactId: sentEmail.contactId, campaignId, userAgent });
  } catch (error) { console.error(`[Analytics] Error recording email open:`, error); throw error; }
}

export async function recordLinkClick(sentEmailId: number, userAgent: string, linkUrl?: string): Promise<void> {
  try {
    const [sentEmail] = await db.select({ id: sentEmails.id, contactId: sentEmails.contactId }).from(sentEmails).where(eq(sentEmails.id, sentEmailId)).limit(1);
    if (!sentEmail) { console.warn(`[Analytics] Sent email ${sentEmailId} not found for click tracking`); return; }

    const campaignContactQuery = await db.execute(sql`SELECT campaign_id FROM campaign_contacts WHERE sent_email_id = ${sentEmailId} LIMIT 1`);
    const campaignId = campaignContactQuery.rows[0]?.campaign_id as number | undefined;

    await logClickEvent({ sentEmailId, contactId: sentEmail.contactId, campaignId, linkUrl: linkUrl || "unknown", userAgent });
  } catch (error) { console.error(`[Analytics] Error recording link click:`, error); throw error; }
}
