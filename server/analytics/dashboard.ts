import { db } from "../db";
import { sentEmails } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getOverviewMetrics(userId: number) {
  try {
    const [sentCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(sentEmails).where(eq(sentEmails.userId, userId));

    const [openStats] = await db.select({
      totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
      totalOpens: sql<number>`COALESCE(SUM(${sentEmails.openCount}), 0)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.trackingEnabled, true)));

    const [clickStats] = await db.select({
      totalClicked: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.clickCount} > 0 THEN ${sentEmails.id} END)`,
      totalClicks: sql<number>`COALESCE(SUM(${sentEmails.clickCount}), 0)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.trackingEnabled, true)));

    const [replyStats] = await db.select({
      totalReplied: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
    }).from(sentEmails).where(eq(sentEmails.userId, userId));

    const [trackingStats] = await db.select({
      withTracking: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END)`,
      withoutTracking: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = false OR ${sentEmails.trackingEnabled} IS NULL THEN 1 END)`,
    }).from(sentEmails).where(eq(sentEmails.userId, userId));

    const totalSent = sentCount?.count || 0;
    const uniqueOpens = openStats?.totalOpened || 0;
    const totalOpens = openStats?.totalOpens || 0;
    const uniqueClicks = clickStats?.totalClicked || 0;
    const totalClicks = clickStats?.totalClicks || 0;
    const totalReplies = replyStats?.totalReplied || 0;
    const emailsWithTracking = trackingStats?.withTracking || 0;
    const emailsWithoutTracking = trackingStats?.withoutTracking || 0;

    return {
      totalSent, uniqueOpens, totalOpens, uniqueClicks, totalClicks, totalReplies,
      openRate: emailsWithTracking > 0 ? (uniqueOpens / emailsWithTracking) * 100 : 0,
      clickRate: emailsWithTracking > 0 ? (uniqueClicks / emailsWithTracking) * 100 : 0,
      replyRate: totalSent > 0 ? (totalReplies / totalSent) * 100 : 0,
      tracking: { withTracking: emailsWithTracking, withoutTracking: emailsWithoutTracking, trackingCoveragePercent: totalSent > 0 ? (emailsWithTracking / totalSent) * 100 : 0 },
    };
  } catch (error) { console.error('[Analytics] Error fetching overview metrics:', error); throw error; }
}
