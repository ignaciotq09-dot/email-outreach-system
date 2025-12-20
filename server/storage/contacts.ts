import { db } from "../db";
import { contacts, type Contact, type InsertContact } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function createContact(userId: number, insertContact: InsertContact): Promise<Contact> {
  const [contact] = await db.insert(contacts).values({ ...insertContact, userId }).returning();
  return contact;
}

export async function getAllContacts(userId: number): Promise<Contact[]> {
  return await db.select().from(contacts).where(eq(contacts.userId, userId));
}

export async function getContactsByIds(userId: number, ids: number[]): Promise<Contact[]> {
  if (ids.length === 0) return [];
  return await db.select().from(contacts).where(and(eq(contacts.userId, userId), inArray(contacts.id, ids)));
}

export async function getContactById(userId: number, id: number): Promise<Contact | undefined> {
  const [contact] = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.id, id)));
  return contact;
}

export async function updateContact(userId: number, id: number, data: Partial<Contact>): Promise<Contact | undefined> {
  const [updated] = await db.update(contacts).set(data).where(and(eq(contacts.userId, userId), eq(contacts.id, id))).returning();
  return updated;
}

export async function deleteContact(userId: number, id: number): Promise<boolean> {
  const result = await db.delete(contacts).where(and(eq(contacts.userId, userId), eq(contacts.id, id))).returning();
  return result.length > 0;
}

export async function updateContactPronoun(userId: number, id: number, pronoun: string): Promise<void> {
  await db.update(contacts).set({ pronoun }).where(and(eq(contacts.userId, userId), eq(contacts.id, id)));
}
