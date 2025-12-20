import { db } from "../db";
import { authProviders } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function storeOAuthTokens(data: { userId: number; provider: string; email: string; accessToken: string; refreshToken?: string; expiresAt?: Date; scope?: string; }): Promise<void> {
  const existing = await db.select().from(authProviders).where(and(eq(authProviders.userId, data.userId), eq(authProviders.provider, data.provider)));

  if (existing.length > 0) {
    await db.update(authProviders).set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      expiresAt: data.expiresAt || null,
      scope: data.scope || null,
      email: data.email,
      updatedAt: new Date(),
    }).where(and(eq(authProviders.userId, data.userId), eq(authProviders.provider, data.provider)));
  } else {
    await db.insert(authProviders).values({
      userId: data.userId,
      provider: data.provider,
      email: data.email,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || null,
      expiresAt: data.expiresAt || null,
      scope: data.scope || null,
    });
  }
}

export async function getOAuthTokens(userId: number, provider: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date; email: string; } | null> {
  const [tokens] = await db.select().from(authProviders).where(and(eq(authProviders.userId, userId), eq(authProviders.provider, provider)));
  if (!tokens) return null;
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken || undefined, expiresAt: tokens.expiresAt || undefined, email: tokens.email };
}

export async function updateOAuthTokens(userId: number, provider: string, data: { accessToken: string; refreshToken?: string; expiresAt?: Date; }): Promise<void> {
  await db.update(authProviders).set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || null,
    expiresAt: data.expiresAt || null,
    updatedAt: new Date(),
  }).where(and(eq(authProviders.userId, userId), eq(authProviders.provider, provider)));
}

export async function deleteOAuthTokens(userId: number, provider: string): Promise<void> {
  await db.delete(authProviders).where(and(eq(authProviders.userId, userId), eq(authProviders.provider, provider)));
}
