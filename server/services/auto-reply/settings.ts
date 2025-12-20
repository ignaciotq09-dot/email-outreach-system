import { db } from "../../db";
import { eq } from "drizzle-orm";
import { emailPreferences } from "@shared/schema";

export async function getAutoReplySettings(userId: number) {
  const [prefs] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
  return { enabled: prefs?.autoReplyEnabled ?? false, bookingLink: prefs?.bookingLink ?? null, customMessage: prefs?.autoReplyMessage ?? null };
}

export async function updateAutoReplySettings(userId: number, settings: { enabled?: boolean; bookingLink?: string; customMessage?: string; }) {
  const [existing] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId)).limit(1);
  if (existing) { await db.update(emailPreferences).set({ autoReplyEnabled: settings.enabled ?? existing.autoReplyEnabled, bookingLink: settings.bookingLink ?? existing.bookingLink, autoReplyMessage: settings.customMessage ?? existing.autoReplyMessage, updatedAt: new Date() }).where(eq(emailPreferences.userId, userId)); } else { await db.insert(emailPreferences).values({ userId, autoReplyEnabled: settings.enabled ?? false, bookingLink: settings.bookingLink ?? null, autoReplyMessage: settings.customMessage ?? null }); }
}
