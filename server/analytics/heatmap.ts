import { db } from "../db";
import { sentEmails } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getBestSendTimes(userId: number, timezoneOffset: number = 0) {
  try {
    const validatedOffset = isNaN(timezoneOffset) ? 0 : Math.max(-720, Math.min(840, timezoneOffset));

    const [totalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(sentEmails).where(eq(sentEmails.userId, userId));
    const totalEmails = Number(totalCount?.count || 0);

    if (totalEmails < 20) {
      return { hasEnoughData: false, totalEmails, minimumRequired: 20, heatmapData: [], bestTimes: [], canShowBestTimes: false };
    }

    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const offsetHours = Math.floor(Math.abs(validatedOffset) / 60);
    const offsetMinutes = Math.abs(validatedOffset) % 60;
    const offsetSign = validatedOffset >= 0 ? '+' : '-';
    const intervalStr = `${offsetSign}${offsetHours} hours ${offsetMinutes} minutes`;

    const rawData = await db.select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${sentEmails.sentAt} + interval '${sql.raw(intervalStr)}')`,
      hour: sql<number>`EXTRACT(HOUR FROM ${sentEmails.sentAt} + interval '${sql.raw(intervalStr)}')`,
      totalSent: sql<number>`COUNT(*)`,
      totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
      totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
    }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, ninetyDaysAgo))).groupBy(sql`EXTRACT(DOW FROM ${sentEmails.sentAt} + interval '${sql.raw(intervalStr)}')`, sql`EXTRACT(HOUR FROM ${sentEmails.sentAt} + interval '${sql.raw(intervalStr)}')`);

    const heatmapData: Array<{ dayOfWeek: number; hour: number; totalSent: number; totalOpened: number; totalReplied: number; openRate: number; replyRate: number; hasEnoughData: boolean; }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dataPoint = rawData.find(d => Number(d.dayOfWeek) === day && Number(d.hour) === hour);
        const totalSent = Number(dataPoint?.totalSent || 0);
        const totalOpened = Number(dataPoint?.totalOpened || 0);
        const totalReplied = Number(dataPoint?.totalReplied || 0);
        const hasEnoughData = totalSent >= 3;
        heatmapData.push({ dayOfWeek: day, hour, totalSent, totalOpened, totalReplied, openRate: hasEnoughData ? (totalOpened / totalSent) * 100 : 0, replyRate: hasEnoughData ? (totalReplied / totalSent) * 100 : 0, hasEnoughData });
      }
    }

    const canShowBestTimes = totalEmails >= 50;
    let bestTimes: Array<{ dayOfWeek: number; hour: number; openRate: number; replyRate: number; totalSent: number; }> = [];

    if (canShowBestTimes) {
      const validCells = heatmapData.filter(cell => cell.hasEnoughData && cell.totalSent >= 5).sort((a, b) => b.openRate - a.openRate);
      bestTimes = validCells.slice(0, 3).map(cell => ({ dayOfWeek: cell.dayOfWeek, hour: cell.hour, openRate: cell.openRate, replyRate: cell.replyRate, totalSent: cell.totalSent }));
    }

    const cellsWithData = heatmapData.filter(c => c.hasEnoughData);
    const avgOpenRate = cellsWithData.length > 0 ? cellsWithData.reduce((sum, c) => sum + c.openRate, 0) / cellsWithData.length : 0;
    const avgReplyRate = cellsWithData.length > 0 ? cellsWithData.reduce((sum, c) => sum + c.replyRate, 0) / cellsWithData.length : 0;

    return { hasEnoughData: true, totalEmails, minimumRequired: 20, heatmapData, bestTimes, canShowBestTimes, averages: { openRate: avgOpenRate, replyRate: avgReplyRate } };
  } catch (error) { console.error('[Analytics] Error fetching best send times:', error); throw error; }
}
