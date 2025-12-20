import { storage } from "../../../storage";
import { decryptToken } from "../../../auth/token-encryption";
import type { LayerHealthStatus } from "../types";

async function checkProviderTokenHealth(userId: number, providerName: 'gmail' | 'outlook' | 'yahoo'): Promise<LayerHealthStatus> {
  const startTime = Date.now();
  try {
    const tokens = await storage.getOAuthTokens(userId, providerName);
    if (!tokens) return { layer: providerName, healthy: false, lastCheckedAt: new Date(), errorMessage: `${providerName} not connected`, responseTimeMs: Date.now() - startTime };
    const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now;
    if (isExpired && !tokens.refreshToken) return { layer: providerName, healthy: false, lastCheckedAt: new Date(), errorMessage: `${providerName} token expired and cannot refresh`, responseTimeMs: Date.now() - startTime };
    try { decryptToken(tokens.accessToken); } catch { return { layer: providerName, healthy: false, lastCheckedAt: new Date(), errorMessage: `${providerName} token decryption failed`, responseTimeMs: Date.now() - startTime }; }
    return { layer: providerName, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime };
  } catch (error: any) { return { layer: providerName, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message || `Unknown error checking ${providerName} health`, responseTimeMs: Date.now() - startTime }; }
}

export async function checkGmailHealth(userId: number): Promise<LayerHealthStatus> { return checkProviderTokenHealth(userId, 'gmail'); }
export async function checkOutlookHealth(userId: number): Promise<LayerHealthStatus> { return checkProviderTokenHealth(userId, 'outlook'); }
export async function checkYahooHealth(userId: number): Promise<LayerHealthStatus> { return checkProviderTokenHealth(userId, 'yahoo'); }
