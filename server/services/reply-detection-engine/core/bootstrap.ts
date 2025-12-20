import { db } from "../../../db";
import { authProviders } from "@shared/schema";
import { and, isNotNull, sql } from "drizzle-orm";
import type { DetectionProvider } from "../types";

export interface UserTokenInfo { userId: number; provider: DetectionProvider; }

export async function getActiveEmailUsers(): Promise<UserTokenInfo[]> {
  const usersWithTokens = await db.select({ userId: authProviders.userId, provider: authProviders.provider }).from(authProviders).where(and(isNotNull(authProviders.accessToken), sql`${authProviders.provider} IN ('gmail', 'outlook', 'yahoo')`));
  console.log(`[ReplyDetectionEngine] Found ${usersWithTokens.length} users with valid email tokens`);
  return usersWithTokens.map(({ userId, provider }) => ({ userId, provider: provider as DetectionProvider }));
}
