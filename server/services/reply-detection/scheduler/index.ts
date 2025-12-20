import { performIncrementalSync } from "../gmail-sync";
import { state } from "./state";
import { DELTA_SWEEP_INTERVAL_MS, HEALTH_CHECK_INTERVAL_MS, PUSH_RETRY_INTERVAL_MS, TOKEN_REFRESH_CHECK_INTERVAL_MS } from "./types";
import { initializePushPollingForUsers, runPushRetryCheck, getPushPollingStatus, recordPushFailure, recordPushSuccess } from "./push-state";
import { runDeltaSweep, runNightlyReconciliation, collectMetrics } from "./sweeps";
import { runHealthCheck, runProactiveTokenRefresh } from "./health";

export function startScheduler(): void {
  if (state.isRunning) { console.log('[BulletproofScheduler] Already running'); return; }
  console.log('[BulletproofScheduler] Starting bulletproof reply detection scheduler');
  initializePushPollingForUsers().catch(err => console.error('[BulletproofScheduler] Failed to initialize push/polling:', err));
  const deltaSweepInterval = setInterval(runDeltaSweep, DELTA_SWEEP_INTERVAL_MS);
  state.intervalIds.push(deltaSweepInterval);
  const healthCheckInterval = setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL_MS);
  state.intervalIds.push(healthCheckInterval);
  const pushRetryInterval = setInterval(runPushRetryCheck, PUSH_RETRY_INTERVAL_MS);
  state.intervalIds.push(pushRetryInterval);
  const metricsInterval = setInterval(collectMetrics, 60 * 60 * 1000);
  state.intervalIds.push(metricsInterval);
  const tokenRefreshInterval = setInterval(runProactiveTokenRefresh, TOKEN_REFRESH_CHECK_INTERVAL_MS);
  state.intervalIds.push(tokenRefreshInterval);
  const scheduleNightly = () => { const now = new Date(); const night = new Date(now); night.setHours(3, 0, 0, 0); if (night <= now) night.setDate(night.getDate() + 1); const msUntilNight = night.getTime() - now.getTime(); setTimeout(() => { runNightlyReconciliation(); scheduleNightly(); }, msUntilNight); };
  scheduleNightly();
  state.isRunning = true;
  setTimeout(runDeltaSweep, 10000);
  console.log('[BulletproofScheduler] Started - Tier1: Push/Polling, Tier2: 10min delta, Tier3: 3AM nightly');
}

export function stopScheduler(): void {
  console.log('[BulletproofScheduler] Stopping scheduler');
  for (const intervalId of state.intervalIds) clearInterval(intervalId);
  state.intervalIds = [];
  state.isRunning = false;
}

export function getSchedulerStatus(): { isRunning: boolean; lastDeltaSweep?: Date; lastReconciliation?: Date; lastHealthCheck?: Date } {
  return { isRunning: state.isRunning, lastDeltaSweep: state.lastDeltaSweep, lastReconciliation: state.lastReconciliation, lastHealthCheck: state.lastHealthCheck };
}

export async function triggerDeltaSweep(): Promise<void> { await runDeltaSweep(); }

export async function triggerReconciliationForUser(userId: number): Promise<void> {
  console.log(`[BulletproofScheduler] Triggering manual reconciliation for user ${userId}`);
  const syncResult = await performIncrementalSync(userId);
  if (!syncResult.success) console.error('[BulletproofScheduler] Manual reconciliation failed:', syncResult.errors);
  else console.log(`[BulletproofScheduler] Manual reconciliation complete: ${syncResult.repliesFound} replies found`);
}

export { getPushPollingStatus, recordPushFailure, recordPushSuccess, runDeltaSweep, runNightlyReconciliation, runHealthCheck };

export default { startScheduler, stopScheduler, getSchedulerStatus, triggerDeltaSweep, triggerReconciliationForUser, runDeltaSweep, runNightlyReconciliation, runHealthCheck, getPushPollingStatus, recordPushFailure, recordPushSuccess };
