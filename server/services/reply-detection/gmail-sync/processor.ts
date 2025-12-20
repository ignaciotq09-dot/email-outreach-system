import type { gmail_v1 } from 'googleapis';
import { db } from "../../../db";
import { sentEmails, replies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { analyzeMessage } from './message-analyzer';
import { isMessageProcessed, markMessageProcessed } from './deduplication';
import { logAudit, findMatchingSentEmailByHeaders, findMatchingSentEmailBySender } from './matching';
import { withRetry } from "../retry";

export async function processMessage(userId: number, gmail: gmail_v1.Gmail, messageId: string): Promise<{ wasReply: boolean; wasAutoReply: boolean; wasBounce: boolean; wasDuplicate: boolean }> {
  const result = { wasReply: false, wasAutoReply: false, wasBounce: false, wasDuplicate: false };
  const alreadyProcessed = await isMessageProcessed(userId, messageId);
  if (alreadyProcessed) { result.wasDuplicate = true; return result; }
  
  const messageData = await withRetry(() => gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' }), 'Get Gmail message', { maxRetries: 3, initialDelay: 500 });
  if (!messageData?.data) return result;
  
  const analysis = analyzeMessage(messageData.data);
  if (analysis.isAutoReply) { result.wasAutoReply = true; await markMessageProcessed(userId, messageData.data, analysis); return result; }
  if (analysis.isBounce) { result.wasBounce = true; await markMessageProcessed(userId, messageData.data, analysis); return result; }
  if (!analysis.isReply) { await markMessageProcessed(userId, messageData.data, analysis); return result; }
  
  let match = await findMatchingSentEmailByHeaders(userId, analysis);
  let detectionLayer = 'header_correlation';
  if (!match) { match = await findMatchingSentEmailBySender(userId, analysis.from, messageData.data.threadId || undefined); detectionLayer = 'sender_matching'; }
  
  if (match) {
    result.wasReply = true;
    await db.update(sentEmails).set({ replyReceived: true, replyReceivedAt: analysis.receivedAt }).where(eq(sentEmails.id, match.sentEmailId));
    await db.insert(replies).values({ userId, sentEmailId: match.sentEmailId, contactId: match.contactId, subject: analysis.subject, body: analysis.content, receivedAt: analysis.receivedAt, gmailMessageId: messageId, gmailThreadId: messageData.data.threadId || null, detectionLayer, metadata: { from: analysis.from, messageId: analysis.messageId, inReplyTo: analysis.inReplyTo, references: analysis.references } });
    await markMessageProcessed(userId, messageData.data, analysis, match.sentEmailId, match.contactId, detectionLayer);
    await logAudit({ userId, sentEmailId: match.sentEmailId, contactId: match.contactId, gmailMessageId: messageId, gmailThreadId: messageData.data.threadId || undefined, detectionLayer, detectionMethod: 'gmail_history_api', resultFound: true, matchReason: `Matched via ${detectionLayer}` });
  } else {
    await markMessageProcessed(userId, messageData.data, analysis);
    await logAudit({ userId, gmailMessageId: messageId, gmailThreadId: messageData.data.threadId || undefined, detectionLayer: 'no_match', detectionMethod: 'gmail_history_api', resultFound: false, noMatchReason: 'No matching sent email found' });
  }
  return result;
}
