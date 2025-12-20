import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { emailTemplates } from "@shared/schema";
import { insertEmailTemplateSchema } from "./validation-schemas";
import { TemplatePerformanceService } from "../template-performance";
import { requireAuth } from "../auth/middleware";

export function registerTemplateRoutes(app: Express) {
  // POST /api/templates - Create a new email template
  app.post("/api/templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = insertEmailTemplateSchema.parse(req.body);
      
      // Multi-tenant: Associate template with user
      const [template] = await db
        .insert(emailTemplates)
        .values({
          ...validatedData,
          userId,
        })
        .returning();
      
      res.json(template);
    } catch (error: any) {
      console.error('Error creating template:', error);
      res.status(400).json({ error: error.message || 'Failed to create template' });
    }
  });

  // GET /api/templates - List all templates for authenticated user (with optional category filter)
  app.get("/api/templates", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const category = req.query.category as string | undefined;
      
      // Multi-tenant: Only get templates for this user
      let whereClause = eq(emailTemplates.userId, userId);
      
      if (category) {
        whereClause = and(
          eq(emailTemplates.userId, userId),
          eq(emailTemplates.category, category)
        ) as any;
      }
      
      const templates = await db
        .select()
        .from(emailTemplates)
        .where(whereClause)
        .orderBy(desc(emailTemplates.createdAt));
      
      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch templates' });
    }
  });

  // GET /api/templates/:id - Get a specific template
  app.get("/api/templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);
      
      // Multi-tenant: Verify template belongs to this user
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.id, templateId),
          eq(emailTemplates.userId, userId)
        ))
        .limit(1);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(template);
    } catch (error: any) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch template' });
    }
  });

  // PUT /api/templates/:id - Update a template
  app.put("/api/templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      
      // Multi-tenant: Only update if template belongs to this user
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set(validatedData)
        .where(and(
          eq(emailTemplates.id, templateId),
          eq(emailTemplates.userId, userId)
        ))
        .returning();
      
      if (!updatedTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json(updatedTemplate);
    } catch (error: any) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: error.message || 'Failed to update template' });
    }
  });

  // DELETE /api/templates/:id - Delete a template
  app.delete("/api/templates/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);
      
      // Multi-tenant: Only delete if template belongs to this user
      const [deleted] = await db
        .delete(emailTemplates)
        .where(and(
          eq(emailTemplates.id, templateId),
          eq(emailTemplates.userId, userId)
        ))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: error.message || 'Failed to delete template' });
    }
  });

  // GET /api/templates/top - Get top performing templates for this user
  app.get("/api/templates/top", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      // Multi-tenant: Get top templates for this user only
      const topTemplates = await TemplatePerformanceService.getTopTemplates(limit, userId);
      res.json(topTemplates);
    } catch (error: any) {
      console.error('Error fetching top templates:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch top templates' });
    }
  });

  // POST /api/templates/:id/update-metrics - Manually update template metrics
  app.post("/api/templates/:id/update-metrics", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const templateId = parseInt(req.params.id);
      
      // Multi-tenant: Verify template belongs to this user before updating metrics
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.id, templateId),
          eq(emailTemplates.userId, userId)
        ))
        .limit(1);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      await TemplatePerformanceService.updateTemplateMetrics(templateId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating template metrics:', error);
      res.status(500).json({ error: error.message || 'Failed to update metrics' });
    }
  });
}
