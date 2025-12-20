import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function connectAccount(userId: number, data: { linkedinProfileUrl: string; accessToken?: string; refreshToken?: string; tokenExpiresAt?: Date; linkedinUserId?: string; linkedinEmail?: string; displayName?: string; profileImageUrl?: string }): Promise<boolean> {
  try {
    const existing = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId)).limit(1);
    const now = new Date();
    if (existing.length > 0) { await db.update(linkedinSettings).set({ linkedinProfileUrl: data.linkedinProfileUrl, accessToken: data.accessToken, refreshToken: data.refreshToken, tokenExpiresAt: data.tokenExpiresAt, linkedinUserId: data.linkedinUserId, linkedinEmail: data.linkedinEmail, displayName: data.displayName, profileImageUrl: data.profileImageUrl, connected: true, updatedAt: now }).where(eq(linkedinSettings.userId, userId)); }
    else { await db.insert(linkedinSettings).values({ userId, linkedinProfileUrl: data.linkedinProfileUrl, accessToken: data.accessToken, refreshToken: data.refreshToken, tokenExpiresAt: data.tokenExpiresAt, linkedinUserId: data.linkedinUserId, linkedinEmail: data.linkedinEmail, displayName: data.displayName, profileImageUrl: data.profileImageUrl, connected: true, createdAt: now, updatedAt: now }); }
    console.log(`[LinkedIn] Account connected for user ${userId}`);
    return true;
  } catch (error) { console.error('[LinkedIn] Error connecting account:', error); return false; }
}

export async function disconnectAccount(userId: number): Promise<boolean> {
  try { await db.update(linkedinSettings).set({ connected: false, accessToken: null, refreshToken: null, tokenExpiresAt: null, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); console.log(`[LinkedIn] Account disconnected for user ${userId}`); return true; }
  catch (error) { console.error('[LinkedIn] Error disconnecting account:', error); return false; }
}

export async function updateSettings(userId: number, settings: { dailyConnectionLimit?: number; dailyMessageLimit?: number; enabled?: number }): Promise<boolean> {
  try { await db.update(linkedinSettings).set({ ...settings, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); return true; }
  catch (error) { console.error('[LinkedIn] Error updating settings:', error); return false; }
}
