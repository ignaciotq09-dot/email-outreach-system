import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { followUpJobs, followUpJobAudit, followUpDeadLetter, contacts } from "@shared/schema";
import { MAX_RETRY_ATTEMPTS, RETRY_SCHEDULE } from "../types";

async function logAudit(jobId: number, action: string, details: Partial<{ previousStatus: string | null; newStatus: string; message: string; errorDetails: string; healthCheckResult: any; sendResult: any; verificationResult: any; processingTimeMs: number; }>): Promise<void> { try { await db.insert(followUpJobAudit).values({ jobId, action, previousStatus: details.previousStatus, newStatus: details.newStatus, message: details.message, errorDetails: details.errorDetails, healthCheckResult: details.healthCheckResult, sendResult: details.sendResult, verificationResult: details.verificationResult, processingTimeMs: details.processingTimeMs }); } catch (error) { console.error(`[FollowUpQueue] Failed to log audit for job ${jobId}:`, error); } }

export async function createJob(params: { campaignId?: number; contactId: number; originalEmailId: number; sequenceId?: number; stepId?: number; stepNumber: number; scheduledFor: Date; subject?: string; body?: string; metadata?: any; }): Promise<number> {
  const [job] = await db.insert(followUpJobs).values({ campaignId: params.campaignId, contactId: params.contactId, originalEmailId: params.originalEmailId, sequenceId: params.sequenceId, stepId: params.stepId, stepNumber: params.stepNumber, scheduledFor: params.scheduledFor, dueAt: params.scheduledFor, subject: params.subject, body: params.body, status: 'pending', attemptCount: 0, maxAttempts: MAX_RETRY_ATTEMPTS, metadata: params.metadata }).returning({ id: followUpJobs.id });
  await logAudit(job.id, 'created', { message: `Job created, scheduled for ${params.scheduledFor.toISOString()}`, newStatus: 'pending' });
  return job.id;
}

export async function updateStatus(jobId: number, status: string, extraFields?: any): Promise<void> {
  await db.update(followUpJobs).set({ status: status as any, updatedAt: new Date(), ...extraFields }).where(eq(followUpJobs.id, jobId));
  await logAudit(jobId, `status_${status}`, { newStatus: status });
}

export async function incrementAttempt(jobId: number): Promise<number> { const [job] = await db.update(followUpJobs).set({ attemptCount: sql`${followUpJobs.attemptCount} + 1`, lastAttemptAt: new Date(), updatedAt: new Date() }).where(eq(followUpJobs.id, jobId)).returning({ attemptCount: followUpJobs.attemptCount }); return job.attemptCount || 1; }

export async function scheduleRetry(jobId: number, attemptCount: number, error: string): Promise<Date | null> {
  if (attemptCount >= MAX_RETRY_ATTEMPTS) { await moveToDeadLetter(jobId, `Max retries (${MAX_RETRY_ATTEMPTS}) exhausted: ${error}`); return null; }
  const schedule = RETRY_SCHEDULE[attemptCount - 1] || RETRY_SCHEDULE[RETRY_SCHEDULE.length - 1]; const nextRetryAt = new Date(Date.now() + schedule.delayMs);
  const [job] = await db.select().from(followUpJobs).where(eq(followUpJobs.id, jobId));
  const errorHistory = (job?.errorHistory || []) as Array<{ attempt: number; error: string; timestamp: string }>; errorHistory.push({ attempt: attemptCount, error, timestamp: new Date().toISOString() });
  await db.update(followUpJobs).set({ status: 'failed', nextRetryAt, lastError: error, errorHistory, updatedAt: new Date() }).where(eq(followUpJobs.id, jobId));
  await logAudit(jobId, 'retry_scheduled', { message: `Retry #${attemptCount + 1} scheduled for ${schedule.delayDescription} (${nextRetryAt.toISOString()})`, newStatus: 'failed', errorDetails: error });
  return nextRetryAt;
}

export async function moveToDeadLetter(jobId: number, reason: string): Promise<number> {
  const [job] = await db.select().from(followUpJobs).where(eq(followUpJobs.id, jobId)); if (!job) throw new Error(`Job ${jobId} not found`);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, job.contactId));
  const [deadLetter] = await db.insert(followUpDeadLetter).values({ jobId, originalEmailId: job.originalEmailId, contactId: job.contactId, reason, totalAttempts: job.attemptCount || 0, errorSummary: job.lastError, fullContext: { subject: job.subject || undefined, body: job.body || undefined, contactEmail: contact?.email, contactName: contact?.name || undefined, campaignId: job.campaignId || undefined, sequenceId: job.sequenceId || undefined, stepNumber: job.stepNumber, errorHistory: job.errorHistory as any }, reviewStatus: 'pending' }).returning({ id: followUpDeadLetter.id });
  await db.update(followUpJobs).set({ status: 'dead', lastError: reason, updatedAt: new Date(), metadata: { ...(job.metadata as any || {}), deadLetterReason: reason, deadLetterId: deadLetter.id } }).where(eq(followUpJobs.id, jobId));
  await logAudit(jobId, 'dead_letter', { message: reason, previousStatus: job.status, newStatus: 'dead' });
  console.log(`[FollowUpQueue] Job ${jobId} moved to dead letter queue: ${reason}`);
  return deadLetter.id;
}

export async function cancelJob(jobId: number, reason: string): Promise<void> { await db.update(followUpJobs).set({ status: 'cancelled', lastError: reason, completedAt: new Date(), updatedAt: new Date(), metadata: sql`jsonb_set(COALESCE(${followUpJobs.metadata}, '{}'), '{stoppedReason}', ${JSON.stringify(reason)}::jsonb)` }).where(eq(followUpJobs.id, jobId)); await logAudit(jobId, 'cancelled', { message: reason, newStatus: 'cancelled' }); }
