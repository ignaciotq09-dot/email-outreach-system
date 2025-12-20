import { db } from "../../db";
import { workflows, workflowRuns, workflowSteps, type WorkflowNode } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { ExecutionContext, ActionResult } from "./types";
import { updateRunLog, completeRun } from "./utils";
import { executeApolloSearch, executeSendEmail, executeSendSms, executeLinkedIn, executeWait, executeCondition } from "./actions";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1 second base, will exponentially increase

export async function executeWorkflow(workflowId: number, userId: number, triggeredBy: string = "manual"): Promise<number> {
  const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
  if (!workflow) throw new Error("Workflow not found");
  const nodes = (workflow.nodes as WorkflowNode[]) || [];
  const edges = (workflow.edges as any[]) || [];
  if (nodes.length === 0) throw new Error("Workflow has no nodes");
  const triggerNode = nodes.find(n => n.type === "trigger");
  if (!triggerNode) throw new Error("Workflow has no trigger node");
  const [run] = await db.insert(workflowRuns).values({ workflowId, userId, status: "running", triggeredBy, startedAt: new Date(), totalSteps: nodes.length, executionLog: [{ timestamp: new Date().toISOString(), event: "workflow_started", nodeId: triggerNode.id, message: `Workflow started via ${triggeredBy}` }] }).returning();
  await db.update(workflows).set({ lastRunAt: new Date(), totalRuns: sql`${workflows.totalRuns} + 1` }).where(eq(workflows.id, workflowId));
  const workflowChannels = (workflow.channels as { email?: boolean; sms?: boolean; linkedin?: boolean }) || { email: true, sms: false, linkedin: false };
  const context: ExecutionContext = { workflowId, runId: run.id, userId, nodes, edges, currentNodeId: triggerNode.id, variables: {}, channels: workflowChannels, leads: [] };
  executeNodeAsync(context);
  return run.id;
}

/**
 * Execute an action with retry logic and exponential backoff.
 * Retries up to MAX_RETRIES times with increasing delays.
 */
async function executeWithRetry(
  actionFn: () => Promise<ActionResult>,
  actionName: string,
  runId: number
): Promise<ActionResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await actionFn();

      if (result.success) {
        return result;
      }

      // Action returned failure but didn't throw - may still retry
      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`[WorkflowExecutor] ${actionName} failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await updateRunLog(runId, {
          timestamp: new Date().toISOString(),
          event: "retry_scheduled",
          message: `${actionName} failed: ${result.error}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        return result; // Return the failure after max retries
      }
    } catch (error: any) {
      lastError = error;

      if (attempt < MAX_RETRIES) {
        const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`[WorkflowExecutor] ${actionName} threw error, retrying in ${delayMs}ms:`, error.message);
        await updateRunLog(runId, {
          timestamp: new Date().toISOString(),
          event: "retry_scheduled",
          message: `${actionName} error: ${error.message}. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError?.message || "Unknown error after max retries",
    output: { retriesExhausted: true, maxRetries: MAX_RETRIES }
  };
}

async function executeNodeAsync(context: ExecutionContext): Promise<void> {
  try {
    const node = context.nodes.find(n => n.id === context.currentNodeId);
    if (!node) {
      await completeRun(context.runId, "failed", "Node not found: " + context.currentNodeId);
      return;
    }

    const [step] = await db.insert(workflowSteps).values({
      runId: context.runId,
      workflowId: context.workflowId,
      userId: context.userId,
      nodeId: node.id,
      nodeType: node.type,
      actionType: node.actionType,
      status: "running",
      startedAt: new Date(),
      inputData: { context: context.variables }
    }).returning();

    await updateRunLog(context.runId, {
      timestamp: new Date().toISOString(),
      event: "node_started",
      nodeId: node.id,
      message: `Executing node: ${node.data.label}`
    });

    let result: ActionResult = { success: true, output: {} };

    switch (node.type) {
      case "trigger":
        break;

      case "action":
        // Execute actions with retry logic
        if (node.actionType === "find_leads") {
          result = await executeWithRetry(
            () => executeApolloSearch(context, node),
            "Apollo Search",
            context.runId
          );
        } else if (node.actionType === "send_email") {
          result = await executeWithRetry(
            () => executeSendEmail(context, node),
            "Send Email",
            context.runId
          );
        } else if (node.actionType === "send_sms") {
          result = await executeWithRetry(
            () => executeSendSms(context, node),
            "Send SMS",
            context.runId
          );
        } else if (node.actionType === "send_linkedin_connection" || node.actionType === "send_linkedin_message") {
          result = await executeWithRetry(
            () => executeLinkedIn(context, node),
            "LinkedIn Action",
            context.runId
          );
        }
        break;

      case "delay":
        result = await executeWait(context, node);
        break;

      case "condition":
        result = await executeCondition(context, node);
        break;

      case "end":
        break;
    }

    // Handle delay nodes specially - set waiting status and waitUntil timestamp
    if (node.type === "delay" && result.success && result.output?.pausedForDelay) {
      const waitUntilDate = new Date(result.output.waitUntil);
      await db.update(workflowSteps).set({
        status: "waiting",
        waitUntil: waitUntilDate,
        outputData: result.output,
      }).where(eq(workflowSteps.id, step.id));

      // Store current node for resumption
      await db.update(workflowRuns).set({
        currentNodeId: result.output.nextNodeId || null,
      }).where(eq(workflowRuns.id, context.runId));

      console.log(`[WorkflowExecutor] Workflow paused for delay until ${waitUntilDate.toISOString()}`);
      return; // Stop execution - scheduler will resume later
    }

    // Normal step completion
    await db.update(workflowSteps).set({
      status: result.success ? "completed" : "failed",
      completedAt: new Date(),
      outputData: result.output,
      errorMessage: result.error
    }).where(eq(workflowSteps.id, step.id));

    await db.update(workflowRuns).set({
      completedSteps: sql`${workflowRuns.completedSteps} + 1`
    }).where(eq(workflowRuns.id, context.runId));

    if (!result.success) {
      await db.update(workflowRuns).set({
        failedSteps: sql`${workflowRuns.failedSteps} + 1`
      }).where(eq(workflowRuns.id, context.runId));
    }

    if (node.type === "end") {
      await completeRun(context.runId, "completed");
      return;
    }

    // Determine next node
    let nextNodeId = result.nextNodeId;
    if (!nextNodeId) {
      const outgoingEdge = context.edges.find(e => e.source === node.id);
      nextNodeId = outgoingEdge?.target;
    }

    if (nextNodeId) {
      context.currentNodeId = nextNodeId;
      setTimeout(() => executeNodeAsync(context), 100);
    } else {
      await completeRun(context.runId, "completed");
    }

  } catch (error: any) {
    console.error("[WorkflowExecutor] Error:", error);
    await completeRun(context.runId, "failed", error.message);
  }
}

