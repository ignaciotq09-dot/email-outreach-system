import { db } from "../../../db";
import { gmailHistoryCheckpoint, oauthTokenHealth } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { gmail_v1 } from 'googleapis';

export async function getOrInitializeSyncState(userId: number, gmail: gmail_v1.Gmail): Promise<{ historyId: string; isNew: boolean }> {
  const existing = await db.select().from(gmailHistoryCheckpoint).where(eq(gmailHistoryCheckpoint.userId, userId)).limit(1);
  if (existing.length > 0 && existing[0].lastHistoryId) {
    return { historyId: existing[0].lastHistoryId, isNew: false };
  }
  const profile = await gmail.users.getProfile({ userId: 'me' });
  const historyId = profile.data.historyId || '';
  if (existing.length > 0) {
    await db.update(gmailHistoryCheckpoint).set({ lastHistoryId: historyId, syncStatus: 'active', updatedAt: new Date() }).where(eq(gmailHistoryCheckpoint.userId, userId));
  } else {
    await db.insert(gmailHistoryCheckpoint).values({ userId, lastHistoryId: historyId, syncStatus: 'active', consecutiveErrors: 0 });
  }
  return { historyId, isNew: true };
}

export async function updateSyncState(userId: number, historyId: string, success: boolean, errorMessage?: string): Promise<void> {
  if (success) {
    await db.update(gmailHistoryCheckpoint).set({ lastHistoryId: historyId, lastCheckedAt: new Date(), syncStatus: 'active', consecutiveErrors: 0, errorMessage: null, updatedAt: new Date() }).where(eq(gmailHistoryCheckpoint.userId, userId));
  } else {
    await db.update(gmailHistoryCheckpoint).set({ syncStatus: 'error', errorMessage: errorMessage || 'Unknown error', consecutiveErrors: sql`${gmailHistoryCheckpoint.consecutiveErrors} + 1`, updatedAt: new Date() }).where(eq(gmailHistoryCheckpoint.userId, userId));
  }
}

export async function updateTokenHealth(userId: number, provider: string, success: boolean, errorMessage?: string): Promise<void> {
  const now = new Date();
  if (success) {
    await db.insert(oauthTokenHealth).values({ userId, provider, lastHealthCheck: now, isHealthy: true, lastSuccessfulApiCall: now, consecutiveFailures: 0, needsReconnect: false }).onConflictDoUpdate({ target: [oauthTokenHealth.userId, oauthTokenHealth.provider], set: { lastHealthCheck: now, isHealthy: true, lastSuccessfulApiCall: now, consecutiveFailures: 0, lastFailureReason: null, needsReconnect: false, updatedAt: now } });
  } else {
    const needsReconnect = errorMessage?.includes('invalid_grant') || errorMessage?.includes('Token has been') || errorMessage?.includes('unauthorized');
    await db.insert(oauthTokenHealth).values({ userId, provider, lastHealthCheck: now, isHealthy: false, consecutiveFailures: 1, lastFailureReason: errorMessage, needsReconnect }).onConflictDoUpdate({ target: [oauthTokenHealth.userId, oauthTokenHealth.provider], set: { lastHealthCheck: now, isHealthy: false, consecutiveFailures: sql`${oauthTokenHealth.consecutiveFailures} + 1`, lastFailureReason: errorMessage, needsReconnect, updatedAt: now } });
  }
}

export async function checkTokenHealth(userId: number): Promise<{ isHealthy: boolean; needsReconnect: boolean; consecutiveFailures: number; lastError?: string; expiresAt?: Date }> {
  const health = await db.select().from(oauthTokenHealth).where(and(eq(oauthTokenHealth.userId, userId), eq(oauthTokenHealth.provider, 'gmail'))).limit(1);
  if (health.length === 0) return { isHealthy: true, needsReconnect: false, consecutiveFailures: 0 };
  return { isHealthy: health[0].isHealthy, needsReconnect: health[0].needsReconnect || false, consecutiveFailures: health[0].consecutiveFailures || 0, lastError: health[0].lastFailureReason || undefined };
}

export async function getSyncStatus(userId: number): Promise<{ hasSyncState: boolean; lastSyncAt?: Date; syncStatus?: string; consecutiveErrors?: number; lastError?: string }> {
  const checkpoint = await db.select().from(gmailHistoryCheckpoint).where(eq(gmailHistoryCheckpoint.userId, userId)).limit(1);
  if (checkpoint.length === 0) return { hasSyncState: false };
  return { hasSyncState: true, lastSyncAt: checkpoint[0].lastCheckedAt, syncStatus: checkpoint[0].syncStatus || undefined, consecutiveErrors: checkpoint[0].consecutiveErrors || 0, lastError: checkpoint[0].errorMessage || undefined };
}
