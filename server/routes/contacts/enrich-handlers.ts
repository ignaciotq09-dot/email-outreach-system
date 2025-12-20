import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { contacts } from "@shared/schema";

export async function enrichContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const contactId = parseInt(req.params.id);
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    await db.update(contacts).set({ enrichmentStatus: 'pending' }).where(eq(contacts.id, contactId));
    console.log(`[Contacts] Enrichment queued for contact ${contactId}`);
    res.json({ success: true, message: 'Enrichment queued' });
  } catch (error) { console.error('Error enriching contact:', error); res.status(500).json({ error: 'Failed to enrich contact' }); }
}

export async function getEnrichmentStatus(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const contactId = parseInt(req.params.id);
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ status: contact.enrichmentStatus || 'none', enrichedAt: contact.enrichedAt });
  } catch (error) { console.error('Error getting enrichment status:', error); res.status(500).json({ error: 'Failed to get enrichment status' }); }
}
