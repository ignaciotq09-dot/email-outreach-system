import { db } from "../../db";
import { linkedinMessages } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getOverviewMetrics(userId: number) {
  try { const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [stats] = await db.select({ totalSent: sql<number>`COUNT(*)`, connectionRequests: sql<number>`COUNT(CASE WHEN ${linkedinMessages.messageType} = 'connection_request' THEN 1 END)`, directMessages: sql<number>`COUNT(CASE WHEN ${linkedinMessages.messageType} != 'connection_request' THEN 1 END)`, accepted: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'accepted' THEN 1 END)`, replied: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'replied' THEN 1 END)`, pending: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} IN ('pending', 'sent') THEN 1 END)`, failed: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'failed' THEN 1 END)` }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, thirtyDaysAgo)));
  const totalSent = Number(stats.totalSent) || 0; const connectionRequests = Number(stats.connectionRequests) || 0; const directMessages = Number(stats.directMessages) || 0; const accepted = Number(stats.accepted) || 0; const replied = Number(stats.replied) || 0; const pending = Number(stats.pending) || 0; const failed = Number(stats.failed) || 0;
  return { totalSent, connectionRequests, directMessages, accepted, replied, pending, failed, acceptanceRate: connectionRequests > 0 ? (accepted / connectionRequests) * 100 : 0, replyRate: totalSent > 0 ? (replied / totalSent) * 100 : 0 }; } catch (error) { console.error('[LinkedIn Analytics] Error getting overview metrics:', error); throw error; }
}
