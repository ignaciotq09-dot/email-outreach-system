import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { contacts, sentEmails } from "@shared/schema";

export async function getEmailedContacts(contactIds: number[]) {
  if (contactIds.length === 0) return [];
  const results = await db.select({ id: contacts.id, name: contacts.name, email: contacts.email, company: contacts.company }).from(contacts).innerJoin(sentEmails, eq(contacts.id, sentEmails.contactId)).where(inArray(contacts.id, contactIds)).groupBy(contacts.id, contacts.name, contacts.email, contacts.company);
  return results.map(r => ({ id: r.id, name: r.name, email: r.email, company: r.company }));
}
