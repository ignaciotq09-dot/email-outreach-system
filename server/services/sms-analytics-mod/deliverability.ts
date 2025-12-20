import { db } from "../../db";
import { sentSms } from "@shared/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";
import type { SmsDeliverabilityMetrics } from "./types";

export async function getDeliverabilityMetrics(userId: number): Promise<SmsDeliverabilityMetrics> {
  const [totals] = await db.select({ totalSent: count(), delivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')`, failed: sql<number>`count(*) filter (where ${sentSms.status} in ('failed', 'undelivered'))`, pending: sql<number>`count(*) filter (where ${sentSms.status} in ('pending', 'queued', 'sent'))` }).from(sentSms).where(eq(sentSms.userId, userId));
  const total = Number(totals?.totalSent) || 0; const delivered = Number(totals?.delivered) || 0; const failed = Number(totals?.failed) || 0; const pending = Number(totals?.pending) || 0;
  const errorBreakdown = await db.select({ code: sentSms.errorCode, count: count(), message: sql<string>`max(${sentSms.errorMessage})` }).from(sentSms).where(and(eq(sentSms.userId, userId), sql`${sentSms.errorCode} is not null`)).groupBy(sentSms.errorCode).orderBy(desc(count()));
  return { hasEnoughData: total >= 10, totalSent: total, deliveryRate: total > 0 ? (delivered / total) * 100 : 0, failureRate: total > 0 ? (failed / total) * 100 : 0, pendingRate: total > 0 ? (pending / total) * 100 : 0, errorBreakdown: errorBreakdown.map(row => ({ code: row.code || 'unknown', count: Number(row.count) || 0, message: row.message || 'Unknown error' })) };
}
