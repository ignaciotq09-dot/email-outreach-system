import { db } from "../../db";
import { linkedinJobQueue, linkedinSettings, linkedinMessages } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import type { InsertLinkedinJobQueue, LinkedinJobQueue } from "@shared/schema";
import type { SendResult, JobStats } from "./types";
import { RETRY_DELAYS } from "./types";

export async function queueJob(job: InsertLinkedinJobQueue): Promise<number> {
  try {
    const [inserted] = await db.insert(linkedinJobQueue).values({ ...job, status: 'pending', retryCount: 0, auditLog: [{ timestamp: new Date().toISOString(), event: 'job_created', details: { jobType: job.jobType } }] }).returning({ id: linkedinJobQueue.id });
    console.log('[LinkedInOrchestrator] Job queued:', inserted.id);
    return inserted.id;
  } catch (error: any) { console.error('[LinkedInOrchestrator] Queue job error:', error); throw error; }
}

export async function updateJobStatus(jobId: number, status: string): Promise<void> {
  await db.update(linkedinJobQueue).set({ status, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
}

export async function addAuditLog(jobId: number, event: string, details: Record<string, any>): Promise<void> {
  try {
    const [job] = await db.select({ auditLog: linkedinJobQueue.auditLog }).from(linkedinJobQueue).where(eq(linkedinJobQueue.id, jobId));
    const currentLog = (job?.auditLog as Array<{ timestamp: string; event: string; details: Record<string, any> }>) || [];
    const newEntry = { timestamp: new Date().toISOString(), event, details };
    await db.update(linkedinJobQueue).set({ auditLog: [...currentLog, newEntry], updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
  } catch (error) { console.error('[LinkedInOrchestrator] Error adding audit log:', error); }
}

export async function scheduleRetry(jobId: number, errorCode: string, errorMessage: string, retryCount: number): Promise<SendResult> {
  const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
  const nextRetryAt = new Date(Date.now() + delay);
  await db.update(linkedinJobQueue).set({ status: 'retry', retryCount: retryCount + 1, errorCode, errorMessage, nextRetryAt, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
  await addAuditLog(jobId, 'retry_scheduled', { retryCount: retryCount + 1, nextRetryAt: nextRetryAt.toISOString(), errorCode, errorMessage });
  console.log(`[LinkedInOrchestrator] Job ${jobId} scheduled for retry at ${nextRetryAt.toISOString()}`);
  return { success: false, jobId, error: `Retry scheduled for ${nextRetryAt.toISOString()}` };
}

export async function moveToDeadLetter(jobId: number, errorCode: string, errorMessage: string): Promise<SendResult> {
  await db.update(linkedinJobQueue).set({ status: 'dead_letter', errorCode, errorMessage, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
  await addAuditLog(jobId, 'moved_to_dead_letter', { reason: 'Max retries exceeded', errorCode, errorMessage });
  console.log(`[LinkedInOrchestrator] Job ${jobId} moved to dead letter queue`);
  return { success: false, jobId, error: `Max retries exceeded: ${errorMessage}` };
}

export async function createLinkedInMessage(job: LinkedinJobQueue): Promise<void> {
  try {
    await db.insert(linkedinMessages).values({ userId: job.userId, contactId: job.contactId, campaignId: job.campaignId, linkedinProfileUrl: job.linkedinProfileUrl, messageType: job.jobType, message: job.message, personalizedMessage: job.personalizedMessage, status: 'sent', sentAt: new Date() });
    console.log('[LinkedInOrchestrator] LinkedIn message record created for job:', job.id);
  } catch (error) { console.error('[LinkedInOrchestrator] Create LinkedIn message error:', error); }
}

export async function incrementDailyCount(userId: number, jobType: string): Promise<void> {
  if (jobType === 'connection_request') { await db.update(linkedinSettings).set({ connectionsSentToday: sql`${linkedinSettings.connectionsSentToday} + 1`, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); }
  else { await db.update(linkedinSettings).set({ messagesSentToday: sql`${linkedinSettings.messagesSentToday} + 1`, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); }
}

export async function getJobStats(userId: number): Promise<JobStats> {
  try {
    const stats = await db.select({ status: linkedinJobQueue.status, count: sql<number>`COUNT(*)` }).from(linkedinJobQueue).where(eq(linkedinJobQueue.userId, userId)).groupBy(linkedinJobQueue.status);
    const result: JobStats = { pending: 0, queued: 0, processing: 0, sent: 0, failed: 0, deadLetter: 0, retry: 0 };
    for (const stat of stats) { const status = stat.status as keyof JobStats; if (status === 'dead_letter') { result.deadLetter = Number(stat.count); } else if (status in result) { result[status] = Number(stat.count); } }
    return result;
  } catch (error) { console.error('[LinkedInOrchestrator] Get job stats error:', error); return { pending: 0, queued: 0, processing: 0, sent: 0, failed: 0, deadLetter: 0, retry: 0 }; }
}
