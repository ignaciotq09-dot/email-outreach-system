import { db } from "../../../db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { sentEmails, contacts, type ReplyDetectionJobType } from "@shared/schema";
import { createBulkDetectionJobs } from "../job-queue";
import { ENGINE_CONFIG, type DetectionProvider } from "../types";
import { getExistingPendingJobs, startReconciliationRun, completeReconciliationRun } from "./helpers";
import { runInboxCountAudit } from "./inbox-audit";

export async function runHourlyReconciliation(userId: number, provider: DetectionProvider): Promise<{ emailsChecked: number; jobsCreated: number; errors: string[] }> {
  const startTime = Date.now();
  const runId = await startReconciliationRun(userId, "hourly");
  const result = { emailsChecked: 0, jobsCreated: 0, errors: [] as string[] };
  try {
    console.log(`[ReplyReconciliation] Starting hourly scan for user ${userId}`);
    const { hourlyLookbackHours, hourlyMinCheckAgeHours } = ENGINE_CONFIG.reconciliation;
    const lookbackDate = new Date(Date.now() - hourlyLookbackHours * 60 * 60 * 1000);
    const minCheckAge = new Date(Date.now() - hourlyMinCheckAgeHours * 60 * 60 * 1000);
    const emailsToCheck = await db.select({ sentEmail: sentEmails, contact: { id: contacts.id, email: contacts.email, name: contacts.name, company: contacts.company } }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false), gte(sentEmails.sentAt, lookbackDate), sql`(${sentEmails.lastReplyCheck} IS NULL OR ${sentEmails.lastReplyCheck} < ${minCheckAge})`)).orderBy(desc(sentEmails.sentAt)).limit(100);
    result.emailsChecked = emailsToCheck.length;
    console.log(`[ReplyReconciliation] Found ${emailsToCheck.length} emails needing check`);
    if (emailsToCheck.length > 0) {
      const existingJobIds = await getExistingPendingJobs(emailsToCheck.map(e => e.sentEmail.id));
      const newJobs = emailsToCheck.filter(e => !existingJobIds.has(e.sentEmail.id)).map(e => ({ userId, sentEmailId: e.sentEmail.id, contactId: e.contact.id, jobType: "reconciliation" as ReplyDetectionJobType, provider, priority: 10, scheduledFor: new Date(), metadata: { gmailThreadId: e.sentEmail.gmailThreadId || undefined, gmailMessageId: e.sentEmail.gmailMessageId || undefined, contactEmail: e.contact.email, contactName: e.contact.name || undefined, subject: e.sentEmail.subject, sentAt: e.sentEmail.sentAt?.toISOString() || new Date().toISOString(), triggeredBy: "hourly_reconciliation" } }));
      if (newJobs.length > 0) { await createBulkDetectionJobs(newJobs); result.jobsCreated = newJobs.length; }
    }
  } catch (error: any) { result.errors.push(error.message); console.error("[ReplyReconciliation] Hourly scan error:", error); }
  const durationMs = Date.now() - startTime;
  await completeReconciliationRun(runId, result, durationMs);
  console.log(`[ReplyReconciliation] Hourly scan complete in ${durationMs}ms:`, result);
  try { await runInboxCountAudit(userId, provider); } catch (error: any) { console.error(`[ReplyReconciliation] Inbox count audit error for user ${userId}:`, error); }
  return result;
}
