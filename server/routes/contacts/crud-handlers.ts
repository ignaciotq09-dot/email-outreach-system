import type { Request, Response } from "express";
import { z } from "zod";
import { eq, and, desc, ne } from "drizzle-orm";
import { db } from "../../db";
import { storage } from "../../storage";
import { insertContactSchema, contacts, campaignContacts, sentEmails } from "@shared/schema";
import { enforceContactLimit } from "./helpers";

export async function createContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const validatedData = insertContactSchema.parse(req.body);
    const contact = await storage.createContact(userId, validatedData);
    await enforceContactLimit(userId);
    res.json(contact);
  } catch (error: any) { console.error('Error creating contact:', error); if (error instanceof z.ZodError) res.status(400).json({ error: 'Invalid contact data', details: error.errors }); else if (error?.code === '23505') res.status(400).json({ error: `A contact with email ${req.body.email} already exists for your account.` }); else res.status(500).json({ error: 'Failed to create contact' }); }
}

export async function addContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const validatedData = insertContactSchema.parse(req.body);
    const contact = await storage.createContact(userId, validatedData);
    await enforceContactLimit(userId);
    res.json(contact);
  } catch (error: any) { console.error('Error adding contact:', error); if (error instanceof z.ZodError) res.status(400).json({ error: 'Invalid contact data', details: error.errors }); else if (error?.code === '23505') res.status(400).json({ error: `A contact with email ${req.body.email} already exists for your account.` }); else res.status(500).json({ error: 'Failed to add contact' }); }
}

export async function getAllContacts(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const userContacts = await storage.getContactsByUserId(userId);
    res.json(userContacts);
  } catch (error) { console.error('Error fetching contacts:', error); res.status(500).json({ error: 'Failed to fetch contacts' }); }
}

export async function getLeadFinderContacts(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const leadFinderContacts = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.source, 'lead_finder'))).orderBy(desc(contacts.id));
    res.json(leadFinderContacts);
  } catch (error) { console.error('Error fetching lead finder contacts:', error); res.status(500).json({ error: 'Failed to fetch lead finder contacts' }); }
}

export async function getContactById(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, parseInt(req.params.id)), eq(contacts.userId, userId)));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) { console.error('Error fetching contact:', error); res.status(500).json({ error: 'Failed to fetch contact' }); }
}

export async function updateContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [updated] = await db.update(contacts).set(req.body).where(and(eq(contacts.id, parseInt(req.params.id)), eq(contacts.userId, userId))).returning();
    if (!updated) return res.status(404).json({ error: 'Contact not found' });
    res.json(updated);
  } catch (error) { console.error('Error updating contact:', error); res.status(500).json({ error: 'Failed to update contact' }); }
}

export async function deleteContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const contactId = parseInt(req.params.id);
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    await db.delete(campaignContacts).where(eq(campaignContacts.contactId, contactId));
    await db.delete(contacts).where(eq(contacts.id, contactId));
    res.json({ success: true });
  } catch (error) { console.error('Error deleting contact:', error); res.status(500).json({ error: 'Failed to delete contact' }); }
}

export async function deleteLeadFinderContacts(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const leadFinderContacts = await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.source, 'lead_finder')));
    for (const contact of leadFinderContacts) { await db.delete(campaignContacts).where(eq(campaignContacts.contactId, contact.id)); }
    const result = await db.delete(contacts).where(and(eq(contacts.userId, userId), eq(contacts.source, 'lead_finder')));
    console.log(`[Contacts] Deleted all lead finder contacts for user ${userId}`);
    res.json({ success: true, deleted: leadFinderContacts.length });
  } catch (error) { console.error('Error deleting lead finder contacts:', error); res.status(500).json({ error: 'Failed to delete lead finder contacts' }); }
}
