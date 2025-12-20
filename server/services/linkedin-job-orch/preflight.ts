import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { LinkedInCookieApiService } from "../linkedin-cookie-api";
import type { PreflightResult } from "./types";
import { MAX_CONNECTION_REQUESTS_PER_DAY, MAX_MESSAGES_PER_DAY } from "./types";

export async function runPreflightChecks(userId: number, jobType: string): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  try {
    const [settings] = await db.select().from(linkedinSettings).where(eq(linkedinSettings.userId, userId));
    if (!settings?.extensionConnected) { errors.push('LinkedIn not connected via browser extension'); return { passed: false, errors, warnings }; }
    if (!settings.sessionCookies) { errors.push('No LinkedIn session cookies found - please reconnect via extension'); return { passed: false, errors, warnings }; }
    const sessionVerify = await (LinkedInCookieApiService as any).verifySession?.(userId);
    if (sessionVerify && !sessionVerify.valid) { errors.push(`LinkedIn session invalid: ${sessionVerify.error || 'Please reconnect via extension'}`); return { passed: false, errors, warnings }; }
    if (!settings?.connected) { errors.push('LinkedIn profile not connected'); }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let currentConnectionCount = settings?.connectionsSentToday || 0;
    let currentMessageCount = settings?.messagesSentToday || 0;
    if (settings?.lastLimitReset && new Date(settings.lastLimitReset) < today) { await db.update(linkedinSettings).set({ connectionsSentToday: 0, messagesSentToday: 0, lastLimitReset: new Date() }).where(eq(linkedinSettings.userId, userId)); currentConnectionCount = 0; currentMessageCount = 0; }
    if (jobType === 'connection_request') { const limit = settings?.dailyConnectionLimit || MAX_CONNECTION_REQUESTS_PER_DAY; if (currentConnectionCount >= limit) { errors.push(`Daily connection request limit reached (${currentConnectionCount}/${limit})`); } else if (currentConnectionCount >= limit * 0.8) { warnings.push(`Approaching daily connection limit (${currentConnectionCount}/${limit})`); } }
    else { const limit = settings?.dailyMessageLimit || MAX_MESSAGES_PER_DAY; if (currentMessageCount >= limit) { errors.push(`Daily message limit reached (${currentMessageCount}/${limit})`); } else if (currentMessageCount >= limit * 0.8) { warnings.push(`Approaching daily message limit (${currentMessageCount}/${limit})`); } }
    return { passed: errors.length === 0, errors, warnings };
  } catch (error: any) { console.error('[LinkedInOrchestrator] Preflight check error:', error); errors.push(`Preflight check failed: ${error.message}`); return { passed: false, errors, warnings }; }
}
