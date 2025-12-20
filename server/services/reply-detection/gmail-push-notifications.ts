/**
 * Gmail Push Notifications via Pub/Sub
 * 
 * Provides near real-time reply detection by:
 * 1. Subscribing to Gmail inbox changes via watch API
 * 2. Receiving push notifications when new messages arrive
 * 3. Triggering immediate incremental sync on notification
 * 
 * Note: This requires Google Cloud Pub/Sub setup
 * For simpler deployment, we also support webhook-based notifications
 */

import { db } from "../../db";
import { gmailHistoryCheckpoint } from "@shared/schema";
import { eq } from "drizzle-orm";
import { performIncrementalSync } from "./gmail-sync";
import { getUncachableGmailClient } from "../../gmail";
import { storage } from "../../storage";

const WATCH_RENEWAL_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (watches expire after 7)

interface WatchResponse {
  historyId: string;
  expiration: string;
}

interface PushNotificationPayload {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

interface DecodedPushData {
  emailAddress: string;
  historyId: number;
}

let watchRenewalTimer: NodeJS.Timeout | null = null;
const activeWatches = new Map<number, { expiration: Date; historyId: string }>();

/**
 * Set up Gmail push notifications for a user
 * Requires Google Cloud Pub/Sub project configuration
 */
export async function setupPushNotifications(
  userId: number,
  topicName?: string
): Promise<{ success: boolean; expiration?: Date; error?: string }> {
  try {
    const tokens = await storage.getOAuthTokens(userId, 'gmail');
    if (!tokens?.accessToken) {
      return { success: false, error: "No Gmail tokens found" };
    }
    
    const gmail = await getUncachableGmailClient(userId);
    if (!gmail) {
      return { success: false, error: "Failed to create Gmail client" };
    }
    
    // Default topic for development - in production, use a real Pub/Sub topic
    const topic = topicName || `projects/replit-project/topics/gmail-notifications-${userId}`;
    
    // Note: In production, you'd need to:
    // 1. Create a Pub/Sub topic: gcloud pubsub topics create gmail-notifications
    // 2. Grant Gmail permission: Grant gmail-api-push@system.gserviceaccount.com publish rights
    // 3. Create a push subscription pointing to your webhook URL
    
    console.log(`[GmailPush] Setting up watch for user ${userId}...`);
    
    try {
      // Try to set up watch - this may fail if Pub/Sub isn't configured
      const watchResponse = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: topic,
          labelIds: ['INBOX'],
        },
      });
      
      const expiration = new Date(parseInt(watchResponse.data.expiration || '0'));
      const historyId = watchResponse.data.historyId || '';
      
      // Store watch info
      activeWatches.set(userId, { expiration, historyId });
      
      // Update sync state with the new history ID
      await db.update(gmailHistoryCheckpoint)
        .set({ 
          historyId,
          lastSyncAt: new Date(),
          syncMethod: 'push_watch'
        })
        .where(eq(gmailHistoryCheckpoint.userId, userId));
      
      console.log(`[GmailPush] Watch established for user ${userId}, expires: ${expiration.toISOString()}`);
      
