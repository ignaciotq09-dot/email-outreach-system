import { db } from "../../../db";
import { eq, and, sql } from "drizzle-orm";
import { replyDetectionJobs, replyDetectionReconciliationRuns } from "@shared/schema";

export async function getExistingPendingJobs(sentEmailIds: number[]): Promise<Set<number>> {
  if (sentEmailIds.length === 0) return new Set();
  const existing = await db.select({ sentEmailId: replyDetectionJobs.sentEmailId }).from(replyDetectionJobs).where(and(sql`${replyDetectionJobs.sentEmailId} IN (${sql.join(sentEmailIds.map(id => sql`${id}`), sql`, `)})`, sql`${replyDetectionJobs.status} IN ('pending', 'queued', 'executing')`));
  return new Set(existing.map(e => e.sentEmailId));
}

export async function startReconciliationRun(userId: number, runType: "hourly" | "nightly" | "manual"): Promise<number> {
  const [run] = await db.insert(replyDetectionReconciliationRuns).values({ userId, runType, startedAt: new Date(), emailsChecked: 0, newRepliesFound: 0, anomaliesLogged: 0, jobsCreated: 0 }).returning();
  return run.id;
}

export async function completeReconciliationRun(runId: number, result: { emailsChecked: number; jobsCreated: number; errors: string[] }, durationMs: number): Promise<void> {
  await db.update(replyDetectionReconciliationRuns).set({ completedAt: new Date(), durationMs, emailsChecked: result.emailsChecked, jobsCreated: result.jobsCreated, errors: result.errors.length > 0 ? result.errors : null, outcome: result.errors.length > 0 ? "partial" : "success" }).where(eq(replyDetectionReconciliationRuns.id, runId));
}
