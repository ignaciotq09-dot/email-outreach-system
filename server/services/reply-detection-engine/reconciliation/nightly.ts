import { db } from "../../../db";
import { eq, and, desc } from "drizzle-orm";
import { sentEmails, contacts, type ReplyDetectionJobType } from "@shared/schema";
import { createBulkDetectionJobs } from "../job-queue";
import { ENGINE_CONFIG, type DetectionProvider } from "../types";
import { getExistingPendingJobs, startReconciliationRun, completeReconciliationRun } from "./helpers";

export async function runNightlyReconciliation(userId: number, provider: DetectionProvider): Promise<{ emailsChecked: number; jobsCreated: number; errors: string[] }> {
  const startTime = Date.now();
  const runId = await startReconciliationRun(userId, "nightly");
  const result = { emailsChecked: 0, jobsCreated: 0, errors: [] as string[] };
  try {
    console.log(`[ReplyReconciliation] Starting nightly full sweep for user ${userId}`);
    const { nightlyMaxEmails } = ENGINE_CONFIG.reconciliation;
    const emailsToCheck = await db.select({ sentEmail: sentEmails, contact: { id: contacts.id, email: contacts.email, name: contacts.name, company: contacts.company } }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false))).orderBy(desc(sentEmails.sentAt)).limit(nightlyMaxEmails);
    result.emailsChecked = emailsToCheck.length;
    console.log(`[ReplyReconciliation] Found ${emailsToCheck.length} emails without replies`);
    if (emailsToCheck.length > 0) {
      const existingJobIds = await getExistingPendingJobs(emailsToCheck.map(e => e.sentEmail.id));
      const newJobs = emailsToCheck.filter(e => !existingJobIds.has(e.sentEmail.id)).map(e => ({ userId, sentEmailId: e.sentEmail.id, contactId: e.contact.id, jobType: "reconciliation" as ReplyDetectionJobType, provider, priority: 15, scheduledFor: new Date(), metadata: { gmailThreadId: e.sentEmail.gmailThreadId || undefined, gmailMessageId: e.sentEmail.gmailMessageId || undefined, contactEmail: e.contact.email, contactName: e.contact.name || undefined, subject: e.sentEmail.subject, sentAt: e.sentEmail.sentAt?.toISOString() || new Date().toISOString(), triggeredBy: "nightly_reconciliation" } }));
      if (newJobs.length > 0) { await createBulkDetectionJobs(newJobs); result.jobsCreated = newJobs.length; }
    }
  } catch (error: any) { result.errors.push(error.message); console.error("[ReplyReconciliation] Nightly sweep error:", error); }
  const durationMs = Date.now() - startTime;
  await completeReconciliationRun(runId, result, durationMs);
  console.log(`[ReplyReconciliation] Nightly sweep complete in ${durationMs}ms:`, result);
  return result;
}
