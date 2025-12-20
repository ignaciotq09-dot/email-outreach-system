import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { LinkedInCookies } from "./types";
import { encryptCookies, decryptCookies } from "./encryption";

export async function getSessionCookies(userId: number): Promise<LinkedInCookies | null> {
  try {
    const [settings] = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId));
    if (!settings?.sessionCookies || !settings.extensionConnected) { return null; }
    const storedData = settings.sessionCookies as any;
    if (storedData.encrypted && storedData.iv && storedData.authTag) { const decrypted = decryptCookies(storedData); if (!decrypted) { console.error("[LinkedIn Cookie API] Failed to decrypt cookies for user", userId); return null; } return decrypted as LinkedInCookies; }
    return storedData as LinkedInCookies;
  } catch (error) { console.error("[LinkedIn Cookie API] Error getting session cookies:", error); return null; }
}

export function buildCookieHeader(cookies: LinkedInCookies): string {
  const cookiePairs: string[] = [];
  for (const [name, data] of Object.entries(cookies)) { if (data?.value) { cookiePairs.push(`${name}=${data.value}`); } }
  return cookiePairs.join("; ");
}

export function getCsrfToken(cookies: LinkedInCookies): string {
  const jsessionId = cookies.JSESSIONID?.value || "";
  return jsessionId.replace(/"/g, "");
}

export function buildHeaders(cookies: LinkedInCookies): Record<string, string> {
  return {
    "Cookie": buildCookieHeader(cookies),
    "csrf-token": getCsrfToken(cookies),
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/vnd.linkedin.normalized+json+2.1",
    "Accept-Language": "en-US,en;q=0.9",
    "x-li-lang": "en_US",
    "x-li-page-instance": "urn:li:page:d_flagship3_profile_view_base;random",
    "x-restli-protocol-version": "2.0.0",
  };
}

export async function storeSessionCookies(userId: number, cookies: LinkedInCookies): Promise<{ success: boolean; error?: string }> {
  try {
    if (!cookies.li_at?.value) { return { success: false, error: "Missing required li_at cookie" }; }
    const encryptedCookies = encryptCookies(cookies);
    const now = new Date();
    await db.update(linkedinSettings).set({ sessionCookies: encryptedCookies, sessionCookiesUpdatedAt: now, extensionConnected: true, extensionLastVerified: now, connected: true, extensionToken: null, updatedAt: now }).where(eq(linkedinSettings.userId, userId));
    console.log(`[LinkedIn Cookie API] Encrypted session cookies stored for user ${userId}`);
    return { success: true };
  } catch (error: any) { console.error("[LinkedIn Cookie API] Error storing session cookies:", error); return { success: false, error: error.message }; }
}