      return { success: true, expiration };
    } catch (watchError: any) {
      // If Pub/Sub isn't set up, that's okay - we fall back to polling
      if (watchError.code === 400 || watchError.code === 404) {
        console.log("[GmailPush] Pub/Sub not configured, using polling mode");
        return { 
          success: false, 
          error: "Pub/Sub not configured - using polling mode instead" 
        };
      }
      throw watchError;
    }
  } catch (error: any) {
    console.error("[GmailPush] Setup failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop push notifications for a user
 */
export async function stopPushNotifications(userId: number): Promise<void> {
  try {
    const gmail = await getUncachableGmailClient(userId);
    if (!gmail) return;
    
    await gmail.users.stop({ userId: 'me' });
    activeWatches.delete(userId);
    
    console.log(`[GmailPush] Watch stopped for user ${userId}`);
  } catch (error: any) {
    console.error("[GmailPush] Failed to stop watch:", error);
  }
}

/**
 * Handle incoming push notification from Gmail via Pub/Sub
 * This is called by the webhook endpoint
 */
export async function handlePushNotification(
  payload: PushNotificationPayload
): Promise<{ processed: boolean; userId?: number; repliesFound?: number }> {
  try {
    // Decode the base64 data
    const dataBuffer = Buffer.from(payload.message.data, 'base64');
    const data: DecodedPushData = JSON.parse(dataBuffer.toString());
    
    console.log(`[GmailPush] Received notification for ${data.emailAddress}, historyId: ${data.historyId}`);
    
    // Find the user by email
    const foundUsers = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.email, data.emailAddress),
    });
    
    if (!foundUsers.length) {
      console.log(`[GmailPush] No user found for email ${data.emailAddress}`);
      return { processed: false };
    }
    
    const userId = foundUsers[0].id;
    
    // Perform incremental sync
    const syncResult = await performIncrementalSync(userId);
    
    console.log(`[GmailPush] Push notification processed for user ${userId}: ${syncResult.repliesFound} replies found`);
    
    return { 
      processed: true, 
      userId, 
      repliesFound: syncResult.repliesFound 
    };
  } catch (error: any) {
    console.error("[GmailPush] Failed to handle notification:", error);
    return { processed: false };
  }
}

/**
 * Start automatic watch renewal for all active users
 */
export function startWatchRenewal(): void {
  if (watchRenewalTimer) return;
  
  // Check watches every hour and renew if expiring soon
  watchRenewalTimer = setInterval(async () => {
    const now = new Date();
    const renewThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day before expiry
    
    activeWatches.forEach(async (watch, userId) => {
      if (watch.expiration <= renewThreshold) {
        console.log(`[GmailPush] Renewing watch for user ${userId}...`);
        await setupPushNotifications(userId);
      }
    });
  }, 60 * 60 * 1000); // Every hour
  
  console.log("[GmailPush] Watch renewal service started");
}

/**
 * Stop watch renewal service
 */
export function stopWatchRenewal(): void {
  if (watchRenewalTimer) {
    clearInterval(watchRenewalTimer);
    watchRenewalTimer = null;
  }
}

/**
 * Get the status of push notifications
 */
export function getPushStatus(): {
  watchRenewalActive: boolean;
  activeWatchCount: number;
  watches: Array<{ userId: number; expiration: Date; historyId: string }>;
} {
  return {
    watchRenewalActive: watchRenewalTimer !== null,
    activeWatchCount: activeWatches.size,
    watches: Array.from(activeWatches.entries()).map(([userId, watch]) => ({
      userId,
      expiration: watch.expiration,
      historyId: watch.historyId,
    })),
  };
}

/**
 * Alternative: Polling-based push simulation for environments without Pub/Sub
 * This runs frequent syncs (every 1 minute) to approximate real-time detection
 */
let pollingTimer: NodeJS.Timeout | null = null;
const pollingUsers = new Set<number>();

export function startPollingForUser(userId: number): void {
  pollingUsers.add(userId);
  
  if (!pollingTimer) {
    pollingTimer = setInterval(async () => {
      const usersToProcess = Array.from(pollingUsers);
      for (const uid of usersToProcess) {
        try {
          const result = await performIncrementalSync(uid);
          if (result.repliesFound > 0) {
            console.log(`[GmailPush/Poll] User ${uid}: Found ${result.repliesFound} new replies`);
          }
        } catch (error) {
          console.error(`[GmailPush/Poll] Error for user ${uid}:`, error);
        }
      }
    }, 60 * 1000); // Every 1 minute - aggressive polling for near real-time
    
    console.log("[GmailPush/Poll] Started polling mode (1 minute interval)");
  }
}

export function stopPollingForUser(userId: number): void {
  pollingUsers.delete(userId);
  
  if (pollingUsers.size === 0 && pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log("[GmailPush/Poll] Stopped polling mode (no active users)");
  }
}

export function isPollingActive(): boolean {
  return pollingTimer !== null;
}

export function getPollingUserCount(): number {
  return pollingUsers.size;
}
