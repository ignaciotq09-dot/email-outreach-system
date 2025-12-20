import type { SchedulerState } from "./types";
import { POLLING_INTERVAL_MS, JITTER_MS } from "./constants";
import { getActiveAutoReplyUsers } from "./queries";
import { processUserReplies } from "./processor";

const state: SchedulerState = { isRunning: false };

function getJitteredInterval(): number { return POLLING_INTERVAL_MS + Math.random() * JITTER_MS; }

async function runScheduledCheck(): Promise<void> {
  console.log('[AutoReplyScheduler] Starting scheduled auto-reply check');
  const startTime = Date.now(); const totalResult = { usersProcessed: 0, totalProcessed: 0, totalAutoRepliesSent: 0, totalFlaggedForReview: 0, totalRetried: 0, totalEscalated: 0, totalErrors: 0 };
  try {
    const activeUsers = await getActiveAutoReplyUsers(); if (activeUsers.length === 0) { console.log('[AutoReplyScheduler] No users with auto-reply enabled'); return; }
    console.log(`[AutoReplyScheduler] Found ${activeUsers.length} users with auto-reply enabled`);
    for (const userId of activeUsers) { const userResult = await processUserReplies(userId); totalResult.usersProcessed++; totalResult.totalProcessed += userResult.processed; totalResult.totalAutoRepliesSent += userResult.autoRepliesSent; totalResult.totalFlaggedForReview += userResult.flaggedForReview; totalResult.totalRetried += userResult.retried; totalResult.totalEscalated += userResult.escalated; totalResult.totalErrors += userResult.errors; }
    const duration = Date.now() - startTime;
    console.log(`[AutoReplyScheduler] Check complete in ${duration}ms: ${totalResult.usersProcessed} users, ${totalResult.totalProcessed} processed, ${totalResult.totalAutoRepliesSent} sent, ${totalResult.totalFlaggedForReview} flagged, ${totalResult.totalRetried} retried, ${totalResult.totalEscalated} escalated, ${totalResult.totalErrors} errors`);
  } catch (error: any) { console.error('[AutoReplyScheduler] Scheduled check failed:', error.message); }
  state.lastRun = new Date();
}

export function startAutoReplyScheduler(): void {
  if (state.isRunning) { console.log('[AutoReplyScheduler] Already running'); return; }
  state.isRunning = true;
  console.log(`[AutoReplyScheduler] Starting with interval: ${POLLING_INTERVAL_MS / 1000 / 60} minutes (+ up to ${JITTER_MS / 1000 / 60} min jitter)`);
  runScheduledCheck();
  const scheduleNext = () => { if (!state.isRunning) return; const interval = getJitteredInterval(); state.intervalId = setTimeout(async () => { await runScheduledCheck(); scheduleNext(); }, interval); };
  scheduleNext();
}

export function stopAutoReplyScheduler(): void { if (!state.isRunning) { console.log('[AutoReplyScheduler] Not running'); return; } state.isRunning = false; if (state.intervalId) { clearTimeout(state.intervalId); state.intervalId = undefined; } console.log('[AutoReplyScheduler] Stopped'); }
export function getSchedulerStatus(): { isRunning: boolean; lastRun?: Date } { return { isRunning: state.isRunning, lastRun: state.lastRun }; }
export async function triggerManualCheck(): Promise<void> { console.log('[AutoReplyScheduler] Manual check triggered'); await runScheduledCheck(); }
