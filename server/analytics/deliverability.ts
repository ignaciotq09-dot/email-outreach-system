import { db } from "../db";
import { sentEmails, emailBounces, spamScores } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getDeliverabilityMetrics(userId: number) {
  try {
    const [totalStats] = await db.select({ totalSent: sql<number>`COUNT(*)` }).from(sentEmails).where(eq(sentEmails.userId, userId));
    const totalSent = Number(totalStats?.totalSent || 0);

    const [bounceStats] = await db.select({
      totalBounces: sql<number>`COUNT(DISTINCT ${emailBounces.sentEmailId})`,
      hardBounces: sql<number>`COUNT(CASE WHEN ${emailBounces.bounceType} = 'hard' THEN 1 END)`,
      softBounces: sql<number>`COUNT(CASE WHEN ${emailBounces.bounceType} = 'soft' THEN 1 END)`,
    }).from(emailBounces).innerJoin(sentEmails, and(eq(emailBounces.sentEmailId, sentEmails.id), eq(sentEmails.userId, userId)));

    const totalBounces = Number(bounceStats?.totalBounces || 0);
    const hardBounces = Number(bounceStats?.hardBounces || 0);
    const softBounces = Number(bounceStats?.softBounces || 0);

    const [spamStats] = await db.select({
      avgScore: sql<number>`AVG(${spamScores.score})`,
      lowRisk: sql<number>`COUNT(CASE WHEN ${spamScores.assessment} = 'low' THEN 1 END)`,
      mediumRisk: sql<number>`COUNT(CASE WHEN ${spamScores.assessment} = 'medium' THEN 1 END)`,
      highRisk: sql<number>`COUNT(CASE WHEN ${spamScores.assessment} = 'high' THEN 1 END)`,
    }).from(spamScores).innerJoin(sentEmails, and(eq(spamScores.sentEmailId, sentEmails.id), eq(sentEmails.userId, userId)));

    const avgSpamScore = Number(spamStats?.avgScore || 0);
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
    const deliveryRate = totalSent > 0 ? ((totalSent - totalBounces) / totalSent) * 100 : 0;

    return {
      totalSent, deliveryRate, bounceRate,
      bounces: { total: totalBounces, hard: hardBounces, soft: softBounces },
      spam: { averageScore: avgSpamScore, lowRisk: Number(spamStats?.lowRisk || 0), mediumRisk: Number(spamStats?.mediumRisk || 0), highRisk: Number(spamStats?.highRisk || 0) },
      hasEnoughData: totalSent >= 10,
    };
  } catch (error) { console.error('[Analytics] Error fetching deliverability metrics:', error); throw error; }
}
