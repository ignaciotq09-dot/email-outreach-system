import { db } from "../db";
import { workflows, workflowRuns, workflowSteps } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { executeWorkflow, updateNextRunTime } from "./workflow-executor";

let schedulerInterval: NodeJS.Timeout | null = null;
// Reduced from 60s to 15s for more timely execution (max 14s delay vs 59s)
const SCHEDULER_INTERVAL = 15 * 1000;

export function startWorkflowScheduler(): void {
  if (schedulerInterval) {
    console.log("[WorkflowScheduler] Already running");
    return;
  }

  console.log("[WorkflowScheduler] Starting workflow scheduler...");

  schedulerInterval = setInterval(async () => {
    await checkAndRunScheduledWorkflows();
    await resumePausedWorkflows();
  }, SCHEDULER_INTERVAL);

  // Initial check shortly after startup
  setTimeout(async () => {
    await checkAndRunScheduledWorkflows();
    await resumePausedWorkflows();
  }, 5000);

  console.log(`[WorkflowScheduler] Scheduler started with ${SCHEDULER_INTERVAL / 1000}s interval`);
}

export function stopWorkflowScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[WorkflowScheduler] Scheduler stopped");
  }
}

async function checkAndRunScheduledWorkflows(): Promise<void> {
  try {
    const now = new Date();

    const dueWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.scheduleEnabled, true),
          eq(workflows.status, "active"),
          lte(workflows.nextRunAt, now)
        )
      );

    if (dueWorkflows.length === 0) {
      return;
    }

    console.log(`[WorkflowScheduler] Found ${dueWorkflows.length} workflows due for execution`);

    for (const workflow of dueWorkflows) {
      try {
        console.log(`[WorkflowScheduler] Executing workflow ${workflow.id}: ${workflow.name}`);

        await executeWorkflow(workflow.id, workflow.userId, "schedule");

        await updateNextRunTime(workflow.id);

        console.log(`[WorkflowScheduler] Workflow ${workflow.id} execution started`);
      } catch (error: any) {
        console.error(`[WorkflowScheduler] Error executing workflow ${workflow.id}:`, error.message);

        await updateNextRunTime(workflow.id);
      }
    }
  } catch (error: any) {
    console.error("[WorkflowScheduler] Error checking scheduled workflows:", error.message);
  }
}

export async function getSchedulerStatus(): Promise<{
  running: boolean;
  nextCheck: Date;
  scheduledWorkflows: number;
}> {
  const now = new Date();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workflows)
    .where(
      and(
        eq(workflows.scheduleEnabled, true),
        eq(workflows.status, "active")
      )
    );

  return {
    running: schedulerInterval !== null,
    nextCheck: new Date(now.getTime() + SCHEDULER_INTERVAL),
    scheduledWorkflows: Number(result?.count || 0),
  };
}

/**
 * Resume workflows that were paused by delay nodes and are now ready to continue.
 * This fixes the critical issue where workflows with "wait" nodes get permanently stuck.
 */
async function resumePausedWorkflows(): Promise<void> {
  try {
    const now = new Date();

    // Find workflow steps that are in "waiting" status and their waitUntil has passed
    const dueSteps = await db
      .select({
        stepId: workflowSteps.id,
        runId: workflowSteps.runId,
        workflowId: workflowSteps.workflowId,
        userId: workflowSteps.userId,
        nodeId: workflowSteps.nodeId,
      })
      .from(workflowSteps)
      .where(
        and(
          eq(workflowSteps.status, "waiting"),
          lte(workflowSteps.waitUntil, now)
        )
      );

    if (dueSteps.length === 0) {
      return;
    }

    console.log(`[WorkflowScheduler] Found ${dueSteps.length} paused workflows ready to resume`);

    for (const step of dueSteps) {
      try {
        // Mark the step as completed
        await db.update(workflowSteps).set({
          status: "completed",
          completedAt: new Date(),
        }).where(eq(workflowSteps.id, step.stepId));

        // Resume the workflow run
        await db.update(workflowRuns).set({
          status: "running",
        }).where(eq(workflowRuns.id, step.runId));

        console.log(`[WorkflowScheduler] Resumed workflow run ${step.runId} after delay`);

        // Note: The executor will pick up from where it left off on next check
        // For immediate continuation, we could call executeWorkflow here,
        // but that would require tracking the next node to execute
      } catch (error: any) {
        console.error(`[WorkflowScheduler] Error resuming step ${step.stepId}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("[WorkflowScheduler] Error resuming paused workflows:", error.message);
  }
}

