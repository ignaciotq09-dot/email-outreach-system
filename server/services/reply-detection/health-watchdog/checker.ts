import type { EmailProvider, LayerHealthStatus } from "../types";
import { getCachedHealth, cacheHealthStatus } from "./cache";
import { checkGmailHealth, checkOutlookHealth, checkYahooHealth } from "./providers";

export async function checkProviderHealth(userId: number, provider: EmailProvider): Promise<LayerHealthStatus> {
  const cached = getCachedHealth(userId, provider); if (cached) return cached;
  let status: LayerHealthStatus;
  switch (provider) { case 'gmail': status = await checkGmailHealth(userId); break; case 'outlook': status = await checkOutlookHealth(userId); break; case 'yahoo': status = await checkYahooHealth(userId); break; default: status = { layer: provider, healthy: false, lastCheckedAt: new Date(), errorMessage: `Unknown provider: ${provider}` }; }
  cacheHealthStatus(userId, provider, status);
  if (!status.healthy) console.warn(`[HealthWatchdog] Provider ${provider} is unhealthy for user ${userId}: ${status.errorMessage}`);
  return status;
}

export async function preFlightHealthCheck(userId: number, provider: EmailProvider): Promise<{ canProceed: boolean; healthStatus: LayerHealthStatus; recommendation: 'proceed' | 'retry_later' | 'requires_reauth'; }> {
  const healthStatus = await checkProviderHealth(userId, provider);
  if (healthStatus.healthy) return { canProceed: true, healthStatus, recommendation: 'proceed' };
  const errorMessage = healthStatus.errorMessage?.toLowerCase() || '';
  if (errorMessage.includes('not connected') || errorMessage.includes('decryption failed')) return { canProceed: false, healthStatus, recommendation: 'requires_reauth' };
  if (errorMessage.includes('expired') && errorMessage.includes('cannot refresh')) return { canProceed: false, healthStatus, recommendation: 'requires_reauth' };
  return { canProceed: false, healthStatus, recommendation: 'retry_later' };
}
