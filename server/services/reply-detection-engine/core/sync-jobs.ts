import { db } from "../../../db";
import { sentEmails } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { createBulkDetectionJobs } from "../job-queue";
import type { InsertReplyDetectionJob } from "@shared/schema";
import type { DetectionProvider } from "../types";

export async function syncPendingJobsForUser(userId: number, provider: DetectionProvider): Promise<void> {
  console.log(`[ReplyDetectionEngine] Syncing pending jobs for user ${userId}...`);
  try {
    const pendingSentEmails = await db.select({ id: sentEmails.id, gmailThreadId: sentEmails.gmailThreadId, gmailMessageId: sentEmails.gmailMessageId, contactId: sentEmails.contactId, subject: sentEmails.subject, sentAt: sentEmails.sentAt }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false), sql`${sentEmails.gmailThreadId} IS NOT NULL`, sql`${sentEmails.id} NOT IN (SELECT sent_email_id FROM reply_detection_jobs WHERE user_id = ${userId} AND status NOT IN ('verified', 'dead_letter'))`)).limit(100);
    if (pendingSentEmails.length === 0) { console.log(`[ReplyDetectionEngine] User ${userId}: No pending emails need job creation`); return; }
    console.log(`[ReplyDetectionEngine] User ${userId}: Found ${pendingSentEmails.length} sent emails without detection jobs`);
    const jobsToCreate: InsertReplyDetectionJob[] = pendingSentEmails.map(email => ({ userId, sentEmailId: email.id, contactId: email.contactId!, threadId: email.gmailThreadId!, messageId: email.gmailMessageId || undefined, provider, jobType: "standard" as const, status: "pending" as const, priority: 2, scheduledFor: new Date(), metadata: { subject: email.subject, sentAt: email.sentAt?.toISOString() } }));
    const createdJobs = await createBulkDetectionJobs(jobsToCreate);
    console.log(`[ReplyDetectionEngine] User ${userId}: Created ${createdJobs.length} detection jobs`);
  } catch (error) { console.error(`[ReplyDetectionEngine] User ${userId}: Error syncing pending jobs:`, error); }
}
