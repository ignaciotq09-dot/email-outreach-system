import { db } from "../../db";
import { linkedinMessages } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getBestSendTimes(userId: number) {
  try { const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, ninetyDaysAgo)));
  const totalMessages = Number(countResult.count) || 0;
  if (totalMessages < 20) return { hasEnoughData: false, totalMessages, minimumRequired: 20, heatmapData: [], bestTimes: [], canShowBestTimes: false, averages: { acceptanceRate: 0, replyRate: 0 } };
  const rawData = await db.select({ dayOfWeek: sql<number>`EXTRACT(DOW FROM ${linkedinMessages.sentAt})`, hour: sql<number>`EXTRACT(HOUR FROM ${linkedinMessages.sentAt})`, totalSent: sql<number>`COUNT(*)`, totalAccepted: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'accepted' THEN 1 END)`, totalReplied: sql<number>`COUNT(CASE WHEN ${linkedinMessages.status} = 'replied' THEN 1 END)` }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, ninetyDaysAgo))).groupBy(sql`EXTRACT(DOW FROM ${linkedinMessages.sentAt})`, sql`EXTRACT(HOUR FROM ${linkedinMessages.sentAt})`);
  const heatmapData: Array<{ dayOfWeek: number; hour: number; totalSent: number; totalAccepted: number; totalReplied: number; acceptanceRate: number; replyRate: number; hasEnoughData: boolean; }> = [];
  for (let day = 0; day < 7; day++) { for (let hour = 0; hour < 24; hour++) { const dataPoint = rawData.find(d => Number(d.dayOfWeek) === day && Number(d.hour) === hour); const totalSent = Number(dataPoint?.totalSent || 0); const totalAccepted = Number(dataPoint?.totalAccepted || 0); const totalReplied = Number(dataPoint?.totalReplied || 0); const hasEnoughData = totalSent >= 3; heatmapData.push({ dayOfWeek: day, hour, totalSent, totalAccepted, totalReplied, acceptanceRate: hasEnoughData ? (totalAccepted / totalSent) * 100 : 0, replyRate: hasEnoughData ? (totalReplied / totalSent) * 100 : 0, hasEnoughData }); } }
  const canShowBestTimes = totalMessages >= 50; let bestTimes: Array<{ dayOfWeek: number; hour: number; acceptanceRate: number; replyRate: number; totalSent: number; }> = [];
  if (canShowBestTimes) { const validCells = heatmapData.filter(cell => cell.hasEnoughData && cell.totalSent >= 5).sort((a, b) => (b.acceptanceRate + b.replyRate) - (a.acceptanceRate + a.replyRate)); bestTimes = validCells.slice(0, 3).map(cell => ({ dayOfWeek: cell.dayOfWeek, hour: cell.hour, acceptanceRate: cell.acceptanceRate, replyRate: cell.replyRate, totalSent: cell.totalSent })); }
  const cellsWithData = heatmapData.filter(c => c.hasEnoughData); const avgAcceptanceRate = cellsWithData.length > 0 ? cellsWithData.reduce((sum, c) => sum + c.acceptanceRate, 0) / cellsWithData.length : 0; const avgReplyRate = cellsWithData.length > 0 ? cellsWithData.reduce((sum, c) => sum + c.replyRate, 0) / cellsWithData.length : 0;
  return { hasEnoughData: true, totalMessages, minimumRequired: 20, heatmapData, bestTimes, canShowBestTimes, averages: { acceptanceRate: avgAcceptanceRate, replyRate: avgReplyRate } }; } catch (error) { console.error('[LinkedIn Analytics] Error fetching best send times:', error); throw error; }
}

export async function getWeeklySendPattern(userId: number) {
  try { const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const pattern = await db.select({ dayOfWeek: sql<number>`EXTRACT(DOW FROM ${linkedinMessages.sentAt})`, totalSent: sql<number>`COUNT(*)`, avgSentPerWeek: sql<number>`COUNT(*) / 4.0` }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, fourWeeksAgo))).groupBy(sql`EXTRACT(DOW FROM ${linkedinMessages.sentAt})`).orderBy(sql`EXTRACT(DOW FROM ${linkedinMessages.sentAt})`);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return days.map((name, index) => { const found = pattern.find(p => Number(p.dayOfWeek) === index); return { day: name, dayOfWeek: index, totalSent: Number(found?.totalSent || 0), avgSentPerWeek: Number(found?.avgSentPerWeek || 0) }; }); } catch (error) { console.error('[LinkedIn Analytics] Error getting weekly send pattern:', error); throw error; }
}
