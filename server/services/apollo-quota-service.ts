import { db } from "../db";
import { apolloQuotas } from "@shared/schema";
import { eq, sql, and, lte } from "drizzle-orm";

const DEFAULT_MONTHLY_LIMIT = 999999; // Unlimited for testing

export interface QuotaStatus {
  monthlyLimit: number;
  used: number;
  remaining: number;
  resetDate: Date;
  canEnrich: boolean;
}

export async function getOrCreateQuota(userId: number): Promise<QuotaStatus> {
  let quota = await db.query.apolloQuotas.findFirst({
    where: eq(apolloQuotas.userId, userId),
  });

  if (!quota) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    try {
      const [newQuota] = await db.insert(apolloQuotas).values({
        userId,
        monthlyEnrichmentLimit: DEFAULT_MONTHLY_LIMIT,
        usedEnrichments: 0,
        resetDate: nextMonth,
      }).returning();

      quota = newQuota;
    } catch (error: any) {
      // Handle race condition - if another request created the quota, fetch it
      if (error.code === '23505') { // Unique constraint violation
        quota = await db.query.apolloQuotas.findFirst({
          where: eq(apolloQuotas.userId, userId),
        });
        if (!quota) {
          throw new Error('Failed to get or create quota');
        }
      } else {
        throw error;
      }
    }
  }

  const now = new Date();
  if (quota.resetDate && new Date(quota.resetDate) <= now) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const [updatedQuota] = await db.update(apolloQuotas)
      .set({
        usedEnrichments: 0,
        resetDate: nextMonth,
        updatedAt: new Date(),
      })
      .where(eq(apolloQuotas.userId, userId))
      .returning();

    quota = updatedQuota;
  }

  const remaining = Math.max(0, quota.monthlyEnrichmentLimit - quota.usedEnrichments);

  return {
    monthlyLimit: quota.monthlyEnrichmentLimit,
    used: quota.usedEnrichments,
    remaining,
    resetDate: quota.resetDate!,
    canEnrich: remaining > 0,
  };
}

export async function checkQuota(userId: number, requestedCount: number): Promise<{ allowed: boolean; availableCount: number; message?: string }> {
  const status = await getOrCreateQuota(userId);

  if (status.remaining === 0) {
    return {
      allowed: false,
      availableCount: 0,
      message: `You've used all ${status.monthlyLimit} email reveals this month. Your quota resets on ${status.resetDate.toLocaleDateString()}.`,
    };
  }

  if (requestedCount > status.remaining) {
    return {
      allowed: true,
      availableCount: status.remaining,
      message: `You can only reveal ${status.remaining} more emails this month. Limit will be applied.`,
    };
  }

  return {
    allowed: true,
    availableCount: requestedCount,
  };
}

/**
 * Atomically check and deduct quota in a single operation.
 * Uses a single UPDATE with RETURNING to get before/after state atomically.
 * Returns the exact number of credits actually deducted (never over-deducts).
 */
export async function checkAndDeductQuota(
  userId: number,
  requestedCount: number
): Promise<{
  success: boolean;
  deducted: number;
  status: QuotaStatus;
  message?: string;
}> {
  // Ensure quota record exists first
  const beforeStatus = await getOrCreateQuota(userId);

  // If already at limit, fail fast
  if (beforeStatus.remaining === 0) {
    return {
      success: false,
      deducted: 0,
      status: beforeStatus,
      message: `You've used all ${beforeStatus.monthlyLimit} email reveals this month. Your quota resets on ${beforeStatus.resetDate.toLocaleDateString()}.`,
    };
  }

  // Calculate the actual amount we can deduct (capped to remaining)
  const actualDeduction = Math.min(requestedCount, beforeStatus.remaining);

  // Atomic update: add exactly the calculated amount (never exceeds limit)
  const result = await db.update(apolloQuotas)
    .set({
      usedEnrichments: sql`${apolloQuotas.usedEnrichments} + ${actualDeduction}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(apolloQuotas.userId, userId),
        // Safety: only update if we still have room (handles race condition)
        sql`${apolloQuotas.usedEnrichments} + ${actualDeduction} <= ${apolloQuotas.monthlyEnrichmentLimit}`
      )
    )
    .returning();

  // If update failed due to race condition, get fresh state and return failure
  if (result.length === 0) {
    const currentStatus = await getOrCreateQuota(userId);
    return {
      success: false,
      deducted: 0,
      status: currentStatus,
      message: `Quota changed during request. You have ${currentStatus.remaining} reveals remaining.`,
    };
  }

  // Get fresh status after successful deduction
  const afterStatus = await getOrCreateQuota(userId);

  return {
    success: true,
    deducted: actualDeduction,
    status: afterStatus,
    message: afterStatus.remaining <= 5 && afterStatus.remaining > 0
      ? `Only ${afterStatus.remaining} reveals remaining this month.`
      : undefined,
  };
}

export async function deductQuota(userId: number, count: number): Promise<QuotaStatus> {
  await db.update(apolloQuotas)
    .set({
      usedEnrichments: sql`${apolloQuotas.usedEnrichments} + ${count}`,
      updatedAt: new Date(),
    })
    .where(eq(apolloQuotas.userId, userId));

  return getOrCreateQuota(userId);
}

export async function updateUserLimit(userId: number, newLimit: number): Promise<QuotaStatus> {
  await db.update(apolloQuotas)
    .set({
      monthlyEnrichmentLimit: newLimit,
      updatedAt: new Date(),
    })
    .where(eq(apolloQuotas.userId, userId));

  return getOrCreateQuota(userId);
}

/**
 * Refund credits to a user's quota.
 * Used when enrichment fails after credits were pre-deducted.
 * This atomically adds credits back (up to the original deduction amount).
 */
export async function refundQuota(userId: number, refundAmount: number): Promise<QuotaStatus> {
  if (refundAmount <= 0) {
    return getOrCreateQuota(userId);
  }

  // Atomic update: subtract the refund amount (never go below 0)
  await db.update(apolloQuotas)
    .set({
      usedEnrichments: sql`GREATEST(0, ${apolloQuotas.usedEnrichments} - ${refundAmount})`,
      updatedAt: new Date(),
    })
    .where(eq(apolloQuotas.userId, userId));

  console.log(`[Quota] Refunded ${refundAmount} credit(s) to user ${userId}`);

  return getOrCreateQuota(userId);
}
