import type { gmail_v1 } from 'googleapis';
import { db } from "../../../db";
import { processedGmailMessages } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { MessageAnalysis } from './types';

export async function isMessageProcessed(userId: number, gmailMessageId: string): Promise<boolean> {
  const existing = await db.select({ id: processedGmailMessages.id }).from(processedGmailMessages).where(and(eq(processedGmailMessages.userId, userId), eq(processedGmailMessages.gmailMessageId, gmailMessageId))).limit(1);
  return existing.length > 0;
}

export async function markMessageProcessed(userId: number, message: gmail_v1.Schema$Message, analysis: MessageAnalysis, matchedSentEmailId?: number, matchedContactId?: number, detectionLayer?: string): Promise<void> {
  await db.insert(processedGmailMessages).values({
    userId,
    gmailMessageId: message.id || '',
    gmailThreadId: message.threadId || null,
    messageIdHeader: analysis.messageId || null,
    inReplyToHeader: analysis.inReplyTo || null,
    referencesHeader: analysis.references.length > 0 ? analysis.references.join(' ') : null,
    fromEmail: analysis.from,
    subject: analysis.subject,
    receivedAt: analysis.receivedAt,
    isReply: analysis.isReply,
    isAutoReply: analysis.isAutoReply,
    isBounce: analysis.isBounce,
    matchedSentEmailId: matchedSentEmailId || null,
    matchedContactId: matchedContactId || null,
    detectionLayer: detectionLayer || null,
    processingNotes: analysis.isAutoReply ? 'Filtered: auto-reply' : analysis.isBounce ? 'Filtered: bounce' : null
  });
}
