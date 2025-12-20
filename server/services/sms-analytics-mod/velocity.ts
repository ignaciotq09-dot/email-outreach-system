import { db } from "../../db";
import { sentSms } from "@shared/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";
import { getDailyMetrics } from "./daily";

export async function getVelocityMetrics(userId: number, days: number = 7): Promise<{ avgPerDay: number; totalSent: number; trend: 'up' | 'down' | 'stable' }> {
  const dailyMetrics = await getDailyMetrics(userId, days); const data = dailyMetrics.data;
  if (data.length === 0) return { avgPerDay: 0, totalSent: 0, trend: 'stable' };
  const totalSent = data.reduce((sum, d) => sum + d.totalSent, 0); const avgPerDay = totalSent / days; const lastDaySent = data[data.length - 1]?.totalSent || 0;
  const trend = lastDaySent > avgPerDay ? 'up' : lastDaySent < avgPerDay ? 'down' : 'stable';
  return { avgPerDay, totalSent, trend };
}

export async function getWeeklySendPattern(userId: number): Promise<{ weeks: { week: number; weekLabel: string; totalSent: number; totalDelivered: number; deliveryRate: number }[]; averageSentPerWeek: number; trendDirection: 'up' | 'down' | 'stable' }> {
  const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const result = await db.select({ week: sql<number>`extract(week from ${sentSms.sentAt})`, weekStart: sql<string>`date_trunc('week', ${sentSms.sentAt})::date`, totalSent: count(), totalDelivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')` }).from(sentSms).where(and(eq(sentSms.userId, userId), gte(sentSms.sentAt, fourWeeksAgo))).groupBy(sql`extract(week from ${sentSms.sentAt})`, sql`date_trunc('week', ${sentSms.sentAt})::date`).orderBy(sql`date_trunc('week', ${sentSms.sentAt})::date`);
  const weeks = result.map((row, i) => { const sent = Number(row.totalSent) || 0; const delivered = Number(row.totalDelivered) || 0; return { week: Number(row.week), weekLabel: `Week ${i + 1}`, totalSent: sent, totalDelivered: delivered, deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0 }; });
  const totalSent = weeks.reduce((sum, w) => sum + w.totalSent, 0); const averageSentPerWeek = weeks.length > 0 ? Math.round(totalSent / weeks.length) : 0;
  let trendDirection: 'up' | 'down' | 'stable' = 'stable'; if (weeks.length >= 2) { const lastWeek = weeks[weeks.length - 1].totalSent; const previousWeek = weeks[weeks.length - 2].totalSent; if (lastWeek > previousWeek * 1.1) trendDirection = 'up'; else if (lastWeek < previousWeek * 0.9) trendDirection = 'down'; }
  return { weeks, averageSentPerWeek, trendDirection };
}
