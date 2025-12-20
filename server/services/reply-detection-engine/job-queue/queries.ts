import { db } from "../../../db";
import { eq, and, lte, asc, desc, sql } from "drizzle-orm";
import { replyDetectionJobs, replyDetectionDeadLetter, replyDetectionAnomalies, type ReplyDetectionJob } from "@shared/schema";

export async function getQueuedJobs(limit: number = 10): Promise<ReplyDetectionJob[]> {
  const now = new Date();
  const result = await db.execute(sql`SELECT j.id, j.user_id as "userId", j.sent_email_id as "sentEmailId", j.contact_id as "contactId", j.thread_id as "threadId", j.message_id as "messageId", j.provider, j.job_type as "jobType", j.status, j.priority, j.attempts, j.error_count as "errorCount", j.scheduled_for as "scheduledFor", j.started_at as "startedAt", j.completed_at as "completedAt", j.next_retry_at as "nextRetryAt", j.last_error_message as "lastErrorMessage", j.last_error_code as "lastErrorCode", j.locked_by as "lockedBy", j.lock_expires_at as "lockExpiresAt", j.metadata, j.created_at as "createdAt", j.updated_at as "updatedAt" FROM reply_detection_jobs j INNER JOIN auth_providers ap ON (ap.user_id = j.user_id AND ap.provider = j.provider AND ap.access_token IS NOT NULL) WHERE j.status IN ('pending', 'queued') AND j.scheduled_for <= ${now} ORDER BY j.priority ASC, j.scheduled_for ASC LIMIT ${limit} FOR UPDATE OF j SKIP LOCKED`);
  return (result.rows || []) as ReplyDetectionJob[];
}

export async function getJobById(jobId: number): Promise<ReplyDetectionJob | undefined> { const [job] = await db.select().from(replyDetectionJobs).where(eq(replyDetectionJobs.id, jobId)).limit(1); return job; }

export async function getFailedJobsForRetry(): Promise<ReplyDetectionJob[]> {
  const now = new Date();
  return db.select().from(replyDetectionJobs).where(and(eq(replyDetectionJobs.status, "failed"), lte(replyDetectionJobs.nextRetryAt, now))).orderBy(asc(replyDetectionJobs.nextRetryAt)).limit(50);
}

export async function getDeadLetterQueue(userId: number, status?: string, limit: number = 50): Promise<Array<typeof replyDetectionDeadLetter.$inferSelect>> {
  const conditions = [eq(replyDetectionDeadLetter.userId, userId)]; if (status) conditions.push(eq(replyDetectionDeadLetter.status, status as any));
  return db.select().from(replyDetectionDeadLetter).where(and(...conditions)).orderBy(desc(replyDetectionDeadLetter.createdAt)).limit(limit);
}

export async function getRecentAnomalies(userId: number, limit: number = 50): Promise<Array<typeof replyDetectionAnomalies.$inferSelect>> { return db.select().from(replyDetectionAnomalies).where(eq(replyDetectionAnomalies.userId, userId)).orderBy(desc(replyDetectionAnomalies.createdAt)).limit(limit); }
