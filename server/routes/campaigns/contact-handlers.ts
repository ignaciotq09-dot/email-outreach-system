import type { Request, Response } from "express";
import { eq, desc, and, asc } from "drizzle-orm";
import { db } from "../../db";
import { campaigns, campaignContacts, contacts } from "@shared/schema";
import { SmsOptOutService } from "../../services/sms-opt-out";

export async function getCampaignContacts(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id);
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const contactsData = await db.select().from(campaignContacts).where(eq(campaignContacts.campaignId, campaignId)).leftJoin(contacts, eq(campaignContacts.contactId, contacts.id)).orderBy(desc(campaignContacts.addedAt));
    const result = contactsData.map(row => ({ ...row.campaign_contacts, contact: row.contacts }));
    res.json(result);
  } catch (error) { console.error('Error fetching campaign contacts:', error); res.status(500).json({ error: 'Failed to fetch campaign contacts' }); }
}

export async function addContactToCampaign(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id); const contactData = req.body; const MAX_CONTACTS = 25;
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    let contact;
    if (contactData.contactId) { const [existingContact] = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.id, contactData.contactId))).limit(1); if (!existingContact) return res.status(404).json({ error: 'Contact not found' }); contact = existingContact; }
    else { const existingContact = await db.select().from(contacts).where(and(eq(contacts.userId, userId), eq(contacts.email, contactData.email))).limit(1); if (existingContact.length > 0) contact = existingContact[0]; else { const [newContact] = await db.insert(contacts).values({ ...contactData, userId }).returning(); contact = newContact; } }
    const existingCampaignContact = await db.select().from(campaignContacts).where(and(eq(campaignContacts.campaignId, campaignId), eq(campaignContacts.contactId, contact.id))).limit(1);
    if (existingCampaignContact.length > 0) return res.status(400).json({ error: 'Contact already in campaign' });
    let removedOldest = false;
    const currentContacts = await db.select().from(campaignContacts).where(eq(campaignContacts.campaignId, campaignId)).orderBy(asc(campaignContacts.addedAt));
    if (currentContacts.length >= MAX_CONTACTS) { const oldestContact = currentContacts[0]; await db.delete(campaignContacts).where(eq(campaignContacts.id, oldestContact.id)); console.log(`[Campaigns] FIFO: Removed oldest contact ${oldestContact.contactId} from campaign ${campaignId}`); removedOldest = true; }
    const [campaignContact] = await db.insert(campaignContacts).values({ campaignId, contactId: contact.id }).returning();
    res.json({ ...campaignContact, contact, removedOldest });
  } catch (error) { console.error('Error adding contact to campaign:', error); res.status(500).json({ error: 'Failed to add contact to campaign' }); }
}

export async function removeAllContacts(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id);
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await db.delete(campaignContacts).where(eq(campaignContacts.campaignId, campaignId));
    console.log(`[Campaigns] Deleted all contacts from campaign ${campaignId} for user ${userId}`);
    res.json({ success: true });
  } catch (error) { console.error('Error removing all contacts from campaign:', error); res.status(500).json({ error: 'Failed to remove all contacts from campaign' }); }
}

export async function removeContactById(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.campaignId); const campaignContactId = parseInt(req.params.campaignContactId);
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await db.delete(campaignContacts).where(eq(campaignContacts.id, campaignContactId));
    res.json({ success: true });
  } catch (error) { console.error('Error removing contact from campaign:', error); res.status(500).json({ error: 'Failed to remove contact from campaign' }); }
}

export async function removeContactByContactId(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.campaignId); const contactId = parseInt(req.params.contactId);
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    await db.delete(campaignContacts).where(and(eq(campaignContacts.campaignId, campaignId), eq(campaignContacts.contactId, contactId)));
    res.json({ success: true });
  } catch (error) { console.error('Error removing contact from campaign:', error); res.status(500).json({ error: 'Failed to remove contact from campaign' }); }
}
