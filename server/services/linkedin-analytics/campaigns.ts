import { db } from "../../db";
import { linkedinMessages } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getCampaignMetrics(userId: number, limit: number = 20) {
  try { const metrics = await db.select({ campaignId: linkedinMessages.campaignId, totalSent: sql<number>`COUNT(*)`, accepted: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'accepted' THEN 1 END)`, replied: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'replied' THEN 1 END)`, failed: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'failed' THEN 1 END)` }).from(linkedinMessages).where(eq(linkedinMessages.userId, userId)).groupBy(linkedinMessages.campaignId).orderBy(desc(sql`COUNT(*)`)).limit(limit);
  return metrics.map(m => ({ campaignId: m.campaignId, totalSent: Number(m.totalSent) || 0, accepted: Number(m.accepted) || 0, replied: Number(m.replied) || 0, failed: Number(m.failed) || 0, acceptanceRate: Number(m.totalSent) > 0 ? (Number(m.accepted) / Number(m.totalSent)) * 100 : 0, replyRate: Number(m.totalSent) > 0 ? (Number(m.replied) / Number(m.totalSent)) * 100 : 0 })); } catch (error) { console.error('[LinkedIn Analytics] Error getting campaign metrics:', error); throw error; }
}
