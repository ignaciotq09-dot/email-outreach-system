import { db } from "../../db";
import { sentSms, smsReplies } from "@shared/schema";
import { eq, and, sql, gte, count } from "drizzle-orm";
import type { SmsTrendData, SmsResponseTrendData } from "./types";

export async function getEngagementTrends(days: number, userId: number): Promise<SmsTrendData[]> {
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const result = await db.select({ date: sql<string>`date_trunc('day', ${sentSms.sentAt})::date`, sent: count(), delivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')`, failed: sql<number>`count(*) filter (where ${sentSms.status} in ('failed', 'undelivered'))` }).from(sentSms).where(and(eq(sentSms.userId, userId), gte(sentSms.sentAt, startDate))).groupBy(sql`date_trunc('day', ${sentSms.sentAt})::date`).orderBy(sql`date_trunc('day', ${sentSms.sentAt})::date`);
  return result.map(row => ({ date: String(row.date), sent: Number(row.sent) || 0, delivered: Number(row.delivered) || 0, failed: Number(row.failed) || 0 }));
}

export async function getResponseTrends(days: number, userId: number): Promise<SmsResponseTrendData[]> {
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const sentByDay = await db.select({ date: sql<string>`date_trunc('day', ${sentSms.sentAt})::date`, sent: count() }).from(sentSms).where(and(eq(sentSms.userId, userId), gte(sentSms.sentAt, startDate))).groupBy(sql`date_trunc('day', ${sentSms.sentAt})::date`).orderBy(sql`date_trunc('day', ${sentSms.sentAt})::date`);
  const repliesByDay = await db.select({ date: sql<string>`date_trunc('day', ${smsReplies.receivedAt})::date`, replied: count() }).from(smsReplies).where(and(eq(smsReplies.userId, userId), gte(smsReplies.receivedAt, startDate))).groupBy(sql`date_trunc('day', ${smsReplies.receivedAt})::date`);
  const repliesMap = new Map(repliesByDay.map(r => [String(r.date), Number(r.replied) || 0]));
  return sentByDay.map(row => { const date = String(row.date); const sent = Number(row.sent) || 0; const replied = repliesMap.get(date) || 0; return { date, sent, replied, responseRate: sent > 0 ? (replied / sent) * 100 : 0 }; });
}
