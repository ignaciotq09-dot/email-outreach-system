import type { Request, Response } from "express";
import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { storage } from "../../storage";
import { contacts, campaignContacts, sentEmails } from "@shared/schema";
import { enforceContactLimit } from "./helpers";

export async function parseBulk(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { text, campaignId } = req.body; if (!text) return res.status(400).json({ error: 'No text provided' });
    const emailRegex = /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/gi;
    const emails = text.match(emailRegex) || [];
    const uniqueEmails = [...new Set(emails.map((e: string) => e.toLowerCase()))];
    const addedContacts = []; const errors = [];
    for (const email of uniqueEmails) {
      try {
        const [existing] = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.email, email as string)));
        let contact;
        if (existing) { contact = existing; }
        else { contact = await storage.createContact(userId, { email: email as string, source: 'ai_import' }); }
        if (campaignId) {
          const [existingCC] = await db.select().from(campaignContacts).where(and(eq(campaignContacts.campaignId, campaignId), eq(campaignContacts.contactId, contact.id)));
          if (!existingCC) await db.insert(campaignContacts).values({ campaignId, contactId: contact.id });
        }
        addedContacts.push(contact);
      } catch (e: any) { errors.push({ email, error: e.message }); }
    }
    await enforceContactLimit(userId);
    res.json({ added: addedContacts.length, contacts: addedContacts, errors });
  } catch (error) { console.error('Error parsing bulk contacts:', error); res.status(500).json({ error: 'Failed to parse contacts' }); }
}

export async function cleanup(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const orphanedContacts = await db.select({ id: contacts.id, email: contacts.email }).from(contacts).leftJoin(campaignContacts, eq(contacts.id, campaignContacts.contactId)).leftJoin(sentEmails, eq(contacts.id, sentEmails.contactId)).where(and(eq(contacts.userId, userId), isNull(campaignContacts.id), isNull(sentEmails.id)));
    for (const contact of orphanedContacts) await db.delete(contacts).where(eq(contacts.id, contact.id));
    console.log(`[Contacts] Cleaned up ${orphanedContacts.length} orphaned contacts for user ${userId}`);
    res.json({ deleted: orphanedContacts.length });
  } catch (error) { console.error('Error cleaning up contacts:', error); res.status(500).json({ error: 'Failed to cleanup contacts' }); }
}
