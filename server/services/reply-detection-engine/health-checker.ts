/**
 * Reply Detection Health Checker v2.0
 * 
 * Pre-flight health checks before detection runs:
 * - OAuth token validation
 * - Provider reachability
 * - Layer readiness
 */

import { 
  type HealthCheckResult, 
  type DetectionProvider,
  type DetectionLayer,
  ENGINE_CONFIG 
} from "./types";

interface CachedHealthCheck {
  result: HealthCheckResult;
  expiresAt: number;
}

const healthCache = new Map<string, CachedHealthCheck>();

export async function performHealthCheck(
  userId: number,
  provider: DetectionProvider
): Promise<HealthCheckResult> {
  const cacheKey = `${userId}-${provider}`;
  const now = Date.now();
  
  const cached = healthCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }
  
  const result = await runHealthCheck(userId, provider);
  
  healthCache.set(cacheKey, {
    result,
    expiresAt: now + ENGINE_CONFIG.healthCacheTtlMs,
  });
  
  return result;
}

async function runHealthCheck(
  userId: number,
  provider: DetectionProvider
): Promise<HealthCheckResult> {
  const layersReady: DetectionLayer[] = [];
  const layersFailed: DetectionLayer[] = [];
  let tokenValid = false;
  let providerReachable = false;
  let errorMessage: string | undefined;
  
  try {
    if (provider === "gmail") {
      const gmailHealth = await checkGmailHealth(userId);
      tokenValid = gmailHealth.tokenValid;
      providerReachable = gmailHealth.providerReachable;
      errorMessage = gmailHealth.error;
      
      if (tokenValid && providerReachable) {
        layersReady.push(
          "enhanced_thread",
          "message_id",
          "inbox_sweep_exact",
          "inbox_sweep_domain",
          "inbox_sweep_name",
          "alias_intelligence",
          "gmail_history"
        );
      }
    } else if (provider === "outlook") {
      const outlookHealth = await checkOutlookHealth(userId);
      tokenValid = outlookHealth.tokenValid;
      providerReachable = outlookHealth.providerReachable;
      errorMessage = outlookHealth.error;
      
      if (tokenValid && providerReachable) {
        layersReady.push(
          "enhanced_thread",
          "inbox_sweep_exact",
          "inbox_sweep_domain"
        );
      }
    } else if (provider === "yahoo") {
      const yahooHealth = await checkYahooHealth(userId);
      tokenValid = yahooHealth.tokenValid;
      providerReachable = yahooHealth.providerReachable;
      errorMessage = yahooHealth.error;
      
      if (tokenValid && providerReachable) {
        layersReady.push(
          "inbox_sweep_exact",
          "inbox_sweep_domain"
        );
      }
    }
    
    const allLayers: DetectionLayer[] = [
      "enhanced_thread",
      "message_id",
      "inbox_sweep_exact",
      "inbox_sweep_domain",
      "inbox_sweep_name",
      "alias_intelligence",
      "gmail_history"
    ];
    
    for (const layer of allLayers) {
      if (!layersReady.includes(layer)) {
        layersFailed.push(layer);
      }
    }
    
  } catch (error: any) {
    errorMessage = error.message || "Health check failed";
  }
  
  const healthy = tokenValid && providerReachable && layersReady.length >= 3;
  
  return {
    healthy,
    tokenValid,
    providerReachable,
    layersReady,
    layersFailed,
    errorMessage,
    checkedAt: new Date(),
  };
}

async function checkGmailHealth(userId: number): Promise<{
  tokenValid: boolean;
  providerReachable: boolean;
  error?: string;
}> {
  try {
    const { getGmailClient } = await import("../reply-detection/adapters/gmail-adapter");
    
    try {
      const gmail = await getGmailClient(userId);
      
      const profile = await gmail.users.getProfile({ userId: "me" });
      
      if (!profile.data.emailAddress) {
        return {
          tokenValid: false,
          providerReachable: true,
          error: "Could not retrieve user email",
        };
      }
      
      return {
        tokenValid: true,
        providerReachable: true,
      };
      
    } catch (apiError: any) {
      if (apiError.code === 401 || apiError.message?.includes("invalid_grant")) {
        return {
          tokenValid: false,
          providerReachable: true,
          error: "OAuth token expired or revoked",
        };
      }
      
      if (apiError.code === 503 || apiError.code === "ECONNREFUSED") {
        return {
          tokenValid: true,
          providerReachable: false,
          error: "Gmail API temporarily unavailable",
        };
      }
      
      throw apiError;
    }
    
  } catch (error: any) {
    return {
      tokenValid: false,
      providerReachable: false,
      error: error.message || "Gmail health check failed",
    };
  }
}

async function checkOutlookHealth(userId: number): Promise<{
  tokenValid: boolean;
  providerReachable: boolean;
  error?: string;
}> {
  try {
    const { getOutlookClient } = await import("../reply-detection/adapters/outlook-adapter");
    
    try {
      const client = await getOutlookClient(userId);
      
      const me = await client.api("/me").get();
      
      if (!me.mail && !me.userPrincipalName) {
        return {
          tokenValid: false,
          providerReachable: true,
          error: "Could not retrieve user email",
        };
      }
      
      return {
        tokenValid: true,
        providerReachable: true,
      };
      
    } catch (apiError: any) {
      if (apiError.statusCode === 401) {
        return {
          tokenValid: false,
          providerReachable: true,
          error: "OAuth token expired or revoked",
        };
      }
      
      if (apiError.statusCode === 503 || apiError.code === "ECONNREFUSED") {
        return {
          tokenValid: true,
          providerReachable: false,
          error: "Outlook API temporarily unavailable",
        };
      }
      
      throw apiError;
    }
    
  } catch (error: any) {
    return {
      tokenValid: false,
      providerReachable: false,
      error: error.message || "Outlook health check failed",
    };
  }
}

async function checkYahooHealth(userId: number): Promise<{
  tokenValid: boolean;
  providerReachable: boolean;
  error?: string;
}> {
  return {
    tokenValid: true,
    providerReachable: true,
  };
}

export function invalidateHealthCache(userId: number, provider?: DetectionProvider): void {
  if (provider) {
    healthCache.delete(`${userId}-${provider}`);
  } else {
    Array.from(healthCache.keys()).forEach(key => {
      if (key.startsWith(`${userId}-`)) {
        healthCache.delete(key);
      }
    });
  }
}

export function clearHealthCache(): void {
  healthCache.clear();
}

export function getHealthCacheStats(): { size: number; entries: string[] } {
  return {
    size: healthCache.size,
    entries: Array.from(healthCache.keys()),
  };
}
