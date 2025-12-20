import { db } from "../../db";
import { sentSms, campaigns } from "@shared/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";
import type { SmsCampaignMetrics } from "./types";

export async function getCampaignSmsMetrics(userId: number, limit: number = 20): Promise<SmsCampaignMetrics[]> {
  const result = await db.select({ campaignId: sentSms.campaignId, subject: campaigns.subject, smsSent: count(), smsDelivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')`, smsFailed: sql<number>`count(*) filter (where ${sentSms.status} in ('failed', 'undelivered'))` }).from(sentSms).leftJoin(campaigns, eq(sentSms.campaignId, campaigns.id)).where(and(eq(sentSms.userId, userId), sql`${sentSms.campaignId} is not null`)).groupBy(sentSms.campaignId, campaigns.subject).orderBy(desc(count())).limit(limit);
  return result.map(row => { const sent = Number(row.smsSent) || 0; const delivered = Number(row.smsDelivered) || 0; return { campaignId: row.campaignId!, subject: row.subject || 'Untitled', smsSent: sent, smsDelivered: delivered, smsFailed: Number(row.smsFailed) || 0, smsDeliveryRate: sent > 0 ? (delivered / sent) * 100 : 0 }; });
}
