import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { ConnectionStatus } from "./types";

export async function isConnected(userId: number): Promise<boolean> {
  try { const settings = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1); return settings.length > 0 && settings[0].connected === true; }
  catch (error) { console.error('[LinkedIn] Error checking connection status:', error); return false; }
}

export async function getConnectionStatus(userId: number): Promise<ConnectionStatus> {
  try {
    const settings = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1);
    if (settings.length === 0 || !settings[0].connected) { return { connected: false }; }
    const s = settings[0];
    return { connected: true, profileUrl: s.linkedinProfileUrl, displayName: s.displayName, linkedinEmail: s.linkedinEmail, profileImageUrl: s.profileImageUrl, dailyConnectionLimit: s.dailyConnectionLimit ?? 20, dailyMessageLimit: s.dailyMessageLimit ?? 50, connectionsSentToday: s.connectionsSentToday ?? 0, messagesSentToday: s.messagesSentToday ?? 0 };
  } catch (error) { console.error('[LinkedIn] Error getting connection status:', error); return { connected: false }; }
}

export async function checkAndResetDailyLimits(userId: number): Promise<void> {
  const settings = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1);
  if (settings.length === 0) return;
  const lastReset = settings[0].lastLimitReset;
  const now = new Date();
  if (!lastReset || now.toDateString() !== new Date(lastReset).toDateString()) { await db.update(linkedinSettings).set({ connectionsSentToday: 0, messagesSentToday: 0, lastLimitReset: now, updatedAt: now }).where(eq(linkedinSettings.userId, userId)); }
}

export async function canSendConnectionRequest(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  await checkAndResetDailyLimits(userId);
  const settings = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1);
  if (settings.length === 0 || !settings[0].connected) { return { allowed: false, reason: 'LinkedIn not connected' }; }
  const s = settings[0]; const limit = s.dailyConnectionLimit ?? 20; const sent = s.connectionsSentToday ?? 0;
  if (sent >= limit) { return { allowed: false, reason: `Daily connection limit reached (${limit})` }; }
  return { allowed: true };
}

export async function canSendDirectMessage(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  await checkAndResetDailyLimits(userId);
  const settings = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1);
  if (settings.length === 0 || !settings[0].connected) { return { allowed: false, reason: 'LinkedIn not connected' }; }
  const s = settings[0]; const limit = s.dailyMessageLimit ?? 50; const sent = s.messagesSentToday ?? 0;
  if (sent >= limit) { return { allowed: false, reason: `Daily message limit reached (${limit})` }; }
  return { allowed: true };
}
