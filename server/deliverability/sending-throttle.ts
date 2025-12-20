/**
 * Smart Sending Throttle
 * Implements human-like sending patterns to avoid spam detection
 */

import { db } from '../db';
import { sentEmails } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getWarmupDailyLimit } from './email-warmup';

export interface ThrottleConfig {
  minIntervalMs: number;      // Minimum time between sends (default: 30 seconds)
  maxIntervalMs: number;      // Maximum time between sends (default: 90 seconds)
  dailyLimit: number;         // Max emails per day (default: 50)
  respectBusinessHours: boolean; // Only send during business hours
  timezone: string;           // User's timezone (default: 'America/New_York')
}

export interface ThrottleCheck {
  canSend: boolean;
  reason?: string;
  waitTimeMs?: number;
  dailyCount?: number;
  dailyLimit?: number;
}

const DEFAULT_CONFIG: ThrottleConfig = {
  minIntervalMs: 30000,  // 30 seconds
  maxIntervalMs: 90000,  // 90 seconds
  dailyLimit: 50,
  respectBusinessHours: true,
  timezone: 'America/New_York'
};

/**
 * Check if sending is allowed based on throttle rules
 * Automatically integrates with warmup system for dynamic daily limits
 */
export async function checkSendingThrottle(
  userId: number = 1,
  config: Partial<ThrottleConfig> = {}
): Promise<ThrottleCheck> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Get daily limit from warmup system (overrides config if warmup is active)
  const warmupLimit = await getWarmupDailyLimit('default');
  const effectiveDailyLimit = warmupLimit || fullConfig.dailyLimit;
  
  // Get daily count for all responses
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sentEmails)
    .where(gte(sentEmails.sentAt, startOfDay))
    .limit(1);
  const sentToday = result[0]?.count || 0;
  
  // 1. Check daily limit
  const dailyCheck = await checkDailyLimit(userId, effectiveDailyLimit);
  if (!dailyCheck.canSend) {
    return {
      ...dailyCheck,
      dailyCount: sentToday,
      dailyLimit: effectiveDailyLimit
    };
  }
  
  // 2. Check interval since last send
  const intervalCheck = await checkSendInterval(userId, fullConfig.minIntervalMs);
  if (!intervalCheck.canSend) {
    return {
      ...intervalCheck,
      dailyCount: sentToday,
      dailyLimit: effectiveDailyLimit
    };
  }
  
  // 3. Check business hours (if enabled)
  if (fullConfig.respectBusinessHours) {
    const businessHoursCheck = checkBusinessHours(fullConfig.timezone);
    if (!businessHoursCheck.canSend) {
      return {
        ...businessHoursCheck,
        dailyCount: sentToday,
        dailyLimit: effectiveDailyLimit
      };
    }
  }
  
  return {
    canSend: true,
    dailyCount: sentToday,
    dailyLimit: effectiveDailyLimit
  };
}

/**
 * Get randomized delay for next send (human-like behavior)
 */
export function getRandomizedDelay(config: Partial<ThrottleConfig> = {}): number {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { minIntervalMs, maxIntervalMs } = fullConfig;
  
  // Add randomness with slight bias toward middle range
  const range = maxIntervalMs - minIntervalMs;
  const random = Math.random();
  
  // Use a slightly skewed distribution (beta-like)
  const skewed = Math.pow(random, 0.8);
  
  return Math.floor(minIntervalMs + (range * skewed));
}

/**
 * Check if daily sending limit has been reached
 */
async function checkDailyLimit(userId: number, dailyLimit: number): Promise<ThrottleCheck> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sentEmails)
      .where(gte(sentEmails.sentAt, startOfDay))
      .limit(1);
    
    const dailyCount = result[0]?.count || 0;
    
    if (dailyCount >= dailyLimit) {
      return {
        canSend: false,
        reason: `Daily limit reached (${dailyCount}/${dailyLimit}). Try again tomorrow.`,
        dailyCount,
        dailyLimit
      };
    }
    
    return {
      canSend: true,
      dailyCount,
      dailyLimit
    };
  } catch (error) {
    console.error('[Throttle] Error checking daily limit:', error);
    // Default to allowing send if check fails
    return { canSend: true };
  }
}

