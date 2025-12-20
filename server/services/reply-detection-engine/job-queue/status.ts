import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { replyDetectionJobs, replyDetectionDeadLetter, type ReplyDetectionJob, type ReplyDetectionJobStatus, type InsertReplyDetectionDeadLetterEntry } from "@shared/schema";
import { getNextRetryDelay, shouldMoveToDeadLetter, type JobProcessingResult } from "../types";

export async function updateJobStatus(jobId: number, status: ReplyDetectionJobStatus, additionalData?: Partial<ReplyDetectionJob>): Promise<void> { await db.update(replyDetectionJobs).set({ status, updatedAt: new Date(), ...additionalData }).where(eq(replyDetectionJobs.id, jobId)); }

export async function markJobExecuting(job: ReplyDetectionJob): Promise<void> { await db.update(replyDetectionJobs).set({ status: "executing", startedAt: new Date(), attempts: job.attempts + 1, updatedAt: new Date() }).where(eq(replyDetectionJobs.id, job.id)); }

export async function markJobVerified(job: ReplyDetectionJob, result: JobProcessingResult): Promise<void> { await db.update(replyDetectionJobs).set({ status: "verified", completedAt: new Date(), layersExecuted: result.layerResults.length, layersHealthy: result.quorumResult.healthyLayers.length, quorumMet: result.quorumResult.quorumMet, replyFound: result.replyFound, lastError: null, updatedAt: new Date() }).where(eq(replyDetectionJobs.id, job.id)); }

export async function markJobFailed(job: ReplyDetectionJob, error: string, result?: JobProcessingResult): Promise<void> {
  const newErrorCount = job.errorCount + 1;
  if (shouldMoveToDeadLetter(job.attempts)) { await moveToDeadLetter(job, error, result); return; }
  const retryDelay = getNextRetryDelay(job.attempts); const nextRetryAt = new Date(Date.now() + retryDelay);
  await db.update(replyDetectionJobs).set({ status: "failed", lastError: error, errorCount: newErrorCount, nextRetryAt, layersExecuted: result?.layerResults.length, layersHealthy: result?.quorumResult.healthyLayers.length, quorumMet: result?.quorumResult.quorumMet, updatedAt: new Date() }).where(eq(replyDetectionJobs.id, job.id));
  console.log(`[ReplyDetectionQueue] Job ${job.id} failed (attempt ${job.attempts}), retry at ${nextRetryAt}`);
}

async function moveToDeadLetter(job: ReplyDetectionJob, error: string, result?: JobProcessingResult): Promise<void> {
  const failureHistory = []; for (let i = 1; i <= job.attempts; i++) failureHistory.push({ attemptNumber: i, timestamp: new Date().toISOString(), error: i === job.attempts ? error : "Previous attempt failed", layersHealthy: result?.quorumResult.healthyLayers.length || 0, quorumMet: result?.quorumResult.quorumMet || false });
  const deadLetterEntry: InsertReplyDetectionDeadLetterEntry = { jobId: job.id, userId: job.userId, sentEmailId: job.sentEmailId, contactId: job.contactId, totalAttempts: job.attempts, lastAttemptAt: new Date(), failureHistory, jobContext: { provider: job.provider, contactEmail: job.metadata?.contactEmail || "unknown", contactName: job.metadata?.contactName, subject: job.metadata?.subject || "Unknown Subject", sentAt: job.metadata?.sentAt || new Date().toISOString(), gmailThreadId: job.metadata?.gmailThreadId, gmailMessageId: job.metadata?.gmailMessageId, lastRunDetails: result }, status: "pending_review" };
  await db.insert(replyDetectionDeadLetter).values(deadLetterEntry as any);
  await db.update(replyDetectionJobs).set({ status: "dead", lastError: error, updatedAt: new Date() }).where(eq(replyDetectionJobs.id, job.id));
  console.log(`[ReplyDetectionQueue] Job ${job.id} moved to dead letter queue after ${job.attempts} attempts`);
}

export async function scheduleRetry(jobId: number): Promise<void> {
  const [job] = await db.select().from(replyDetectionJobs).where(eq(replyDetectionJobs.id, jobId)).limit(1); if (!job || job.status !== "failed") return;
  await db.update(replyDetectionJobs).set({ status: "pending", scheduledFor: job.nextRetryAt || new Date(), updatedAt: new Date() }).where(eq(replyDetectionJobs.id, jobId));
  console.log(`[ReplyDetectionQueue] Job ${jobId} scheduled for retry`);
}
