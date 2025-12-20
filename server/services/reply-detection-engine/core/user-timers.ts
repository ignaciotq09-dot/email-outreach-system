import { runHourlyReconciliation, runNightlyReconciliation } from "../reconciliation";
import type { DetectionProvider } from "../types";

export interface UserState { provider: DetectionProvider; hourlyTimer: NodeJS.Timeout | null; nightlyTimeout: NodeJS.Timeout | null; }

export function startHourlyReconciliation(userId: number, provider: DetectionProvider, userState: UserState): void {
  userState.hourlyTimer = setInterval(async () => {
    try { console.log(`[ReplyDetectionEngine] Running hourly reconciliation for user ${userId}`); await runHourlyReconciliation(userId, provider); }
    catch (error) { console.error(`[ReplyDetectionEngine] User ${userId} hourly reconciliation error:`, error); }
  }, 60 * 60 * 1000);
  console.log(`[ReplyDetectionEngine] User ${userId}: Hourly reconciliation scheduled`);
}

export function startNightlyReconciliation(userId: number, provider: DetectionProvider, userState: UserState, activeUsers: Map<number, UserState>): void {
  const scheduleNightly = () => {
    const now = new Date(); const nextRun = new Date(); nextRun.setHours(3, 0, 0, 0);
    if (nextRun.getTime() <= now.getTime()) nextRun.setDate(nextRun.getDate() + 1);
    const msUntilRun = nextRun.getTime() - now.getTime();
    console.log(`[ReplyDetectionEngine] User ${userId}: Nightly reconciliation scheduled for ${nextRun.toISOString()}`);
    userState.nightlyTimeout = setTimeout(async () => {
      if (!activeUsers.has(userId)) return;
      try { console.log(`[ReplyDetectionEngine] Running nightly reconciliation for user ${userId}`); await runNightlyReconciliation(userId, provider); }
      catch (error) { console.error(`[ReplyDetectionEngine] User ${userId} nightly reconciliation error:`, error); }
      scheduleNightly();
    }, msUntilRun);
  };
  scheduleNightly();
}

export function clearUserTimers(userState: UserState): void {
  if (userState.hourlyTimer) clearInterval(userState.hourlyTimer);
  if (userState.nightlyTimeout) clearTimeout(userState.nightlyTimeout);
}
