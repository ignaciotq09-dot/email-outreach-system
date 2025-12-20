import { db } from "../../../db";
import { users, replyDetectionAnomalies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupPushNotifications, startPollingForUser, stopPollingForUser, isPollingActive } from "../gmail-push-notifications";
import type { UserPushState } from "./types";
import { userPushStates } from "./state";
import { PUSH_FAILURE_THRESHOLD, PUSH_RETRY_INTERVAL_MS } from "./types";

export async function getActiveGmailUsers(): Promise<number[]> {
  const usersWithGmail = await db.select({ userId: users.id }).from(users).where(eq(users.gmailConnected, true));
  return usersWithGmail.map(u => u.userId);
}

export function getUserPushState(userId: number): UserPushState {
  let pushState = userPushStates.get(userId);
  if (!pushState) { pushState = { mode: 'push', pushHealthy: true, consecutivePushFailures: 0 }; userPushStates.set(userId, pushState); }
  return pushState;
}

export function switchToPollingMode(userId: number): void {
  const pushState = getUserPushState(userId);
  if (pushState.mode === 'polling') return;
  console.log(`[BulletproofScheduler] User ${userId}: Switching to 1-minute polling fallback`);
  pushState.mode = 'polling'; pushState.pollingStarted = new Date();
  startPollingForUser(userId);
  db.insert(replyDetectionAnomalies).values({ userId, sentEmailId: 0, contactId: 0, anomalyType: 'layer_fallback', severity: 'medium', provider: 'gmail', details: { description: 'Switched to polling fallback', consecutiveFailures: pushState.consecutivePushFailures }, requiresManualReview: false, status: 'resolved' }).catch(err => console.error('[BulletproofScheduler] Failed to log fallback:', err));
}

export async function tryRestorePushMode(userId: number): Promise<boolean> {
  const pushState = getUserPushState(userId);
  if (pushState.mode === 'push') return true;
  console.log(`[BulletproofScheduler] User ${userId}: Attempting to restore push mode...`);
  try {
    const result = await setupPushNotifications(userId);
    if (result.success) { pushState.mode = 'push'; pushState.pushHealthy = true; pushState.consecutivePushFailures = 0; pushState.lastPushSuccess = new Date(); pushState.pollingStarted = undefined; stopPollingForUser(userId); console.log(`[BulletproofScheduler] User ${userId}: Restored push mode`); return true; }
  } catch (error) { console.error(`[BulletproofScheduler] User ${userId}: Failed to restore push:`, error); }
  return false;
}

export function recordPushFailure(userId: number): void {
  const pushState = getUserPushState(userId); pushState.consecutivePushFailures++; pushState.pushHealthy = false;
  console.log(`[BulletproofScheduler] User ${userId}: Push failure (${pushState.consecutivePushFailures}/${PUSH_FAILURE_THRESHOLD})`);
  if (pushState.consecutivePushFailures >= PUSH_FAILURE_THRESHOLD) switchToPollingMode(userId);
}

export function recordPushSuccess(userId: number): void {
  const pushState = getUserPushState(userId); pushState.consecutivePushFailures = 0; pushState.pushHealthy = true; pushState.lastPushSuccess = new Date();
}

export async function initializePushPollingForUsers(): Promise<void> {
  const userIds = await getActiveGmailUsers();
  for (const userId of userIds) {
    try {
      const result = await setupPushNotifications(userId);
      if (result.success) { console.log(`[BulletproofScheduler] User ${userId}: Push enabled`); recordPushSuccess(userId); } 
      else { console.log(`[BulletproofScheduler] User ${userId}: Starting polling fallback`); switchToPollingMode(userId); }
    } catch (error) { console.error(`[BulletproofScheduler] User ${userId}: Error:`, error); switchToPollingMode(userId); }
  }
}

export async function runPushRetryCheck(): Promise<void> {
  for (const [userId, pushState] of userPushStates.entries()) {
    if (pushState.mode !== 'polling') continue;
    if (pushState.pollingStarted) {
      const pollingDuration = Date.now() - pushState.pollingStarted.getTime();
      if (pollingDuration >= PUSH_RETRY_INTERVAL_MS) await tryRestorePushMode(userId);
    }
  }
}

export function getPushPollingStatus(): { usersInPushMode: number; usersInPollingMode: number; pollingActive: boolean; userStates: Array<{ userId: number; mode: string; failures: number }> } {
  let pushCount = 0, pollingCount = 0;
  const states: Array<{ userId: number; mode: string; failures: number }> = [];
  for (const [userId, state] of userPushStates.entries()) { if (state.mode === 'push') pushCount++; else pollingCount++; states.push({ userId, mode: state.mode, failures: state.consecutivePushFailures }); }
  return { usersInPushMode: pushCount, usersInPollingMode: pollingCount, pollingActive: isPollingActive(), userStates: states };
}