/**
 * Check time since last send
 */
async function checkSendInterval(userId: number, minIntervalMs: number): Promise<ThrottleCheck> {
  try {
    const result = await db
      .select({ sentAt: sentEmails.sentAt })
      .from(sentEmails)
      .orderBy(sql`${sentEmails.sentAt} DESC`)
      .limit(1);
    
    if (result.length === 0 || !result[0].sentAt) {
      // No previous emails, can send
      return { canSend: true };
    }
    
    const lastSentAt = new Date(result[0].sentAt);
    const now = new Date();
    const timeSinceLastMs = now.getTime() - lastSentAt.getTime();
    
    if (timeSinceLastMs < minIntervalMs) {
      const waitTimeMs = minIntervalMs - timeSinceLastMs;
      const waitTimeSec = Math.ceil(waitTimeMs / 1000);
      
      return {
        canSend: false,
        reason: `Please wait ${waitTimeSec} seconds before sending next email`,
        waitTimeMs
      };
    }
    
    return { canSend: true };
  } catch (error) {
    console.error('[Throttle] Error checking send interval:', error);
    // Default to allowing send if check fails
    return { canSend: true };
  }
}

/**
 * Check if current time is within business hours
 */
function checkBusinessHours(timezone: string): ThrottleCheck {
  try {
    const now = new Date();
    
    // Get current time in specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
      weekday: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    
    // Check if weekend
    if (weekday === 'Sat' || weekday === 'Sun') {
      return {
        canSend: false,
        reason: 'Outside business hours (weekend). Emails will send on next business day.'
      };
    }
    
    // Business hours: 9 AM - 5 PM
    if (hour < 9 || hour >= 17) {
      const nextBusinessHour = hour < 9 ? '9:00 AM' : '9:00 AM tomorrow';
      return {
        canSend: false,
        reason: `Outside business hours (9 AM - 5 PM). Next send time: ${nextBusinessHour}`
      };
    }
    
    return { canSend: true };
  } catch (error) {
    console.error('[Throttle] Error checking business hours:', error);
    // Default to allowing send if check fails
    return { canSend: true };
  }
}

/**
 * Get recommended send time based on throttle config
 */
export async function getNextAvailableSendTime(
  userId: number = 1,
  config: Partial<ThrottleConfig> = {}
): Promise<Date> {
  const check = await checkSendingThrottle(userId, config);
  
  if (check.canSend) {
    return new Date();
  }
  
  const now = new Date();
  
  if (check.waitTimeMs) {
    // Add wait time to current time
    return new Date(now.getTime() + check.waitTimeMs);
  }
  
  // Default to next business day at 9 AM
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  
  return tomorrow;
}

/**
 * Calculate optimal batch sending schedule
 * Returns array of recommended send times for a batch of emails
 */
export async function calculateBatchSchedule(
  emailCount: number,
  userId: number = 1,
  config: Partial<ThrottleConfig> = {}
): Promise<Date[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const schedule: Date[] = [];
  
  let currentTime = await getNextAvailableSendTime(userId, config);
  
  for (let i = 0; i < emailCount; i++) {
    schedule.push(new Date(currentTime));
    
    // Add randomized delay for next send
    const delayMs = getRandomizedDelay(fullConfig);
    currentTime = new Date(currentTime.getTime() + delayMs);
    
    // If we've hit business hours limit, move to next day
    const hour = currentTime.getHours();
    if (fullConfig.respectBusinessHours && hour >= 17) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(9, 0, 0, 0);
    }
  }
  
  return schedule;
}
