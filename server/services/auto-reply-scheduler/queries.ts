import { db } from "../../db";
import { eq, desc, and, gte, sql, or } from "drizzle-orm";
import { replies, sentEmails, contacts, emailPreferences, autoReplyLogs } from "@shared/schema";
import type { ProcessingStatus, ProcessDecision } from "./types";
import { MAX_RETRY_ATTEMPTS, RETRY_BACKOFF_MS } from "./constants";

export async function getActiveAutoReplyUsers(): Promise<number[]> {
  const activeUsers = await db.select({ userId: emailPreferences.userId }).from(emailPreferences).where(and(eq(emailPreferences.autoReplyEnabled, true), sql`${emailPreferences.bookingLink} IS NOT NULL`));
  return activeUsers.filter(u => u.userId !== null).map(u => u.userId as number);
}

export async function getReplyProcessingStatus(userId: number): Promise<Map<number, ProcessingStatus>> {
  const logs = await db.select({ replyId: autoReplyLogs.replyId, status: autoReplyLogs.status, sentAt: autoReplyLogs.sentAt }).from(autoReplyLogs).where(eq(autoReplyLogs.userId, userId));
  const statusMap = new Map<number, ProcessingStatus>();
  for (const log of logs) { const existing = statusMap.get(log.replyId); if (existing) { existing.attemptCount++; if (log.sentAt && (!existing.lastAttempt || log.sentAt > existing.lastAttempt)) { existing.lastAttempt = log.sentAt; existing.status = log.status; } } else { statusMap.set(log.replyId, { status: log.status, attemptCount: 1, lastAttempt: log.sentAt }); } }
  return statusMap;
}

export function shouldProcessReply(status: ProcessingStatus | undefined): ProcessDecision {
  if (!status) return { shouldProcess: true, reason: 'new' };
  const terminalStatuses = ['sent', 'skipped', 'flagged_for_review', 'exhausted']; if (terminalStatuses.includes(status.status || '')) return { shouldProcess: false, reason: 'terminal' };
  if (status.status === 'error' || status.status === 'send_failed') { if (status.attemptCount >= MAX_RETRY_ATTEMPTS) return { shouldProcess: false, reason: 'max_retries' }; if (status.lastAttempt) { const backoffMs = RETRY_BACKOFF_MS * Math.pow(2, status.attemptCount - 1); const nextRetryTime = new Date(status.lastAttempt.getTime() + backoffMs); if (new Date() < nextRetryTime) return { shouldProcess: false, reason: 'backoff_pending' }; } return { shouldProcess: true, reason: 'retry' }; }
  return { shouldProcess: false, reason: 'unknown' };
}

export async function getRetryableReplyIds(userId: number): Promise<Set<number>> {
  const recentLogs = await db.select({ replyId: autoReplyLogs.replyId, status: autoReplyLogs.status, sentAt: autoReplyLogs.sentAt, }).from(autoReplyLogs).where(and(eq(autoReplyLogs.userId, userId), or(eq(autoReplyLogs.status, 'error'), eq(autoReplyLogs.status, 'send_failed')))).orderBy(desc(autoReplyLogs.sentAt)).limit(100);
  const replyCounts = new Map<number, { count: number; lastAttempt: Date | null }>(); for (const log of recentLogs) { const existing = replyCounts.get(log.replyId); if (existing) { existing.count++; if (log.sentAt && (!existing.lastAttempt || log.sentAt > existing.lastAttempt)) existing.lastAttempt = log.sentAt; } else { replyCounts.set(log.replyId, { count: 1, lastAttempt: log.sentAt }); } }
  const retryable = new Set<number>(); for (const [replyId, data] of replyCounts) { if (data.count < MAX_RETRY_ATTEMPTS) { if (data.lastAttempt) { const backoffMs = RETRY_BACKOFF_MS * Math.pow(2, data.count - 1); const nextRetryTime = new Date(data.lastAttempt.getTime() + backoffMs); if (new Date() >= nextRetryTime) retryable.add(replyId); } else { retryable.add(replyId); } } }
  return retryable;
}
