import { storage } from "../../storage";
import { getUserEmailService } from "../../user-email-service";
import type { HealthCheckResult } from "./types";

const healthCache = new Map<number, { result: HealthCheckResult; timestamp: number }>();
const CACHE_TTL_MS = 60000;

export async function checkProviderHealth(userId: number): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const cached = healthCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.result, checkTimeMs: 0 };
  }
  
  try {
    const user = await storage.getUserById(userId);
    if (!user) {
      return {
        passed: false,
        providerHealthy: false,
        tokenValid: false,
        errorMessage: 'User not found',
        checkTimeMs: Date.now() - startTime,
      };
    }
    
    const emailService = getUserEmailService(user);
    
    const userEmail = await emailService.getUserEmail();
    if (!userEmail) {
      return {
        passed: false,
        providerHealthy: false,
        tokenValid: false,
        errorMessage: 'No email account connected',
        checkTimeMs: Date.now() - startTime,
      };
    }
    
    const result: HealthCheckResult = {
      passed: true,
      providerHealthy: true,
      tokenValid: true,
      checkTimeMs: Date.now() - startTime,
    };
    
    healthCache.set(userId, { result, timestamp: Date.now() });
    
    return result;
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown health check error';
    const isAuthError = errorMessage.toLowerCase().includes('auth') ||
                        errorMessage.toLowerCase().includes('token') ||
                        errorMessage.toLowerCase().includes('unauthorized') ||
                        error?.code === 401;
    
    const result: HealthCheckResult = {
      passed: false,
      providerHealthy: !isAuthError,
      tokenValid: !isAuthError,
      errorMessage,
      checkTimeMs: Date.now() - startTime,
    };
    
    return result;
  }
}

export async function validateTokenBeforeSend(userId: number): Promise<{
  valid: boolean;
  error?: string;
  shouldRetry: boolean;
}> {
  const health = await checkProviderHealth(userId);
  
  if (health.passed) {
    return { valid: true, shouldRetry: false };
  }
  
  if (!health.tokenValid) {
    return {
      valid: false,
      error: `Token invalid: ${health.errorMessage}`,
      shouldRetry: true,
    };
  }
  
  if (!health.providerHealthy) {
    return {
      valid: false,
      error: `Provider unhealthy: ${health.errorMessage}`,
      shouldRetry: true,
    };
  }
  
  return {
    valid: false,
    error: health.errorMessage || 'Unknown validation error',
    shouldRetry: true,
  };
}

export function clearHealthCache(userId?: number): void {
  if (userId) {
    healthCache.delete(userId);
  } else {
    healthCache.clear();
  }
}

export function getHealthCacheStats(): { size: number; entries: Array<{ userId: number; age: number }> } {
  const entries: Array<{ userId: number; age: number }> = [];
  const now = Date.now();
  
  healthCache.forEach((value, key) => {
    entries.push({
      userId: key,
      age: now - value.timestamp,
    });
  });
  
  return { size: healthCache.size, entries };
}
