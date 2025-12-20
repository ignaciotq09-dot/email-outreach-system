import type { Router } from "express";
import { db } from "../../db";
import { workflows, type WorkflowNode, type WorkflowEdge, type WorkflowConversationMessage } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateWorkflowFromDescription, refineWorkflow, suggestWorkflowImprovements, validateWorkflow } from "../../services/workflow-ai-generator";
import { getUserId } from "./utils";

export function registerAiRoutes(app: Router) {
  app.post("/api/workflows/generate", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { description, conversationHistory } = req.body;
      if (!description) return res.status(400).json({ error: "Description is required" });
      const result = await generateWorkflowFromDescription(description, conversationHistory || []);
      res.json(result);
    } catch (error: any) {
      console.error("[Workflows] Generate error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/refine", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const { refinementRequest, conversationHistory } = req.body;
      const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      const result = await refineWorkflow(workflow.nodes as WorkflowNode[], workflow.edges as WorkflowEdge[], refinementRequest, conversationHistory || []);
      const newConversation: WorkflowConversationMessage[] = [
        ...(conversationHistory || []),
        { role: "user", content: refinementRequest, timestamp: new Date().toISOString() },
        { role: "assistant", content: result.changes || result.summary, timestamp: new Date().toISOString(), workflowChanges: { nodesAdded: [], nodesRemoved: [] } },
      ];
      const [updated] = await db.update(workflows).set({ nodes: result.nodes, edges: result.edges, aiConversationHistory: newConversation, version: sql`${workflows.version} + 1`, updatedAt: new Date() }).where(eq(workflows.id, workflowId)).returning();
      res.json({ workflow: updated, changes: result.changes, summary: result.summary });
    } catch (error: any) {
      console.error("[Workflows] Refine error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/validate", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      const result = validateWorkflow(workflow.nodes as WorkflowNode[], workflow.edges as WorkflowEdge[]);
      res.json(result);
    } catch (error: any) {
      console.error("[Workflows] Validate error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/suggestions", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      const suggestions = await suggestWorkflowImprovements(workflow.nodes as WorkflowNode[], workflow.edges as WorkflowEdge[]);
      res.json({ suggestions });
    } catch (error: any) {
      console.error("[Workflows] Suggestions error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
