import { db } from "../db";
import { emailPreferences, type EmailPreferences, type InsertEmailPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function getEmailPreferences(userId: number): Promise<EmailPreferences | undefined> {
  return await db.query.emailPreferences.findFirst({ where: eq(emailPreferences.userId, userId) });
}

export async function saveEmailPreferences(userId: number, prefs: InsertEmailPreferences): Promise<EmailPreferences> {
  const [saved] = await db.insert(emailPreferences).values({ ...prefs, userId, updatedAt: new Date() }).onConflictDoUpdate({
    target: emailPreferences.userId,
    set: { ...prefs, updatedAt: new Date() },
  }).returning();
  return saved;
}
