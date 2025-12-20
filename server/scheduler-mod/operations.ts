import { db } from "../db";
import { scheduledJobs } from "@shared/schema";
import { eq, and, lt, lte, isNull } from "drizzle-orm";
import type { ScheduledJob, InsertScheduledJob } from "@shared/schema";

export async function getPendingJobs(): Promise<ScheduledJob[]> { const now = new Date(); const jobs = await db.select().from(scheduledJobs).where(and(eq(scheduledJobs.status, "pending"), lte(scheduledJobs.scheduledFor, now))).limit(10); return jobs; }

export async function markJobProcessing(jobId: number, attempts: number): Promise<void> { await db.update(scheduledJobs).set({ status: "processing", lastAttempt: new Date(), attempts: (attempts || 0) + 1 }).where(eq(scheduledJobs.id, jobId)); }

export async function markJobCompleted(jobId: number): Promise<void> { await db.update(scheduledJobs).set({ status: "completed", completedAt: new Date(), error: null }).where(eq(scheduledJobs.id, jobId)); console.log(`[Scheduler] Job ${jobId} completed successfully`); }

export async function markJobFailed(jobId: number, error: string, attempts: number, maxAttempts: number): Promise<void> { const shouldRetry = attempts < maxAttempts; if (shouldRetry) { const retryDelayMs = Math.pow(2, attempts) * 60000; const nextScheduledTime = new Date(Date.now() + retryDelayMs); await db.update(scheduledJobs).set({ status: "pending", scheduledFor: nextScheduledTime, error }).where(eq(scheduledJobs.id, jobId)); console.log(`[Scheduler] Job ${jobId} scheduled for retry at ${nextScheduledTime}`); } else { await db.update(scheduledJobs).set({ status: "failed", error, completedAt: new Date() }).where(eq(scheduledJobs.id, jobId)); console.log(`[Scheduler] Job ${jobId} failed after ${attempts} attempts`); } }

export async function scheduleJob(jobData: InsertScheduledJob): Promise<ScheduledJob> { const [job] = await db.insert(scheduledJobs).values(jobData).returning(); console.log(`[Scheduler] Job scheduled: ${job.jobType} at ${job.scheduledFor}`); return job; }

export async function cancelJob(jobId: number): Promise<void> { await db.delete(scheduledJobs).where(and(eq(scheduledJobs.id, jobId), eq(scheduledJobs.status, "pending"))); console.log(`[Scheduler] Job ${jobId} cancelled`); }

export async function getJobStatus(jobId: number): Promise<ScheduledJob | undefined> { const [job] = await db.select().from(scheduledJobs).where(eq(scheduledJobs.id, jobId)).limit(1); return job; }

export async function cleanupOldJobs(daysToKeep: number = 30): Promise<number> { const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() - daysToKeep); await db.delete(scheduledJobs).where(and(eq(scheduledJobs.status, "completed"), lt(scheduledJobs.completedAt, cutoffDate))); console.log(`[Scheduler] Cleaned up old jobs older than ${daysToKeep} days`); return 0; }
