import { db } from "../../../db";
import { eq, and, gte, sql } from "drizzle-orm";
import { sentEmails, contacts, replies, replyDetectionAnomalies, type ReplyDetectionJobType } from "@shared/schema";
import { createBulkDetectionJobs } from "../job-queue";
import type { DetectionProvider } from "../types";
import { getExistingPendingJobs } from "./helpers";
import { getGmailClient } from "../../reply-detection/adapters/gmail-adapter";

export async function runInboxCountAudit(userId: number, provider: DetectionProvider): Promise<{ dbReplyCount: number; inboxReplyCount: number; mismatch: boolean; deepScanTriggered: boolean }> {
  console.log(`[InboxAudit] Running inbox count audit for user ${userId}`);
  const result = { dbReplyCount: 0, inboxReplyCount: 0, mismatch: false, deepScanTriggered: false };
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dbReplies = await db.select({ count: sql<number>`COUNT(*)` }).from(replies).where(and(eq(replies.userId, userId), gte(replies.replyReceivedAt, sevenDaysAgo)));
    result.dbReplyCount = Number(dbReplies[0]?.count || 0);
    if (provider === "gmail") { try { const gmail = await getGmailClient(userId); if (gmail) { const listResult = await gmail.users.messages.list({ userId: "me", q: `in:inbox newer_than:7d`, maxResults: 100 }); result.inboxReplyCount = listResult.data.resultSizeEstimate || 0; } } catch (gmailError) { console.error("[InboxAudit] Failed to get Gmail inbox count:", gmailError); } }
    if (result.dbReplyCount === 0 && result.inboxReplyCount > 10) result.mismatch = true;
    if (result.mismatch) {
      console.warn(`[InboxAudit] MISMATCH DETECTED for user ${userId}: DB=${result.dbReplyCount}, Inbox=${result.inboxReplyCount}`);
      await db.insert(replyDetectionAnomalies).values({ userId, sentEmailId: 0, contactId: 0, anomalyType: "count_mismatch", severity: "high", provider, details: { description: `Reply count mismatch: database has ${result.dbReplyCount} replies, inbox shows ${result.inboxReplyCount} messages`, dbReplyCount: result.dbReplyCount, inboxReplyCount: result.inboxReplyCount, lookbackDays: 7 }, requiresManualReview: true, status: "open" });
      const unrepliedEmails = await db.select({ sentEmail: sentEmails, contact: { id: contacts.id, email: contacts.email, name: contacts.name } }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false), gte(sentEmails.sentAt, sevenDaysAgo))).limit(50);
      if (unrepliedEmails.length > 0) {
        const existingJobIds = await getExistingPendingJobs(unrepliedEmails.map(e => e.sentEmail.id));
        const deepScanJobs = unrepliedEmails.filter(e => !existingJobIds.has(e.sentEmail.id)).map(e => ({ userId, sentEmailId: e.sentEmail.id, contactId: e.contact.id, jobType: "deep_scan" as ReplyDetectionJobType, provider, priority: 1, scheduledFor: new Date(), metadata: { gmailThreadId: e.sentEmail.gmailThreadId || undefined, gmailMessageId: e.sentEmail.gmailMessageId || undefined, contactEmail: e.contact.email, contactName: e.contact.name || undefined, subject: e.sentEmail.subject, triggeredBy: "inbox_count_mismatch" } }));
        if (deepScanJobs.length > 0) { await createBulkDetectionJobs(deepScanJobs); result.deepScanTriggered = true; console.log(`[InboxAudit] Deep scan triggered: ${deepScanJobs.length} high-priority jobs created`); }
      }
    } else { console.log(`[InboxAudit] User ${userId}: No mismatch (DB=${result.dbReplyCount})`); }
  } catch (error: any) { console.error(`[InboxAudit] Error for user ${userId}:`, error); }
  return result;
}
