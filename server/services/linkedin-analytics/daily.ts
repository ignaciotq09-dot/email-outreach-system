import { db } from "../../db";
import { linkedinMessages } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getDailyMetrics(userId: number, days: number = 7) {
  try { const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const metrics = await db.select({ date: sql<string>`DATE(${linkedinMessages.sentAt})`, sent: sql<number>`COUNT(*)`, accepted: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'accepted' THEN 1 END)`, replied: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'replied' THEN 1 END)` }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, startDate))).groupBy(sql`DATE(${linkedinMessages.sentAt})`).orderBy(sql`DATE(${linkedinMessages.sentAt})`);
  return metrics.map(m => ({ date: m.date, sent: Number(m.sent) || 0, accepted: Number(m.accepted) || 0, replied: Number(m.replied) || 0 })); } catch (error) { console.error('[LinkedIn Analytics] Error getting daily metrics:', error); throw error; }
}
