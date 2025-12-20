import { db } from "../db";
import { sentEmails } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getDailyMetrics(userId: number, days: number = 7) {
  try {
    const now = new Date();
    const startDate = new Date(now); startDate.setDate(startDate.getDate() - days);

    const dailyData = await db.select({
      date: sql<string>`DATE(${sentEmails.sentAt})`,
      totalSent: sql<number>`COUNT(*)`,
      totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, startDate))).groupBy(sql`DATE(${sentEmails.sentAt})`).orderBy(sql`DATE(${sentEmails.sentAt})`);

    const filledData: Array<{ date: string; totalSent: number; totalOpened: number; totalReplied: number; openRate: number; replyRate: number; }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now); date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existingData = dailyData.find(d => d.date === dateStr);
      const totalSent = Number(existingData?.totalSent || 0);
      const totalOpened = Number(existingData?.totalOpened || 0);
      const totalReplied = Number(existingData?.totalReplied || 0);
      filledData.push({ date: dateStr, totalSent, totalOpened, totalReplied, openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0, replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0 });
    }

    return { days, data: filledData };
  } catch (error) { console.error('[Analytics] Error fetching daily metrics:', error); throw error; }
}

export async function getWeeklySendPattern(userId: number) {
  try {
    const now = new Date();
    const fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyData = await db.select({
      weekStart: sql<string>`DATE_TRUNC('week', ${sentEmails.sentAt})`,
      totalSent: sql<number>`COUNT(*)`,
      totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, fourWeeksAgo))).groupBy(sql`DATE_TRUNC('week', ${sentEmails.sentAt})`).orderBy(sql`DATE_TRUNC('week', ${sentEmails.sentAt})`);

    const weeks = weeklyData.map((week, index) => {
      const totalSent = Number(week.totalSent) || 0;
      const totalOpened = Number(week.totalOpened) || 0;
      const totalReplied = Number(week.totalReplied) || 0;
      return { week: index + 1, weekLabel: `Week ${index + 1}`, weekStart: week.weekStart, totalSent, totalOpened, totalReplied, openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0, replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0 };
    });

    const avgSent = weeks.length > 0 ? weeks.reduce((sum, w) => sum + w.totalSent, 0) / weeks.length : 0;
    const lastWeekSent = weeks.length > 0 ? weeks[weeks.length - 1].totalSent : 0;
    const trendDirection = lastWeekSent > avgSent ? 'up' : lastWeekSent < avgSent ? 'down' : 'stable';

    return { weeks, averageSentPerWeek: Math.round(avgSent), trendDirection, totalWeeks: weeks.length };
  } catch (error) { console.error('[Analytics] Error fetching weekly send pattern:', error); throw error; }
}

export async function getTrendComparison(userId: number, days: 7 | 30 = 7) {
  try {
    const now = new Date();
    const currentPeriodStart = new Date(now); currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    const previousPeriodStart = new Date(currentPeriodStart); previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    const previousPeriodEnd = new Date(currentPeriodStart);

    const [currentMetrics] = await db.select({
      totalSent: sql<number>`COUNT(*)`,
      totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
      trackedEmails: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END)`,
      trackedOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true AND ${sentEmails.trackingEnabled} = true THEN 1 END)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, currentPeriodStart)));

    const [previousMetrics] = await db.select({
      totalSent: sql<number>`COUNT(*)`,
      trackedEmails: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END)`,
      trackedOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true AND ${sentEmails.trackingEnabled} = true THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, previousPeriodStart), sql`${sentEmails.sentAt} < ${previousPeriodEnd}`));

    const currentTotalSent = Number(currentMetrics?.totalSent || 0);
    const currentTracked = Number(currentMetrics?.trackedEmails || 0);
    const currentTrackedOpened = Number(currentMetrics?.trackedOpened || 0);
    const currentReplied = Number(currentMetrics?.totalReplied || 0);
    const currentOpenRate = currentTracked > 0 ? (currentTrackedOpened / currentTracked) * 100 : 0;
    const currentReplyRate = currentTotalSent > 0 ? (currentReplied / currentTotalSent) * 100 : 0;

    const previousTotalSent = Number(previousMetrics?.totalSent || 0);
    const previousTracked = Number(previousMetrics?.trackedEmails || 0);
    const previousTrackedOpened = Number(previousMetrics?.trackedOpened || 0);
    const previousReplied = Number(previousMetrics?.totalReplied || 0);
    const previousOpenRate = previousTracked > 0 ? (previousTrackedOpened / previousTracked) * 100 : 0;
    const previousReplyRate = previousTotalSent > 0 ? (previousReplied / previousTotalSent) * 100 : 0;

    const sentDelta = currentTotalSent - previousTotalSent;
    const sentPercentChange = previousTotalSent > 0 ? ((currentTotalSent - previousTotalSent) / previousTotalSent) * 100 : currentTotalSent > 0 ? 100 : 0;

    return {
      period: days, periodLabel: days === 7 ? 'week' : 'month',
      currentPeriod: { startDate: currentPeriodStart.toISOString(), endDate: now.toISOString(), totalSent: currentTotalSent, totalOpened: currentTrackedOpened, totalReplied: currentReplied, openRate: currentOpenRate, replyRate: currentReplyRate },
      previousPeriod: { startDate: previousPeriodStart.toISOString(), endDate: previousPeriodEnd.toISOString(), totalSent: previousTotalSent, totalOpened: previousTrackedOpened, totalReplied: previousReplied, openRate: previousOpenRate, replyRate: previousReplyRate },
      deltas: { openRate: currentOpenRate - previousOpenRate, replyRate: currentReplyRate - previousReplyRate, sent: sentDelta, sentPercentChange },
      hasPreviousPeriodData: previousTotalSent > 0,
    };
  } catch (error) { console.error('[Analytics] Error fetching trend comparison:', error); throw error; }
}
