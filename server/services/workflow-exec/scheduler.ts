import { db } from "../../db";
import { workflows, type Workflow } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { getNextIntervalRun, getNextWeeklyRun } from "./utils";

export async function getScheduledWorkflows(): Promise<Workflow[]> {
  const now = new Date();
  const scheduled = await db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.scheduleEnabled, true),
        eq(workflows.status, "active"),
        lte(workflows.nextRunAt, now)
      )
    );
  return scheduled;
}

/**
 * Convert a time from a specific timezone to UTC.
 * Uses Intl.DateTimeFormat to handle DST correctly.
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    // Get the time zone offset by comparing formatted times
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (utcDate.getTime() - tzDate.getTime());
  } catch {
    // Fallback to server time if timezone is invalid
    return 0;
  }
}

/**
 * Calculate next run time respecting the user's configured timezone.
 */
export async function updateNextRunTime(workflowId: number): Promise<void> {
  const [workflow] = await db.select().from(workflows).where(eq(workflows.id, workflowId));
  if (!workflow) return;

  // Use the schedule fields from the schema
  const scheduleEnabled = workflow.scheduleEnabled;
  const timezone = workflow.scheduleTimezone || "America/New_York";

  if (!scheduleEnabled) {
    await db.update(workflows).set({ nextRunAt: null }).where(eq(workflows.id, workflowId));
    return;
  }

  // Get schedule configuration from dedicated fields
  let hour = 9;
  let minute = 0;
  let daysOfWeek: number[] = [1, 2, 3, 4, 5]; // Weekdays by default

  // Parse time from scheduleTime (format: "HH:MM")
  if (workflow.scheduleTime) {
    const [h, m] = workflow.scheduleTime.split(":").map(Number);
    hour = h || 9;
    minute = m || 0;
  }

  // Get days from scheduleDays
  if (workflow.scheduleDays && Array.isArray(workflow.scheduleDays)) {
    daysOfWeek = workflow.scheduleDays as number[];
  }

  // Determine frequency from scheduleType and scheduleInterval
  let frequency = "daily";
  if (workflow.scheduleType) {
    frequency = workflow.scheduleType === "week" ? "weekly" :
      workflow.scheduleType === "month" ? "monthly" : "daily";
  }

  let nextRun: Date;

  switch (frequency) {
    case "hourly":
      nextRun = new Date(Date.now() + 60 * 60 * 1000);
      break;

    case "daily":
      nextRun = getNextIntervalRun(24 * 60, hour, minute);
      break;

    case "weekly":
      nextRun = getNextWeeklyRun(daysOfWeek, hour, minute);
      break;

    case "monthly":
      const now = new Date();
      // Default to first day of month if not specified
      nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, hour, minute, 0);
      break;

    default:
      nextRun = getNextIntervalRun(24 * 60, hour, minute);
  }

  // Apply timezone offset to convert from user's timezone to UTC
  // This ensures the workflow runs at the correct local time for the user
  const tzOffset = getTimezoneOffset(timezone, nextRun);
  nextRun = new Date(nextRun.getTime() + tzOffset);

  await db.update(workflows).set({ nextRunAt: nextRun }).where(eq(workflows.id, workflowId));
  console.log(`[WorkflowScheduler] Updated next run for workflow ${workflowId}: ${nextRun.toISOString()} (timezone: ${timezone})`);
}
