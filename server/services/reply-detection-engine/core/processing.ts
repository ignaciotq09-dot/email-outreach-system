import { getQueuedJobs, getFailedJobsForRetry, scheduleRetry } from "../job-queue";
import { processDetectionJob } from "../processor";
import { ENGINE_CONFIG } from "../types";
import type { ReplyDetectionJob } from "@shared/schema";

export interface ProcessingState { processingCount: number; maxConcurrent: number; perUserProcessingCount: Map<number, number>; maxPerUserConcurrent: number; }

export async function processQueuedJobs(state: ProcessingState): Promise<void> {
  if (state.processingCount >= state.maxConcurrent) return;
  const availableSlots = state.maxConcurrent - state.processingCount;
  const jobs = await getQueuedJobs(availableSlots * 2);
  if (jobs.length === 0) return;
  const eligibleJobs: ReplyDetectionJob[] = [];
  for (const job of jobs) {
    const userCount = state.perUserProcessingCount.get(job.userId) || 0;
    if (userCount < state.maxPerUserConcurrent && eligibleJobs.length < availableSlots) { eligibleJobs.push(job); state.perUserProcessingCount.set(job.userId, userCount + 1); }
  }
  if (eligibleJobs.length === 0) return;
  console.log(`[ReplyDetectionEngine] Processing ${eligibleJobs.length} queued jobs (per-user limits enforced)`);
  const promises = eligibleJobs.map(job => processJobWithTracking(job, state));
  await Promise.allSettled(promises);
}

async function processJobWithTracking(job: ReplyDetectionJob, state: ProcessingState): Promise<void> {
  state.processingCount++;
  try { await processDetectionJob(job); }
  catch (error) { console.error(`[ReplyDetectionEngine] Job ${job.id} processing error:`, error); }
  finally {
    state.processingCount--;
    const userCount = state.perUserProcessingCount.get(job.userId) || 1;
    if (userCount <= 1) state.perUserProcessingCount.delete(job.userId);
    else state.perUserProcessingCount.set(job.userId, userCount - 1);
  }
}

export async function processRetryQueue(): Promise<void> {
  const retryJobs = await getFailedJobsForRetry(5);
  for (const job of retryJobs) {
    console.log(`[ReplyDetectionEngine] Scheduling retry for job ${job.id} (attempt ${(job.attemptCount || 0) + 1})`);
    await scheduleRetry(job.id, job.attemptCount || 0);
  }
}
