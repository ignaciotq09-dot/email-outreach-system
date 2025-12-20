import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function generateExtensionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createExtensionToken(userId: number): Promise<string> {
  const token = generateExtensionToken();
  const [existing] = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId));
  if (!existing) { await db.insert(linkedinSettings).values({ userId, extensionToken: token, extensionTokenCreatedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }); }
  else { await db.update(linkedinSettings).set({ extensionToken: token, extensionTokenCreatedAt: new Date(), updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); }
  return token;
}

export async function validateExtensionToken(token: string): Promise<number | null> {
  if (!token || token.length < 32) return null;
  const [settings] = await db.select().from(linkedinSettings).where(eq(linkedinSettings.extensionToken, token));
  if (!settings) return null;
  if (settings.extensionTokenCreatedAt) {
    const tokenAge = Date.now() - new Date(settings.extensionTokenCreatedAt).getTime();
    const maxAge = 15 * 60 * 1000;
    if (tokenAge > maxAge) { await db.update(linkedinSettings).set({ extensionToken: null, updatedAt: new Date() }).where(eq(linkedinSettings.userId, settings.userId)); console.log(`[LinkedIn Cookie API] Token expired for user ${settings.userId}`); return null; }
  }
  return settings.userId;
}

export async function disconnectExtension(userId: number): Promise<boolean> {
  try { await db.update(linkedinSettings).set({ sessionCookies: null, sessionCookiesUpdatedAt: null, extensionConnected: false, extensionToken: null, connected: false, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); console.log(`[LinkedIn Cookie API] Extension disconnected for user ${userId}`); return true; }
  catch (error) { console.error("[LinkedIn Cookie API] Error disconnecting extension:", error); return false; }
}

export async function getExtensionStatus(userId: number): Promise<{ connected: boolean; lastVerified?: Date | null; cookiesUpdatedAt?: Date | null }> {
  try {
    const [settings] = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId));
    if (!settings) { return { connected: false }; }
    return { connected: settings.extensionConnected || false, lastVerified: settings.extensionLastVerified, cookiesUpdatedAt: settings.sessionCookiesUpdatedAt };
  } catch (error) { console.error("[LinkedIn Cookie API] Error getting extension status:", error); return { connected: false }; }
}
