import { db } from "../../../db";
import { authProviders, replyDetectionAnomalies } from "@shared/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { checkTokenHealth, getSyncStatus } from "../gmail-sync";
import { getActiveGmailUsers, getUserPushState } from "./push-state";
import { sendDetectionAlert } from "./alerts";
import { state } from "./state";
import { DEAD_MAN_SWITCH_THRESHOLD_MS } from "./types";
import { google } from "googleapis";
import { decryptToken, encryptToken } from "../../../auth/token-encryption";

export async function runHealthCheck(): Promise<void> {
  console.log('[BulletproofScheduler] Running health check');
  const userIds = await getActiveGmailUsers();
  for (const userId of userIds) {
    try {
      const tokenHealth = await checkTokenHealth(userId);
      const syncStatus = await getSyncStatus(userId);
      if (!tokenHealth.isHealthy) {
        console.warn(`[BulletproofScheduler] User ${userId}: Token unhealthy - ${tokenHealth.reason}`);
        if (tokenHealth.reason === 'expired' || tokenHealth.reason === 'missing') {
          await sendDetectionAlert(userId, 'token_expired', { subject: 'Gmail Connection Lost', message: 'Your Gmail connection has expired. Please reconnect your Gmail account to continue receiving reply notifications.', severity: 'critical' });
        }
        await db.insert(replyDetectionAnomalies).values({ userId, sentEmailId: 0, contactId: 0, anomalyType: 'token_unhealthy', severity: 'high', provider: 'gmail', details: { reason: tokenHealth.reason }, requiresManualReview: true, status: 'open' }).catch(() => {});
      }
      if (syncStatus?.lastSyncAt) {
        const syncAge = Date.now() - new Date(syncStatus.lastSyncAt).getTime();
        if (syncAge > DEAD_MAN_SWITCH_THRESHOLD_MS) {
          console.warn(`[BulletproofScheduler] User ${userId}: Sync stale (${Math.round(syncAge / 60000)}min old)`);
          await sendDetectionAlert(userId, 'sync_stale', { subject: 'Reply Detection Delayed', message: `Your reply detection has not synced in over ${Math.round(syncAge / 60000)} minutes. We are automatically retrying.`, severity: 'warning' });
        }
      }
      const pushState = getUserPushState(userId);
      if (pushState.consecutivePushFailures >= 3) {
        await sendDetectionAlert(userId, 'consecutive_failures', { subject: 'Reply Detection Issues', message: 'Your Gmail connection has experienced multiple failures. We are using backup detection, but you may want to reconnect your account.', severity: 'warning' });
      }
    } catch (error: any) { console.error(`[BulletproofScheduler] User ${userId} health check error:`, error); }
  }
  state.lastHealthCheck = new Date();
  console.log('[BulletproofScheduler] Health check complete');
}

export async function runProactiveTokenRefresh(): Promise<void> {
  console.log('[BulletproofScheduler] Running proactive token refresh');
  const now = Date.now();
  const refreshThreshold = 24 * 60 * 60 * 1000;
  const expiringTokens = await db.select().from(authProviders).where(and(eq(authProviders.provider, 'gmail'), isNotNull(authProviders.refreshToken), lt(authProviders.expiresAt, new Date(now + refreshThreshold))));
  let refreshed = 0, errors = 0;
  for (const provider of expiringTokens) {
    try {
      if (!provider.refreshToken) continue;
      const decryptedRefreshToken = decryptToken(provider.refreshToken);
      const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        const updateData: any = { accessToken: encryptToken(credentials.access_token), updatedAt: new Date() };
        if (credentials.refresh_token) updateData.refreshToken = encryptToken(credentials.refresh_token);
        if (credentials.expiry_date) updateData.expiresAt = new Date(credentials.expiry_date);
        await db.update(authProviders).set(updateData).where(eq(authProviders.id, provider.id));
        refreshed++;
        console.log(`[BulletproofScheduler] User ${provider.userId}: Token refreshed proactively`);
      }
    } catch (error: any) {
      errors++;
      console.error(`[BulletproofScheduler] User ${provider.userId}: Proactive refresh error:`, error.message);
      await db.insert(replyDetectionAnomalies).values({ userId: provider.userId, sentEmailId: 0, contactId: 0, anomalyType: 'token_expiry_warning', severity: 'high', provider: 'gmail', details: { description: `Failed to proactively refresh token: ${error.message}` }, requiresManualReview: true, status: 'open' }).catch(() => {});
    }
  }
  console.log(`[BulletproofScheduler] Proactive refresh complete: ${refreshed} refreshed, ${errors} errors`);
}
