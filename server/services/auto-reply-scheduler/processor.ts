import { db } from "../../db";
import { eq, desc, and, gte, sql, or } from "drizzle-orm";
import { replies, sentEmails, contacts, autoReplyLogs } from "@shared/schema";
import { processReplyForAutoResponse } from "../auto-reply";
import type { ProcessResult } from "./types";
import { getReplyProcessingStatus, getRetryableReplyIds, shouldProcessReply } from "./queries";
import { escalateExhaustedRetries } from "./escalation";

async function getUnprocessedReplies(userId: number): Promise<Array<{ replyId: number; replyContent: string; contactId: number; contactEmail: string; contactName: string; originalSubject: string; provider: 'gmail'; isRetry: boolean; attemptCount: number; }>> {
  const processingStatus = await getReplyProcessingStatus(userId); const retryableIds = await getRetryableReplyIds(userId);
  const recentReplies = await db.select({ replyId: replies.id, replyContent: replies.replyContent, contactId: contacts.id, contactEmail: contacts.email, contactName: contacts.name, originalSubject: sentEmails.subject, replyReceivedAt: replies.replyReceivedAt }).from(replies).innerJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id)).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(and(eq(replies.userId, userId), or(gte(replies.replyReceivedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)), sql`${replies.id} IN (${Array.from(retryableIds).join(',') || 'NULL'})`))).orderBy(desc(replies.replyReceivedAt)).limit(100);
  return recentReplies.filter(r => { const decision = shouldProcessReply(processingStatus.get(r.replyId)); return decision.shouldProcess; }).map(r => { const status = processingStatus.get(r.replyId); const decision = shouldProcessReply(status); return { replyId: r.replyId, replyContent: r.replyContent || '', contactId: r.contactId, contactEmail: r.contactEmail, contactName: r.contactName || '', originalSubject: r.originalSubject || 'Your inquiry', provider: 'gmail' as const, isRetry: decision.reason === 'retry', attemptCount: status?.attemptCount || 0 }; });
}

export async function processUserReplies(userId: number): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, autoRepliesSent: 0, flaggedForReview: 0, retried: 0, escalated: 0, errors: 0 };
  try {
    result.escalated = await escalateExhaustedRetries(userId);
    const unprocessedReplies = await getUnprocessedReplies(userId);
    if (unprocessedReplies.length === 0) return result;
    console.log(`[AutoReplyScheduler] User ${userId}: Processing ${unprocessedReplies.length} replies`);
    for (const reply of unprocessedReplies) {
      if (reply.isRetry) { console.log(`[AutoReplyScheduler] User ${userId}: Retrying reply ${reply.replyId} (attempt ${reply.attemptCount + 1})`); result.retried++; }
      try { const autoReplyResult = await processReplyForAutoResponse(userId, reply.replyId, reply.replyContent, reply.contactId, reply.contactEmail, reply.contactName, reply.originalSubject, reply.provider); result.processed++; if (autoReplyResult.autoReplySent) { result.autoRepliesSent++; console.log(`[AutoReplyScheduler] User ${userId}: Auto-reply sent for reply ${reply.replyId}`); } if (autoReplyResult.flaggedForReview) { result.flaggedForReview++; console.log(`[AutoReplyScheduler] User ${userId}: Reply ${reply.replyId} flagged for review`); } if (!autoReplyResult.processed && autoReplyResult.error) { console.log(`[AutoReplyScheduler] User ${userId}: Reply ${reply.replyId} processing failed: ${autoReplyResult.error}`); await db.insert(autoReplyLogs).values({ userId, replyId: reply.replyId, contactId: reply.contactId, originalReplyContent: reply.replyContent.substring(0, 1000), intentConfidence: 0, intentType: 'processing_error', autoReplyContent: null, status: 'error', errorMessage: autoReplyResult.error }); result.errors++; } } catch (error: any) { console.error(`[AutoReplyScheduler] User ${userId}: Exception processing reply ${reply.replyId}:`, error.message); try { await db.insert(autoReplyLogs).values({ userId, replyId: reply.replyId, contactId: reply.contactId, originalReplyContent: reply.replyContent.substring(0, 1000), intentConfidence: 0, intentType: 'exception', autoReplyContent: null, status: 'error', errorMessage: error.message }); } catch (logError: any) { console.error(`[AutoReplyScheduler] User ${userId}: Failed to log error for reply ${reply.replyId}`); } result.errors++; }
    }
  } catch (error: any) { console.error(`[AutoReplyScheduler] User ${userId}: Error getting replies:`, error.message); result.errors++; }
  return result;
}
