import { db } from "../../../db";
import { replyDetectionDeadLetter } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getDeadLetterStats(userId: number): Promise<{ pendingReview: number; manuallyChecked: number; retryScheduled: number; skipped: number; resolved: number; total: number }> { const entries = await db.select({ status: replyDetectionDeadLetter.status }).from(replyDetectionDeadLetter).where(eq(replyDetectionDeadLetter.userId, userId)); const stats = { pendingReview: 0, manuallyChecked: 0, retryScheduled: 0, skipped: 0, resolved: 0, total: entries.length }; for (const entry of entries) { switch (entry.status) { case "pending_review": stats.pendingReview++; break; case "manually_checked": stats.manuallyChecked++; break; case "retry_scheduled": stats.retryScheduled++; break; case "skipped": stats.skipped++; break; case "resolved": stats.resolved++; break; } } return stats; }

export async function getPendingReviewEntries(userId: number, limit: number = 50): Promise<Array<typeof replyDetectionDeadLetter.$inferSelect>> { return db.select().from(replyDetectionDeadLetter).where(and(eq(replyDetectionDeadLetter.userId, userId), eq(replyDetectionDeadLetter.status, "pending_review"))).orderBy(desc(replyDetectionDeadLetter.createdAt)).limit(limit); }
