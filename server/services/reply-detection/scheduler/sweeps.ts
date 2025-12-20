import { db } from "../../../db";
import { sentEmails, replyDetectionReconciliationRuns, replyDetectionMetrics, replyDetectionAnomalies } from "@shared/schema";
import { eq, and, isNull, lt, gt, sql } from "drizzle-orm";
import { performIncrementalSync } from "../gmail-sync";
import { getActiveGmailUsers, recordPushFailure } from "./push-state";
import { state } from "./state";

export async function runDeltaSweep(): Promise<{ usersProcessed: number; totalRepliesFound: number; errors: string[] }> {
  console.log('[BulletproofScheduler] Starting delta sweep');
  const result = { usersProcessed: 0, totalRepliesFound: 0, errors: [] as string[] };
  try {
    const userIds = await getActiveGmailUsers();
    for (const userId of userIds) {
      try {
        const syncResult = await performIncrementalSync(userId);
        result.usersProcessed++;
        if (syncResult.success) { result.totalRepliesFound += syncResult.repliesFound; }
        else { result.errors.push(`User ${userId}: ${syncResult.errors.join(', ')}`); recordPushFailure(userId); }
      } catch (error: any) { result.errors.push(`User ${userId}: ${error.message}`); }
    }
    state.lastDeltaSweep = new Date();
    console.log(`[BulletproofScheduler] Delta sweep complete: ${result.usersProcessed} users, ${result.totalRepliesFound} replies`);
  } catch (error: any) { console.error('[BulletproofScheduler] Delta sweep error:', error); result.errors.push(error.message); }
  return result;
}

export async function runNightlyReconciliation(): Promise<void> {
  console.log('[BulletproofScheduler] Starting nightly reconciliation');
  const startTime = Date.now();
  const runId = Date.now().toString();
  const userIds = await getActiveGmailUsers();
  let totalRepliesFound = 0, usersProcessed = 0, errors: string[] = [];
  for (const userId of userIds) {
    try {
      const syncResult = await performIncrementalSync(userId);
      usersProcessed++;
      if (syncResult.success) { totalRepliesFound += syncResult.repliesFound; }
      else { errors.push(`User ${userId}: ${syncResult.errors.join(', ')}`); }
    } catch (error: any) { errors.push(`User ${userId}: ${error.message}`); }
  }
  const orphanedEmails = await db.select({ id: sentEmails.id }).from(sentEmails).where(and(isNull(sentEmails.replyReceived), lt(sentEmails.sentAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))).limit(100);
  state.lastReconciliation = new Date();
  const duration = Date.now() - startTime;
  await db.insert(replyDetectionReconciliationRuns).values({ runId, runType: 'nightly', startedAt: new Date(startTime), completedAt: new Date(), status: errors.length > 0 ? 'completed_with_errors' : 'completed', usersProcessed, emailsRechecked: orphanedEmails.length, repliesFound: totalRepliesFound, discrepancies: 0, errors: errors.length > 0 ? errors : undefined, durationMs: duration }).catch(err => console.error('[BulletproofScheduler] Failed to log reconciliation:', err));
  console.log(`[BulletproofScheduler] Nightly reconciliation complete in ${duration}ms: ${totalRepliesFound} replies, ${orphanedEmails.length} orphans`);
}

export async function collectMetrics(): Promise<void> {
  console.log('[BulletproofScheduler] Collecting metrics');
  const userIds = await getActiveGmailUsers();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  for (const userId of userIds) {
    try {
      const sentCount = await db.select({ count: sql<number>`count(*)` }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gt(sentEmails.sentAt, oneDayAgo)));
      const repliedCount = await db.select({ count: sql<number>`count(*)` }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, true), gt(sentEmails.sentAt, oneDayAgo)));
      await db.insert(replyDetectionMetrics).values({ userId, metricDate: now, provider: 'gmail', pushNotificationsReceived: 0, pollingScansCompleted: 0, deltaSweepsCompleted: 1, repliesDetectedPush: 0, repliesDetectedPolling: 0, repliesDetectedDelta: repliedCount[0]?.count || 0, repliesDetectedNightly: 0, tokenRefreshAttempts: 0, tokenRefreshFailures: 0, avgDetectionLatencyMs: 0 }).catch(err => console.error('[BulletproofScheduler] Failed to insert metrics:', err));
    } catch (error: any) { console.error(`[BulletproofScheduler] User ${userId} metrics error:`, error); }
  }
}
