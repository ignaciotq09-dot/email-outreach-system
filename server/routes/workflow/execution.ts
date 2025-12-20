import type { Router } from "express";
import { db } from "../../db";
import { workflows, workflowRuns, workflowSteps } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { executeWorkflow } from "../../services/workflow-executor";
import { getUserId } from "./utils";

export function registerExecutionRoutes(app: Router) {
  app.post("/api/workflows/:id/schedule", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const { enabled, intervalUnit, intervalMultiplier, day, time, timezone, channels } = req.body;
      const [existing] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Workflow not found" });
      let nextRunAt: Date | null = null;
      if (enabled && time && typeof day === 'number') {
        const [hours, minutes] = time.split(":").map(Number);
        const now = new Date();
        const currentDay = now.getDay();
        nextRunAt = new Date();
        nextRunAt.setHours(hours, minutes, 0, 0);
        let daysUntilNext = day - currentDay;
        if (daysUntilNext < 0 || (daysUntilNext === 0 && now >= nextRunAt)) daysUntilNext += 7;
        nextRunAt.setDate(nextRunAt.getDate() + daysUntilNext);
      }
      const [updated] = await db.update(workflows).set({ scheduleEnabled: enabled, scheduleType: intervalUnit || "week", scheduleInterval: intervalMultiplier || 1, scheduleDays: typeof day === 'number' ? [day] : [], scheduleTime: time, scheduleTimezone: timezone || "America/New_York", channels: channels || { email: true, sms: false, linkedin: false }, nextRunAt, status: enabled ? "active" : existing.status, updatedAt: new Date() }).where(eq(workflows.id, workflowId)).returning();
      res.json(updated);
    } catch (error: any) {
      console.error("[Workflows] Schedule error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/activate", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [existing] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!existing) return res.status(404).json({ error: "Workflow not found" });
      if (!existing.scheduleEnabled) return res.status(400).json({ error: "Cannot activate workflow without a schedule. Please configure a schedule first." });
      const [updated] = await db.update(workflows).set({ status: "active", updatedAt: new Date() }).where(eq(workflows.id, workflowId)).returning();
      console.log(`[Workflows] Workflow ${workflowId} activated by user ${userId}`);
      res.json(updated);
    } catch (error: any) {
      console.error("[Workflows] Activate error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/run", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      const runId = await executeWorkflow(workflowId, userId, "manual");
      res.json({ runId, message: "Workflow execution started" });
    } catch (error: any) {
      console.error("[Workflows] Run error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/runs", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const workflowId = parseInt(req.params.id);
      const runs = await db.select().from(workflowRuns).where(and(eq(workflowRuns.workflowId, workflowId), eq(workflowRuns.userId, userId))).orderBy(desc(workflowRuns.createdAt)).limit(50);
      res.json(runs);
    } catch (error: any) {
      console.error("[Workflows] Runs error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/runs/:runId", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const runId = parseInt(req.params.runId);
      const [run] = await db.select().from(workflowRuns).where(and(eq(workflowRuns.id, runId), eq(workflowRuns.userId, userId)));
      if (!run) return res.status(404).json({ error: "Run not found" });
      const steps = await db.select().from(workflowSteps).where(eq(workflowSteps.runId, runId)).orderBy(workflowSteps.createdAt);
      res.json({ run, steps });
    } catch (error: any) {
      console.error("[Workflows] Run detail error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
