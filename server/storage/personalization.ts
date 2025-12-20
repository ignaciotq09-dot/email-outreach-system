import { db } from "../db";
import { userEmailPersonalization, userVoiceSamples, userEmailPersonas, emailEditHistory, type UserEmailPersonalization, type InsertUserEmailPersonalization, type UpdateUserEmailPersonalization, type UserVoiceSample, type InsertUserVoiceSample, type UserEmailPersona, type InsertUserEmailPersona, type UpdateUserEmailPersona, type EmailEditHistory, type InsertEmailEditHistory } from "@shared/schema";
import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";

export async function getEmailPersonalization(userId: number): Promise<UserEmailPersonalization | undefined> {
  const [result] = await db.select().from(userEmailPersonalization).where(eq(userEmailPersonalization.userId, userId));
  return result;
}

export async function upsertEmailPersonalization(userId: number, data: InsertUserEmailPersonalization): Promise<UserEmailPersonalization> {
  const existing = await getEmailPersonalization(userId);
  if (existing) {
    const [updated] = await db.update(userEmailPersonalization).set({ ...data, updatedAt: new Date() }).where(eq(userEmailPersonalization.userId, userId)).returning();
    return updated;
  } else {
    const [created] = await db.insert(userEmailPersonalization).values({ ...data, userId }).returning();
    return created;
  }
}

export async function updateEmailPersonalization(userId: number, data: UpdateUserEmailPersonalization): Promise<UserEmailPersonalization | undefined> {
  const [updated] = await db.update(userEmailPersonalization).set({ ...data, updatedAt: new Date() }).where(eq(userEmailPersonalization.userId, userId)).returning();
  return updated;
}

export async function getVoiceSamples(userId: number): Promise<UserVoiceSample[]> {
  return await db.select().from(userVoiceSamples).where(eq(userVoiceSamples.userId, userId)).orderBy(asc(userVoiceSamples.displayOrder));
}

export async function addVoiceSample(userId: number, sample: Omit<InsertUserVoiceSample, 'userId'>): Promise<UserVoiceSample> {
  const [created] = await db.insert(userVoiceSamples).values({ ...sample, userId }).returning();
  return created;
}

export async function updateVoiceSample(userId: number, sampleId: number, data: Partial<InsertUserVoiceSample>): Promise<UserVoiceSample | undefined> {
  const [updated] = await db.update(userVoiceSamples).set(data).where(and(eq(userVoiceSamples.id, sampleId), eq(userVoiceSamples.userId, userId))).returning();
  return updated;
}

export async function deleteVoiceSample(userId: number, sampleId: number): Promise<boolean> {
  await db.delete(userVoiceSamples).where(and(eq(userVoiceSamples.id, sampleId), eq(userVoiceSamples.userId, userId)));
  return true;
}

export async function getEmailPersonas(userId: number): Promise<UserEmailPersona[]> {
  return await db.select().from(userEmailPersonas).where(eq(userEmailPersonas.userId, userId)).orderBy(asc(userEmailPersonas.displayOrder));
}

export async function getEmailPersonaById(userId: number, personaId: number): Promise<UserEmailPersona | undefined> {
  const [result] = await db.select().from(userEmailPersonas).where(and(eq(userEmailPersonas.id, personaId), eq(userEmailPersonas.userId, userId)));
  return result;
}

export async function createEmailPersona(userId: number, persona: Omit<InsertUserEmailPersona, 'userId'>): Promise<UserEmailPersona> {
  const [created] = await db.insert(userEmailPersonas).values({ ...persona, userId }).returning();
  return created;
}

export async function updateEmailPersona(userId: number, personaId: number, data: UpdateUserEmailPersona): Promise<UserEmailPersona | undefined> {
  const [updated] = await db.update(userEmailPersonas).set({ ...data, updatedAt: new Date() }).where(and(eq(userEmailPersonas.id, personaId), eq(userEmailPersonas.userId, userId))).returning();
  return updated;
}

export async function deleteEmailPersona(userId: number, personaId: number): Promise<boolean> {
  await db.delete(userEmailPersonas).where(and(eq(userEmailPersonas.id, personaId), eq(userEmailPersonas.userId, userId)));
  return true;
}

export async function setDefaultPersona(userId: number, personaId: number): Promise<void> {
  await db.update(userEmailPersonas).set({ isDefault: false }).where(eq(userEmailPersonas.userId, userId));
  await db.update(userEmailPersonas).set({ isDefault: true }).where(and(eq(userEmailPersonas.id, personaId), eq(userEmailPersonas.userId, userId)));
}

export async function incrementPersonaUsage(userId: number, personaId: number): Promise<void> {
  await db.update(userEmailPersonas).set({ timesUsed: sql`${userEmailPersonas.timesUsed} + 1`, lastUsedAt: new Date() }).where(and(eq(userEmailPersonas.id, personaId), eq(userEmailPersonas.userId, userId)));
}

export async function trackEmailEdit(userId: number, edit: Omit<InsertEmailEditHistory, 'userId'>): Promise<EmailEditHistory> {
  const [created] = await db.insert(emailEditHistory).values({ ...edit, userId }).returning();
  return created;
}

export async function getEmailEditHistory(userId: number, limit: number = 100): Promise<EmailEditHistory[]> {
  return await db.select().from(emailEditHistory).where(eq(emailEditHistory.userId, userId)).orderBy(desc(emailEditHistory.createdAt)).limit(limit);
}

export async function getUnanalyzedEdits(userId: number, limit: number = 50): Promise<EmailEditHistory[]> {
  return await db.select().from(emailEditHistory).where(and(eq(emailEditHistory.userId, userId), eq(emailEditHistory.wasAnalyzed, false))).orderBy(asc(emailEditHistory.createdAt)).limit(limit);
}

export async function markEditsAsAnalyzed(userId: number, editIds: number[]): Promise<void> {
  if (editIds.length === 0) return;
  await db.update(emailEditHistory).set({ wasAnalyzed: true, analyzedAt: new Date() }).where(and(eq(emailEditHistory.userId, userId), inArray(emailEditHistory.id, editIds)));
}
