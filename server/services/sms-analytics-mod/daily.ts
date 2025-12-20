import { db } from "../../db";
import { sentSms } from "@shared/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";
import type { SmsDailyMetrics } from "./types";

export async function getDailyMetrics(userId: number, days: number): Promise<SmsDailyMetrics> {
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const result = await db.select({ date: sql<string>`date_trunc('day', ${sentSms.sentAt})::date`, totalSent: count(), totalDelivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')`, totalFailed: sql<number>`count(*) filter (where ${sentSms.status} in ('failed', 'undelivered'))` }).from(sentSms).where(and(eq(sentSms.userId, userId), gte(sentSms.sentAt, startDate))).groupBy(sql`date_trunc('day', ${sentSms.sentAt})::date`).orderBy(sql`date_trunc('day', ${sentSms.sentAt})::date`);
  return { days, data: result.map(row => ({ date: String(row.date), totalSent: Number(row.totalSent) || 0, totalDelivered: Number(row.totalDelivered) || 0, totalFailed: Number(row.totalFailed) || 0 })) };
}
