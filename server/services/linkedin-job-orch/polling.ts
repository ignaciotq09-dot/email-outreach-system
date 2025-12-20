import { db } from "../../db";
import { linkedinJobQueue } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import type { LinkedinJobQueue } from "@shared/schema";
import type { SendResult } from "./types";
import { updateJobStatus, addAuditLog, createLinkedInMessage } from "./queue-ops";
import { processJob } from "./processor";

export async function checkJobStatus(jobId: number): Promise<void> {
  try {
    const [job] = await db.select().from(linkedinJobQueue).where(eq(linkedinJobQueue.id, jobId));
    if (!job) { return; }
    if (job.status === 'sent' || job.status === 'dead_letter') { return; }
    if (job.status === 'queued') {
      await db.update(linkedinJobQueue).set({ status: 'sent', sendVerified: true, completedAt: new Date(), updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
      await addAuditLog(jobId, 'send_verified', { method: 'cookie_api' });
      await createLinkedInMessage(job);
    }
  } catch (error) { console.error('[LinkedInOrchestrator] Check job status error:', error); }
}

export async function pollPendingJobs(): Promise<number> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingJobs = await db.select().from(linkedinJobQueue).where(and(eq(linkedinJobQueue.status, 'queued'), eq(linkedinJobQueue.webhookReceived, false), lte(linkedinJobQueue.updatedAt, fiveMinutesAgo)));
    console.log(`[LinkedInOrchestrator] Polling ${pendingJobs.length} pending jobs`);
    let checked = 0;
    for (const job of pendingJobs) { await checkJobStatus(job.id); checked++; }
    return checked;
  } catch (error) { console.error('[LinkedInOrchestrator] Poll pending jobs error:', error); return 0; }
}

export async function getDeadLetterJobs(userId: number): Promise<LinkedinJobQueue[]> {
  try { return await db.select().from(linkedinJobQueue).where(and(eq(linkedinJobQueue.userId, userId), eq(linkedinJobQueue.status, 'dead_letter'))); }
  catch (error) { console.error('[LinkedInOrchestrator] Get dead letter jobs error:', error); return []; }
}

export async function retryDeadLetterJob(jobId: number, userId: number): Promise<SendResult> {
  try {
    const [job] = await db.select().from(linkedinJobQueue).where(and(eq(linkedinJobQueue.id, jobId), eq(linkedinJobQueue.userId, userId), eq(linkedinJobQueue.status, 'dead_letter')));
    if (!job) { return { success: false, jobId, error: 'Job not found or not in dead letter queue' }; }
    await db.update(linkedinJobQueue).set({ status: 'pending', retryCount: 0, errorCode: null, errorMessage: null, nextRetryAt: null, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId));
    await addAuditLog(jobId, 'manual_retry_requested', {});
    return await processJob(jobId);
  } catch (error: any) { console.error('[LinkedInOrchestrator] Retry dead letter job error:', error); return { success: false, jobId, error: error.message }; }
}
