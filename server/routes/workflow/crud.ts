import type { Router } from "express";
import { db } from "../../db";
import { workflows, workflowRuns, workflowSteps } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserId } from "./utils";

export function registerCrudRoutes(app: Router) {
  app.get("/api/workflows", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const result = await db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
      res.json(result);
    } catch (error: any) {
      console.error("[Workflows] List error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, parseInt(req.params.id)), eq(workflows.userId, userId)));
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      res.json(workflow);
    } catch (error: any) {
      console.error("[Workflows] Get error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { name, description, nodes, edges } = req.body;
      const [workflow] = await db.insert(workflows).values({ userId, name: name || "Untitled Workflow", description, nodes: nodes || [], edges: edges || [], status: "draft" }).returning();
      res.json(workflow);
    } catch (error: any) {
      console.error("[Workflows] Create error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/workflows/:id", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [existing] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Workflow not found" });
      const [updated] = await db.update(workflows).set({ ...req.body, updatedAt: new Date() }).where(eq(workflows.id, workflowId)).returning();
      res.json(updated);
    } catch (error: any) {
      console.error("[Workflows] Update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [existing] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Workflow not found" });
      await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, workflowId));
      await db.delete(workflowRuns).where(eq(workflowRuns.workflowId, workflowId));
      await db.delete(workflows).where(eq(workflows.id, workflowId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Workflows] Delete error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
