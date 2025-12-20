import { db } from "../../db";
import { sendTimeAnalytics } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import type { TimeSlotStats } from "./types";

export async function getUserSendTimeStats(userId: number): Promise<TimeSlotStats[]> {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const stats = await db.select({ dayOfWeek: sendTimeAnalytics.dayOfWeek, hourOfDay: sendTimeAnalytics.hourOfDay, totalSent: sql<number>`count(*)`, opened: sql<number>`sum(case when ${sendTimeAnalytics.wasOpened} then 1 else 0 end)`, replied: sql<number>`sum(case when ${sendTimeAnalytics.wasReplied} then 1 else 0 end)` }).from(sendTimeAnalytics).where(and(eq(sendTimeAnalytics.userId, userId), gte(sendTimeAnalytics.sentAt, thirtyDaysAgo))).groupBy(sendTimeAnalytics.dayOfWeek, sendTimeAnalytics.hourOfDay);
  return stats.map(s => ({ dayOfWeek: s.dayOfWeek || 0, hourOfDay: s.hourOfDay || 0, totalSent: Number(s.totalSent) || 0, opened: Number(s.opened) || 0, replied: Number(s.replied) || 0, openRate: s.totalSent > 0 ? (Number(s.opened) / Number(s.totalSent)) * 100 : 0, replyRate: s.totalSent > 0 ? (Number(s.replied) / Number(s.totalSent)) * 100 : 0, score: 0 }));
}

export async function getContactEngagementHistory(userId: number, contactId: number): Promise<{ avgResponseHour?: number; preferredDay?: number }> {
  const replies = await db.select({ replyHour: sql<number>`extract(hour from ${sendTimeAnalytics.repliedAt})`, replyDay: sql<number>`extract(dow from ${sendTimeAnalytics.repliedAt})` }).from(sendTimeAnalytics).where(and(eq(sendTimeAnalytics.userId, userId), eq(sendTimeAnalytics.contactId, contactId), eq(sendTimeAnalytics.wasReplied, true)));
  if (replies.length === 0) return {};
  const avgHour = replies.reduce((sum, r) => sum + (Number(r.replyHour) || 0), 0) / replies.length;
  const dayCounts = replies.reduce((acc, r) => { const day = Number(r.replyDay) || 0; acc[day] = (acc[day] || 0) + 1; return acc; }, {} as Record<number, number>);
  const preferredDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return { avgResponseHour: Math.round(avgHour), preferredDay: preferredDay ? parseInt(preferredDay) : undefined };
}
