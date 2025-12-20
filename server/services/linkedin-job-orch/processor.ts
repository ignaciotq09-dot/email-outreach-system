import { db } from "../../db";
import { linkedinJobQueue } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { LinkedInCookieApiService } from "../linkedin-cookie-api";
import type { SendResult } from "./types";
import { runPreflightChecks } from "./preflight";
import { updateJobStatus, addAuditLog, scheduleRetry, moveToDeadLetter, createLinkedInMessage, incrementDailyCount } from "./queue-ops";

export async function processJob(jobId: number): Promise<SendResult> {
  try {
    const [job] = await db.select().from(linkedinJobQueue).where(eq(linkedinJobQueue.id, jobId));
    if (!job) { return { success: false, jobId, error: 'Job not found' }; }
    if (job.status !== 'pending' && job.status !== 'retry') { return { success: false, jobId, error: `Job in invalid state: ${job.status}` }; }
    await updateJobStatus(jobId, 'processing');
    await addAuditLog(jobId, 'processing_started', {});
    const preflight = await runPreflightChecks(job.userId, job.jobType);
    if (!preflight.passed) { await addAuditLog(jobId, 'preflight_failed', { errors: preflight.errors }); if (job.retryCount < 3) { return scheduleRetry(jobId, 'PREFLIGHT_FAILED', preflight.errors.join(', '), job.retryCount); } return moveToDeadLetter(jobId, 'PREFLIGHT_FAILED', preflight.errors.join(', ')); }
    let result: any;
    if (job.jobType === 'connection_request') { result = await LinkedInCookieApiService.sendConnectionRequest(job.userId, job.linkedinProfileUrl, job.message || undefined); }
    else { result = await LinkedInCookieApiService.sendDirectMessage(job.userId, job.linkedinProfileUrl, job.personalizedMessage || job.message || ''); }
    if (!result.success) { const errorCode = result.error?.includes('Rate limited') ? 'RATE_LIMITED' : result.error?.includes('Session') ? 'SESSION_INVALID' : 'API_ERROR'; await addAuditLog(jobId, 'send_failed', { error: result.error, errorCode }); if (job.retryCount < 3) { return scheduleRetry(jobId, errorCode, result.error || 'Unknown error', job.retryCount); } return moveToDeadLetter(jobId, errorCode, result.error || 'Unknown error'); }
    await db.update(linkedinJobQueue).set({ status: 'sent', sendVerified: true, completedAt: new Date(), updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
    await addAuditLog(jobId, 'sent_successfully', { method: 'cookie_api' });
    await createLinkedInMessage(job);
    await incrementDailyCount(job.userId, job.jobType);
    console.log(`[LinkedInOrchestrator] Job ${jobId} completed successfully`);
    return { success: true, jobId };
  } catch (error: any) { console.error('[LinkedInOrchestrator] Process job error:', error); await addAuditLog(jobId, 'processing_error', { error: error.message }); return { success: false, jobId, error: error.message }; }
}

export async function processPendingJobs(): Promise<number> {
  try {
    const pendingJobs = await db.select().from(linkedinJobQueue).where(eq(linkedinJobQueue.status, 'pending')).limit(10);
    if (pendingJobs.length === 0) { return 0; }
    console.log(`[LinkedInOrchestrator] Processing ${pendingJobs.length} pending jobs`);
    let processed = 0;
    for (const job of pendingJobs) { const result = await processJob(job.id); if (result.success) { processed++; } await new Promise(resolve => setTimeout(resolve, 2000)); }
    return processed;
  } catch (error) { console.error('[LinkedInOrchestrator] Pending jobs processing error:', error); return 0; }
}

export async function processRetryQueue(): Promise<number> {
  try {
    const now = new Date();
    const jobsToRetry = await db.select().from(linkedinJobQueue).where(and(eq(linkedinJobQueue.status, 'retry'), lte(linkedinJobQueue.nextRetryAt, now)));
    console.log(`[LinkedInOrchestrator] Found ${jobsToRetry.length} jobs to retry`);
    let processed = 0;
    for (const job of jobsToRetry) { const result = await processJob(job.id); if (result.success) { processed++; } }
    return processed;
  } catch (error) { console.error('[LinkedInOrchestrator] Retry queue processing error:', error); return 0; }
}
