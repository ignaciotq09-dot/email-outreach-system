import { db } from "../../db";
import { sentEmails } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function getTrackingStats(userId: number): Promise<{ totalEmails: number; withTracking: number; withoutTracking: number; opens: number; clicks: number }> {
  const [stats] = await db.select({ totalEmails: sql<number>`COUNT(*)`, withTracking: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END)`, withoutTracking: sql<number>`COUNT(CASE WHEN ${sentEmails.trackingEnabled} = false OR ${sentEmails.trackingEnabled} IS NULL THEN 1 END)`, opens: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`, clicks: sql<number>`COUNT(CASE WHEN ${sentEmails.clickCount} > 0 THEN 1 END)` }).from(sentEmails).where(eq(sentEmails.userId, userId));
  return { totalEmails: stats?.totalEmails || 0, withTracking: stats?.withTracking || 0, withoutTracking: stats?.withoutTracking || 0, opens: stats?.opens || 0, clicks: stats?.clicks || 0 };
}
