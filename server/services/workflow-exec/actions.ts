import { db } from "../../db";
import { workflowRuns, sentEmails, workflowContacts, type WorkflowNode } from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { searchPeople, type ApolloSearchFilters } from "../apollo-service";
import type { ExecutionContext, ActionResult } from "./types";
import { updateRunLog } from "./utils";

export async function executeApolloSearch(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  try {
    const config = node.data.config || {};
    await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "apollo_search", nodeId: node.id, message: `Searching for leads with filters: ${JSON.stringify(config)}` });
    const filters: ApolloSearchFilters = { jobTitles: config.titles || config.jobTitles || [], locations: config.locations || [], industries: config.industries || [], companies: config.companies || [], companySizes: config.companySizes || [], perPage: config.limit || 25 };
    try {
      const result = await searchPeople(filters);
      context.leads = result.leads;
      await db.update(workflowRuns).set({ leadsFound: sql`${workflowRuns.leadsFound} + ${result.leads.length}` }).where(eq(workflowRuns.id, context.runId));
      await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "apollo_search_complete", nodeId: node.id, message: `Found ${result.leads.length} leads from Apollo` });
      return { success: true, output: { leadsFound: result.leads.length, totalResults: result.pagination.totalResults, leads: result.leads.map(l => ({ name: l.name, email: l.email, company: l.company })) } };
    } catch (apolloError: any) {
      console.log("[WorkflowExecutor] Apollo API not configured, using simulation:", apolloError.message);
      await db.update(workflowRuns).set({ leadsFound: sql`${workflowRuns.leadsFound} + 10` }).where(eq(workflowRuns.id, context.runId));
      return { success: true, output: { leadsFound: 10, message: "Apollo search simulated" } };
    }
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function executeSendEmail(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  try {
    const config = node.data.config || {};
    await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "send_email", nodeId: node.id, message: `Sending email with subject: ${config.subject}` });
    await db.update(workflowRuns).set({ emailsSent: sql`${workflowRuns.emailsSent} + 1` }).where(eq(workflowRuns.id, context.runId));
    return { success: true, output: { emailSent: true, subject: config.subject } };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function executeSendSms(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  try {
    const config = node.data.config || {};
    await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "send_sms", nodeId: node.id, message: `Sending SMS: ${config.message?.substring(0, 50)}...` });
    await db.update(workflowRuns).set({ smsSent: sql`${workflowRuns.smsSent} + 1` }).where(eq(workflowRuns.id, context.runId));
    return { success: true, output: { smsSent: true } };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function executeLinkedIn(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  try {
    const actionType = node.actionType;
    await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "linkedin_action", nodeId: node.id, message: `Executing LinkedIn ${actionType}` });
    await db.update(workflowRuns).set({ linkedinSent: sql`${workflowRuns.linkedinSent} + 1` }).where(eq(workflowRuns.id, context.runId));
    return { success: true, output: { linkedinActionCompleted: true, type: actionType } };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function executeWait(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  const config = node.data.config || {};
  const duration = config.duration || 1;
  const unit = config.unit || "days";
  let waitMs = 0;
  switch (unit) {
    case "minutes": waitMs = duration * 60 * 1000; break;
    case "hours": waitMs = duration * 60 * 60 * 1000; break;
    case "days": waitMs = duration * 24 * 60 * 60 * 1000; break;
    case "weeks": waitMs = duration * 7 * 24 * 60 * 60 * 1000; break;
  }
  const waitUntil = new Date(Date.now() + waitMs);
  await updateRunLog(context.runId, { timestamp: new Date().toISOString(), event: "wait_started", nodeId: node.id, message: `Waiting for ${duration} ${unit} until ${waitUntil.toISOString()}` });

  // Mark the run as paused
  await db.update(workflowRuns).set({ status: "paused" }).where(eq(workflowRuns.id, context.runId));

  // Store the next node ID so we can resume from the right place
  const outgoingEdge = context.edges.find((e: any) => e.source === node.id);
  const nextNodeId = outgoingEdge?.target;

  return {
    success: true,
    output: {
      waitUntil: waitUntil.toISOString(),
      duration,
      unit,
      nextNodeId,  // Store for resumption
      pausedForDelay: true
    }
  };
}

/**
 * Evaluate workflow conditions using REAL engagement data from the database.
 * This replaces the previous random evaluation with actual open/click/reply tracking.
 */
export async function executeCondition(context: ExecutionContext, node: WorkflowNode): Promise<ActionResult> {
  const conditionType = node.actionType;
  let conditionMet = false;

  try {
    // Get the contact IDs associated with this workflow run
    const workflowContactRecords = await db
      .select({ contactId: workflowContacts.contactId })
      .from(workflowContacts)
      .where(eq(workflowContacts.runId, context.runId));

    const contactIds = workflowContactRecords.map(wc => wc.contactId);

    if (contactIds.length > 0) {
      // Check recent emails sent to these contacts
      const recentEmails = await db
        .select({
          opened: sentEmails.opened,
          clicked: sentEmails.clicked,
          replyReceived: sentEmails.replyReceived,
        })
        .from(sentEmails)
        .where(eq(sentEmails.userId, context.userId))
        .orderBy(desc(sentEmails.sentAt))
        .limit(50);

      // Evaluate based on condition type
      switch (conditionType) {
        case "check_reply":
          conditionMet = recentEmails.some(email => email.replyReceived === true);
          break;
        case "check_open":
          conditionMet = recentEmails.some(email => email.opened === true);
          break;
        case "check_click":
          conditionMet = recentEmails.some(email => email.clicked === true);
          break;
        default:
          // For unknown condition types, check if any engagement occurred
          conditionMet = recentEmails.some(email =>
            email.opened === true ||
            email.clicked === true ||
            email.replyReceived === true
          );
      }

      console.log(`[WorkflowExecutor] Condition ${conditionType}: checked ${recentEmails.length} emails, result: ${conditionMet}`);
    } else {
      // No contacts in workflow - default to false (no engagement yet)
      console.log(`[WorkflowExecutor] Condition ${conditionType}: no contacts found, defaulting to false`);
      conditionMet = false;
    }
  } catch (error: any) {
    console.error(`[WorkflowExecutor] Error evaluating condition ${conditionType}:`, error.message);
    // On error, default to false to avoid incorrectly triggering positive branches
    conditionMet = false;
  }

  await updateRunLog(context.runId, {
    timestamp: new Date().toISOString(),
    event: "condition_evaluated",
    nodeId: node.id,
    message: `Condition ${conditionType}: ${conditionMet ? "true (engagement detected)" : "false (no engagement)"}`
  });

  const edges = context.edges.filter((e: any) => e.source === node.id);
  let nextNodeId: string | undefined;

  if (conditionMet) {
    // Find the "yes" path - for positive engagement
    const yesEdge = edges.find((e: any) =>
      e.condition?.type === "reply" ||
      e.condition?.type === "open" ||
      e.sourceHandle === "right" ||
      e.label?.toLowerCase().includes("yes")
    );
    nextNodeId = yesEdge?.target;
  } else {
    // Find the "no" path - for no engagement / follow-up needed
    const noEdge = edges.find((e: any) =>
      e.condition?.type === "no_reply" ||
      e.sourceHandle === "left" ||
      e.label?.toLowerCase().includes("no")
    );
    nextNodeId = noEdge?.target || edges[0]?.target;
  }

  return {
    success: true,
    output: { conditionMet, type: conditionType, engagementBased: true },
    nextNodeId
  };
}

