import type { Router } from "express";
import { db } from "../../db";
import { workflows, workflowTemplates } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserId } from "./utils";

export function registerTemplateRoutes(app: Router) {
  app.get("/api/workflow-templates", async (req, res) => {
    try {
      const templates = await db.select().from(workflowTemplates).where(eq(workflowTemplates.isPublic, true)).orderBy(desc(workflowTemplates.usageCount));
      res.json(templates);
    } catch (error: any) {
      console.error("[Workflows] Templates error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflow-templates/:id/use", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const templateId = parseInt(req.params.id);
      const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, templateId));
      if (!template) return res.status(404).json({ error: "Template not found" });
      const [workflow] = await db.insert(workflows).values({ userId, name: template.name + " (Copy)", description: template.description, nodes: template.nodes, edges: template.edges, status: "draft" }).returning();
      await db.update(workflowTemplates).set({ usageCount: sql`${workflowTemplates.usageCount} + 1` }).where(eq(workflowTemplates.id, templateId));
      res.json(workflow);
    } catch (error: any) {
      console.error("[Workflows] Use template error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
