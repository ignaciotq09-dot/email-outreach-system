import type { Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db";
import { sentEmails, campaignContacts, replies, contacts } from "@shared/schema";
import { storage } from "../../storage";
import { checkThreadForAuthenticReplies } from "../../services/reply-detection";
import { detectReplyWithAllLayers, storeEmailAlias, type ComprehensiveDetectionOptions } from "../../services/reply-detection/index.js";
import { checkInboxForContactEmails, getGmailUserEmail } from "../../gmail";
import { processReplyForAutoResponse } from "../../services/auto-reply";
import { AnalyticsService } from "../../analytics";
import { emailsMatch } from "./helpers";

export async function checkReplies(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const pendingEmails = await db.select().from(sentEmails).leftJoin(campaignContacts, eq(sentEmails.campaignContactId, campaignContacts.id)).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false))).orderBy(desc(sentEmails.sentAt)).limit(50);
    const results = []; let newRepliesFound = 0;
    const emailProvider = 'gmail';
    for (const row of pendingEmails) {
      const sentEmail = row.sent_emails; if (!sentEmail.gmailThreadId) continue;
      const opts: ComprehensiveDetectionOptions = { userId, provider: emailProvider, sentEmailId: sentEmail.id, contactId: sentEmail.contactId!, threadId: sentEmail.gmailThreadId };
      const detection = await detectReplyWithAllLayers(opts);
      if (detection.replyFound) {
        const existingReply = await db.select().from(replies).where(eq(replies.sentEmailId, sentEmail.id)).limit(1);
        if (existingReply.length === 0) {
          // Use transaction to ensure atomicity - all or nothing
          await db.transaction(async (tx) => {
            // Step 1: Mark email as replied
            await tx.update(sentEmails).set({ replyReceived: true }).where(eq(sentEmails.id, sentEmail.id));

            // Step 2: Get contact info
            const contact = await tx.select().from(contacts).where(eq(contacts.id, sentEmail.contactId!)).limit(1);

            // Step 3: Create reply record
            const replyRecord = await storage.createReply(userId, { sentEmailId: sentEmail.id, replyContent: detection.replyContent || 'Reply received', replyReceivedAt: new Date() });

            // Step 4: Log analytics
            await AnalyticsService.logEmailReply({ sentEmailId: sentEmail.id, replyId: replyRecord.id, contactId: sentEmail.contactId!, userId });

            // Step 5: Process auto-response (outside transaction is OK - it's async)
            await processReplyForAutoResponse(replyRecord, contact[0], sentEmail);
          });

          results.push({ sentEmailId: sentEmail.id, replyFound: true, detection });
          newRepliesFound++;
        }
      }
    }
    console.log(`[CheckReplies] User ${userId}: Checked ${pendingEmails.length} threads, found ${newRepliesFound} new replies`);
    res.json({ checked: pendingEmails.length, newRepliesFound, details: results });
  } catch (error) { console.error('Error checking replies:', error); res.status(500).json({ error: 'Failed to check for replies' }); }
}

export async function checkThread(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const sentEmailId = parseInt(req.params.sentEmailId);
    const [sentEmail] = await db.select().from(sentEmails).where(and(eq(sentEmails.id, sentEmailId), eq(sentEmails.userId, userId)));
    if (!sentEmail) return res.status(404).json({ error: 'Email not found' });
    if (!sentEmail.gmailThreadId) return res.status(400).json({ error: 'Email has no thread ID' });
    const result = await checkThreadForAuthenticReplies({ userId, threadId: sentEmail.gmailThreadId, sentAt: sentEmail.sentAt || new Date(), contactId: sentEmail.contactId! });
    console.log(`[CheckThread] User ${userId}: Thread ${sentEmail.gmailThreadId} check result:`, result);
    res.json({ sentEmailId, threadId: sentEmail.gmailThreadId, ...result });
  } catch (error) { console.error('Error checking thread:', error); res.status(500).json({ error: 'Failed to check thread' }); }
}

export async function searchContact(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const contactId = parseInt(req.params.contactId);
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    const result = await checkInboxForContactEmails(userId, contact.email);
    console.log(`[SearchContact] User ${userId}: Search for ${contact.email} found ${result.messages?.length || 0} messages`);
    res.json({ contactId, contactEmail: contact.email, ...result });
  } catch (error) { console.error('Error searching contact:', error); res.status(500).json({ error: 'Failed to search contact' }); }
}
