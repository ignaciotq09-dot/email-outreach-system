import { db } from "../../db";
import { sendTimeAnalytics, contacts } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { inferTimezoneFromLocation } from "./timezone";
import { getUserSendTimeStats } from "./stats";

export async function recordSendTimeEvent(userId: number, contactId: number, sentEmailId: number, sentAt: Date, channel: 'email' | 'sms' = 'email'): Promise<void> {
  const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  const timezone = contact[0]?.timezone || inferTimezoneFromLocation(contact[0]?.location); const industry = contact[0]?.industry || null;
  await db.insert(sendTimeAnalytics).values({ userId, contactId, sentEmailId, channel, dayOfWeek: sentAt.getDay(), hourOfDay: sentAt.getHours(), timezone, industry, sentAt });
  console.log(`[SendTimeOptimizer] Recorded ${channel} send time analytics for contact ${contactId}`);
}

export async function updateSendTimeOutcome(sentEmailId: number, opened: boolean, openedAt?: Date, replied: boolean = false, repliedAt?: Date): Promise<void> {
  const updateData: any = { wasOpened: opened, wasReplied: replied };
  if (openedAt) updateData.openedAt = openedAt;
  if (repliedAt) { updateData.repliedAt = repliedAt; const existing = await db.select({ sentAt: sendTimeAnalytics.sentAt }).from(sendTimeAnalytics).where(eq(sendTimeAnalytics.sentEmailId, sentEmailId)).limit(1); if (existing[0]?.sentAt) { const responseMinutes = Math.round((repliedAt.getTime() - existing[0].sentAt.getTime()) / (1000 * 60)); updateData.responseTimeMinutes = responseMinutes; } }
  await db.update(sendTimeAnalytics).set(updateData).where(eq(sendTimeAnalytics.sentEmailId, sentEmailId));
}

export async function getSendTimeInsights(userId: number): Promise<{ bestDays: { day: string; score: number }[]; bestHours: { hour: string; score: number }[]; avgResponseTime: number | null; totalDataPoints: number; }> {
  const stats = await getUserSendTimeStats(userId);
  if (stats.length === 0) return { bestDays: [], bestHours: [], avgResponseTime: null, totalDataPoints: 0 };
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayScores = dayNames.map((name, index) => { const dayStats = stats.filter(s => s.dayOfWeek === index); const avgScore = dayStats.length > 0 ? dayStats.reduce((sum, s) => sum + s.replyRate, 0) / dayStats.length : 0; return { day: name, score: Math.round(avgScore * 10) / 10 }; });
  const hourScores: { hour: string; score: number }[] = []; for (let h = 6; h <= 20; h++) { const hourStats = stats.filter(s => s.hourOfDay === h); const avgScore = hourStats.length > 0 ? hourStats.reduce((sum, s) => sum + s.replyRate, 0) / hourStats.length : 0; const hourLabel = h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`; hourScores.push({ hour: hourLabel, score: Math.round(avgScore * 10) / 10 }); }
  const responseTimes = await db.select({ avgResponse: sql<number>`avg(${sendTimeAnalytics.responseTimeMinutes})` }).from(sendTimeAnalytics).where(and(eq(sendTimeAnalytics.userId, userId), sql`${sendTimeAnalytics.responseTimeMinutes} is not null`));
  return { bestDays: dayScores.sort((a, b) => b.score - a.score).slice(0, 3), bestHours: hourScores.sort((a, b) => b.score - a.score).slice(0, 5), avgResponseTime: responseTimes[0]?.avgResponse ? Math.round(responseTimes[0].avgResponse) : null, totalDataPoints: stats.reduce((sum, s) => sum + s.totalSent, 0) };
}
