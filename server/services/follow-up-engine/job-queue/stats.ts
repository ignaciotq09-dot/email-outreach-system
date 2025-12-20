import { db } from "../../../db";
import { followUpJobs } from "@shared/schema";
import { sql } from "drizzle-orm";
import type { JobQueueStats } from "../types";

export async function getQueueStats(): Promise<JobQueueStats> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [stats] = await db.select({ pending: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'pending')`, queued: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'queued')`, sending: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'sending')`, sent: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'sent')`, failed: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'failed')`, dead: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'dead')`, cancelled: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'cancelled')`, totalToday: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.createdAt} >= ${today})`, sentToday: sql<number>`COUNT(*) FILTER (WHERE ${followUpJobs.status} = 'sent' AND ${followUpJobs.completedAt} >= ${today})`, avgProcessingTimeMs: sql<number>`COALESCE(AVG(${followUpJobs.processingTimeMs}) FILTER (WHERE ${followUpJobs.processingTimeMs} IS NOT NULL), 0)` }).from(followUpJobs);
  const successRateToday = stats.totalToday > 0 ? Math.round((Number(stats.sentToday) / Number(stats.totalToday)) * 100) : 0;
  return { pending: Number(stats.pending), queued: Number(stats.queued), sending: Number(stats.sending), sent: Number(stats.sent), failed: Number(stats.failed), dead: Number(stats.dead), cancelled: Number(stats.cancelled), totalToday: Number(stats.totalToday), successRateToday, avgProcessingTimeMs: Math.round(Number(stats.avgProcessingTimeMs)) };
}
