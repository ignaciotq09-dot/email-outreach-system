import { db } from "../../db";
import { workflowRuns, workflows } from "@shared/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export async function updateRunLog(runId: number, logEntry: any): Promise<void> {
  await db.update(workflowRuns).set({ executionLog: sql`${workflowRuns.executionLog} || ${JSON.stringify([logEntry])}::jsonb` }).where(eq(workflowRuns.id, runId));
}

export async function completeRun(runId: number, status: string, errorMessage?: string): Promise<void> {
  const updateData: any = { status, completedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  await db.update(workflowRuns).set(updateData).where(eq(workflowRuns.id, runId));
  const [run] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, runId));
  if (run) {
    const workflowUpdate: any = {};
    if (status === "completed") workflowUpdate.successfulRuns = sql`${workflows.successfulRuns} + 1`;
    else if (status === "failed") workflowUpdate.failedRuns = sql`${workflows.failedRuns} + 1`;
    if (Object.keys(workflowUpdate).length > 0) await db.update(workflows).set(workflowUpdate).where(eq(workflows.id, run.workflowId));
  }
  await updateRunLog(runId, { timestamp: new Date().toISOString(), event: "workflow_completed", status, message: errorMessage || `Workflow ${status}` });
}

export function getNextIntervalRun(intervalMinutes: number, scheduledHour: number, scheduledMinute: number): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(scheduledHour, scheduledMinute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export function getNextWeeklyRun(days: number[], hours: number, minutes: number): Date {
  if (days.length === 0) days = [1, 2, 3, 4, 5];
  const now = new Date();
  const currentDay = now.getDay();
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (days.includes(checkDay)) {
      const next = new Date(now);
      next.setDate(now.getDate() + i);
      next.setHours(hours, minutes, 0, 0);
      if (next > now) return next;
    }
  }
  const nextWeekDay = days[0];
  const daysUntil = (nextWeekDay - currentDay + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(hours, minutes, 0, 0);
  return next;
}
