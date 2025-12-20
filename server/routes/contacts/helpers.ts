import { db } from "../../db";
import { contacts, campaignContacts } from "@shared/schema";
import { eq, and, ne, asc, count } from "drizzle-orm";

const MAX_CONTACTS_PER_USER = 25;

export async function enforceContactLimit(userId: number): Promise<void> {
  const [{ count: totalCount }] = await db.select({ count: count() }).from(contacts).where(and(eq(contacts.userId, userId), ne(contacts.source, 'lead_finder')));
  if (Number(totalCount) > MAX_CONTACTS_PER_USER) {
    const excess = Number(totalCount) - MAX_CONTACTS_PER_USER;
    const oldestContacts = await db.select({ id: contacts.id, source: contacts.source }).from(contacts).where(and(eq(contacts.userId, userId), ne(contacts.source, 'lead_finder'))).orderBy(asc(contacts.id)).limit(excess);
    let deletedCount = 0;
    for (const oldContact of oldestContacts) {
      if (oldContact.source === 'lead_finder') { console.log(`[Contacts] SAFETY: Refusing to delete lead_finder contact ${oldContact.id}`); continue; }
      await db.delete(campaignContacts).where(eq(campaignContacts.contactId, oldContact.id));
      await db.delete(contacts).where(eq(contacts.id, oldContact.id));
      deletedCount++;
    }
    if (deletedCount > 0) console.log(`[Contacts] FIFO cleanup for user ${userId}: removed ${deletedCount} oldest NON-lead_finder contact(s)`);
  }
}
