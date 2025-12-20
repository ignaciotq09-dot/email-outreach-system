import { db } from "../../../db";
import { sentEmails, replies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { detectReplyWithAllLayers } from "../index";
import { logAnomaly } from "./anomaly-ledger";
import type { EmailProvider } from "../types";

export async function processEmail(sentEmail: any, contact: { id: number; email: string; name: string | null; company: string | null }, userId: number, provider: EmailProvider): Promise<{ found: boolean; isAnomaly: boolean; error?: string }> {
  try {
    const result = await detectReplyWithAllLayers({ userId, provider, sentEmailId: sentEmail.id, contactId: contact.id, contactEmail: contact.email, contactName: contact.name || undefined, companyName: contact.company || undefined, subject: sentEmail.subject, sentAt: sentEmail.sentAt, gmailThreadId: sentEmail.gmailThreadId || undefined, gmailMessageId: sentEmail.gmailMessageId || undefined });
    await db.update(sentEmails).set({ lastReplyCheck: new Date() }).where(eq(sentEmails.id, sentEmail.id));
    let isAnomaly = false;
    if (!result.quorumMet) { logAnomaly({ type: 'quorum_failure', sentEmailId: sentEmail.id, contactId: contact.id, userId, provider, timestamp: new Date(), details: `Only ${result.healthyLayersCount}/${result.totalLayersChecked} layers healthy`, requiresManualReview: true }, contact.email, sentEmail.subject, sentEmail.sentAt); isAnomaly = true; }
    if (result.found && result.replies && result.replies.length > 0) {
      for (const reply of result.replies) {
        const existingReply = await db.select().from(replies).where(eq(replies.gmailMessageId, reply.gmailMessageId)).limit(1);
        if (existingReply.length === 0) { logAnomaly({ type: 'missed_reply', sentEmailId: sentEmail.id, contactId: contact.id, userId, provider, timestamp: new Date(), details: `Reply from ${reply.detectedAlias || contact.email} missed, caught in reconciliation`, requiresManualReview: false }); await db.insert(replies).values({ sentEmailId: sentEmail.id, replyReceivedAt: reply.receivedAt, replyContent: reply.content, gmailMessageId: reply.gmailMessageId }); await db.update(sentEmails).set({ replyReceived: true }).where(eq(sentEmails.id, sentEmail.id)); isAnomaly = true; }
      }
    }
    return { found: result.found, isAnomaly };
  } catch (error: any) { return { found: false, isAnomaly: true, error: error?.message || 'Unknown error' }; }
}
