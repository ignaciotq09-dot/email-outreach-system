/**
 * Email Warm-up System
 * 
 * Gradually ramps up sending volume over 4 weeks to build sender reputation
 * and avoid triggering spam filters with sudden high-volume sends.
 * 
 * Warm-up Schedule:
 * - Week 1: 5 emails/day
 * - Week 2: 10 emails/day
 * - Week 3: 20 emails/day
 * - Week 4: 50 emails/day
 * - Week 5+: 100 emails/day (full volume)
 */

import { db } from '../db';
import { warmupSettings } from '@shared/schemas/warmup-schema';
import { sentEmails } from '@shared/schemas/emails-schema';
import { eq, gte, sql } from 'drizzle-orm';

export interface WarmupStage {
  stage: number;
  weekNumber: number;
  dailyLimit: number;
  description: string;
}

export interface WarmupStatus {
  enabled: boolean;
  currentStage: number;
  dailyLimit: number;
  daysInStage: number;
  daysUntilNextStage: number;
  totalDaysSinceStart: number;
  recommendation: string;
}

const WARMUP_STAGES: WarmupStage[] = [
  { stage: 1, weekNumber: 1, dailyLimit: 5, description: 'Week 1: Building initial reputation' },
  { stage: 2, weekNumber: 2, dailyLimit: 10, description: 'Week 2: Gradual increase' },
  { stage: 3, weekNumber: 3, dailyLimit: 20, description: 'Week 3: Moderate volume' },
  { stage: 4, weekNumber: 4, dailyLimit: 50, description: 'Week 4: Higher volume' },
  { stage: 5, weekNumber: 5, dailyLimit: 100, description: 'Full volume: Warm-up complete' },
];

/**
 * Get warm-up settings for a user, creating defaults if not exists
 */
export async function getWarmupSettings(userId: string = 'default') {
  const existing = await db
    .select()
    .from(warmupSettings)
    .where(eq(warmupSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default settings
  const [newSettings] = await db
    .insert(warmupSettings)
    .values({
      userId,
      enabled: true,
      currentStage: 1,
      startDate: new Date(),
    })
    .returning();

  return newSettings;
}

/**
 * Get current warm-up status with recommendations
 */
export async function getWarmupStatus(userId: string = 'default'): Promise<WarmupStatus> {
  const settings = await getWarmupSettings(userId);

  if (!settings.enabled) {
    return {
      enabled: false,
      currentStage: settings.currentStage || 1,
      dailyLimit: settings.customDailyLimit || 100,
      daysInStage: 0,
      daysUntilNextStage: 0,
      totalDaysSinceStart: 0,
      recommendation: 'Warm-up disabled'
    };
  }
  
  if (settings.manualOverride) {
    return {
      enabled: true,
      currentStage: settings.currentStage || 1,
      dailyLimit: settings.customDailyLimit || 100,
      daysInStage: 0,
      daysUntilNextStage: 0,
      totalDaysSinceStart: 0,
      recommendation: 'Manual override: Custom daily limit active'
    };
  }

  const startDate = settings.startDate || new Date();
  const now = new Date();
  const totalDaysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Auto-progress stages based on time
  const expectedStage = Math.min(Math.floor(totalDaysSinceStart / 7) + 1, WARMUP_STAGES.length);
  const currentStage = settings.currentStage || 1;
  
  if (expectedStage > currentStage) {
    await updateWarmupStage(userId, expectedStage);
    settings.currentStage = expectedStage;
  }

  const effectiveStage = settings.currentStage || 1;
  const currentStageInfo = WARMUP_STAGES[effectiveStage - 1];
  const daysInCurrentStage = totalDaysSinceStart % 7;
  const daysUntilNextStage = effectiveStage < WARMUP_STAGES.length 
    ? 7 - daysInCurrentStage 
    : 0;

  return {
    enabled: true,
    currentStage: effectiveStage,
    dailyLimit: currentStageInfo.dailyLimit,
    daysInStage: daysInCurrentStage,
    daysUntilNextStage,
    totalDaysSinceStart,
    recommendation: currentStageInfo.description
  };
}

/**
 * Update warm-up stage
 */
export async function updateWarmupStage(userId: string, newStage: number) {
  const validStage = Math.max(1, Math.min(newStage, WARMUP_STAGES.length));
  await db
    .update(warmupSettings)
    .set({
      currentStage: validStage,
      lastProgressCheck: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(warmupSettings.userId, userId));
}

/**
 * Get daily limit based on warm-up status
 */
export async function getWarmupDailyLimit(userId: string = 'default'): Promise<number> {
  const status = await getWarmupStatus(userId);
  return status.dailyLimit;
}

/**
 * Enable/disable warm-up
 */
export async function setWarmupEnabled(userId: string, enabled: boolean) {
  const settings = await getWarmupSettings(userId);
  
  await db
    .update(warmupSettings)
    .set({
      enabled,
      startDate: enabled && !settings.startDate ? new Date() : settings.startDate,
      updatedAt: new Date(),
    })
    .where(eq(warmupSettings.userId, userId));
}

/**
 * Set manual override with custom daily limit
 */
export async function setWarmupManualOverride(
  userId: string, 
  override: boolean, 
  customLimit?: number,
  stage?: number
) {
  const updateData: any = {
    manualOverride: override,
    customDailyLimit: customLimit,
    updatedAt: new Date(),
  };
  
  // If stage is provided, update currentStage as well
  if (stage !== undefined) {
    updateData.currentStage = stage;
  }
  
  await db
    .update(warmupSettings)
    .set(updateData)
    .where(eq(warmupSettings.userId, userId));
}

/**
 * Reset warm-up to stage 1
 */
export async function resetWarmup(userId: string = 'default') {
  await db
    .update(warmupSettings)
    .set({
      currentStage: 1,
      startDate: new Date(),
      lastProgressCheck: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(warmupSettings.userId, userId));
}

/**
 * Get all warm-up stages for display
 */
export function getWarmupStages(): WarmupStage[] {
  return WARMUP_STAGES;
}
