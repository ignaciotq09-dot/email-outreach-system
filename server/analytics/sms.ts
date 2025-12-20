import { db } from "../db";
import { sentSms } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getSmsBestSendTimes(userId: number, timezoneOffset: number = 0) {
  try {
    const validatedOffset = isNaN(timezoneOffset) ? 0 : Math.max(-720, Math.min(840, timezoneOffset));

    const [totalCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(sentSms).where(eq(sentSms.userId, userId));
    const totalMessages = Number(totalCount?.count || 0);

    if (totalMessages < 20) {
      return { hasEnoughData: false, totalMessages, minimumRequired: 20, heatmapData: [], bestTimes: [], canShowBestTimes: false };
    }

    const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const offsetHours = Math.floor(Math.abs(validatedOffset) / 60);
    const offsetMinutes = Math.abs(validatedOffset) % 60;
    const offsetSign = validatedOffset >= 0 ? '+' : '-';
    const intervalStr = `${offsetSign}${offsetHours} hours ${offsetMinutes} minutes`;

    const rawData = await db.select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${sentSms.sentAt} + interval '${sql.raw(intervalStr)}')`,
      hour: sql<number>`EXTRACT(HOUR FROM ${sentSms.sentAt} + interval '${sql.raw(intervalStr)}')`,
      totalSent: sql<number>`COUNT(*)`,
      totalDelivered: sql<number>`COUNT(CASE WHEN ${sentSms.status} = 'delivered' THEN 1 END)`,
    }).from(sentSms).where(and(eq(sentSms.userId, userId), gte(sentSms.sentAt, ninetyDaysAgo))).groupBy(sql`EXTRACT(DOW FROM ${sentSms.sentAt} + interval '${sql.raw(intervalStr)}')`, sql`EXTRACT(HOUR FROM ${sentSms.sentAt} + interval '${sql.raw(intervalStr)}')`);

    const heatmapData: Array<{ dayOfWeek: number; hour: number; totalSent: number; totalDelivered: number; deliveryRate: number; hasEnoughData: boolean; }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dataPoint = rawData.find(d => Number(d.dayOfWeek) === day && Number(d.hour) === hour);
        const totalSent = Number(dataPoint?.totalSent || 0);
        const totalDelivered = Number(dataPoint?.totalDelivered || 0);
        const hasEnoughData = totalSent >= 3;
        heatmapData.push({ dayOfWeek: day, hour, totalSent, totalDelivered, deliveryRate: hasEnoughData ? (totalDelivered / totalSent) * 100 : 0, hasEnoughData });
      }
    }

    const canShowBestTimes = totalMessages >= 50;
    let bestTimes: Array<{ dayOfWeek: number; hour: number; deliveryRate: number; totalSent: number; }> = [];

    if (canShowBestTimes) {
      const validCells = heatmapData.filter(cell => cell.hasEnoughData && cell.totalSent >= 5).sort((a, b) => b.deliveryRate - a.deliveryRate);
      bestTimes = validCells.slice(0, 3).map(cell => ({ dayOfWeek: cell.dayOfWeek, hour: cell.hour, deliveryRate: cell.deliveryRate, totalSent: cell.totalSent }));
    }

    const cellsWithData = heatmapData.filter(c => c.hasEnoughData);
    const avgDeliveryRate = cellsWithData.length > 0 ? cellsWithData.reduce((sum, c) => sum + c.deliveryRate, 0) / cellsWithData.length : 0;

    return { hasEnoughData: true, totalMessages, minimumRequired: 20, heatmapData, bestTimes, canShowBestTimes, averages: { deliveryRate: avgDeliveryRate } };
  } catch (error) { console.error('[Analytics] Error fetching SMS best send times:', error); throw error; }
}
