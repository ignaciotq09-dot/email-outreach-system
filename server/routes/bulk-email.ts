import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { emailQueue } from "../services/email-queue";
import { requireAuth } from "../auth/middleware";
import type { User } from "@shared/schema";

// Enhanced validation schemas for bulk operations
const bulkSendSchema = z.object({
  variant: z.object({
    approach: z.string(),
    subject: z.string().max(500),
    body: z.string().max(50000),
  }),
  contactIds: z.array(z.number().int().positive()).min(1),
  campaignId: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

const bulkSendAllSchema = z.object({
  variant: z.object({
    approach: z.string(),
    subject: z.string().max(500),
    body: z.string().max(50000),
  }),
  campaignId: z.number().int().positive().optional(),
  filters: z.object({
    company: z.string().optional(),
    industry: z.string().optional(),
    hasEmail: z.boolean().default(true),
  }).optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

export function registerBulkEmailRoutes(app: Express) {
  // POST /api/bulk/send - Send to specific contacts (no limit)
  app.post("/api/bulk/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const validatedData = bulkSendSchema.parse(req.body);
      const { variant, contactIds, campaignId, priority } = validatedData;
      
      console.log(`[BulkSend] Queueing ${contactIds.length} emails for user ${user.id}`);
      
      // Fetch contacts in batches to avoid memory issues
      const BATCH_SIZE = 1000;
      const allQueueIds: string[] = [];
      
      for (let i = 0; i < contactIds.length; i += BATCH_SIZE) {
        const batchIds = contactIds.slice(i, i + BATCH_SIZE);
        const contacts = await storage.getContactsByIds(batchIds);
        
        if (contacts.length > 0) {
          const queueIds = await emailQueue.addBatch(
            contacts,
            variant,
            user.id,
            campaignId,
            priority
          );
          allQueueIds.push(...queueIds);
        }
      }
      
      const stats = emailQueue.getStats();
      
      res.json({
        success: true,
        message: `Queued ${allQueueIds.length} emails for sending`,
        queueIds: allQueueIds,
        stats: {
          ...stats,
          estimatedCompletionTime: stats.estimatedTimeRemaining > 0
            ? new Date(Date.now() + stats.estimatedTimeRemaining * 1000).toISOString()
            : null
        }
      });
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: error.errors 
        });
      }
      console.error('[BulkSend] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/bulk/send-all - Send to all contacts with optional filters
  app.post("/api/bulk/send-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const validatedData = bulkSendAllSchema.parse(req.body);
      const { variant, campaignId, filters, priority } = validatedData;
      
      console.log(`[BulkSendAll] Loading all contacts with filters for user ${user.id}:`, filters);
      
      // Get all contacts (with optional filtering in the future)
      let allContacts = await storage.getAllContacts();
      
      // Apply filters if provided
      if (filters) {
        if (filters.company) {
          allContacts = allContacts.filter(c => 
            c.company?.toLowerCase().includes(filters.company!.toLowerCase())
          );
        }
        if (filters.industry) {
          allContacts = allContacts.filter(c => 
            c.industry?.toLowerCase() === filters.industry!.toLowerCase()
          );
        }
        if (filters.hasEmail) {
          allContacts = allContacts.filter(c => c.email && c.email.length > 0);
        }
      }
      
      console.log(`[BulkSendAll] Found ${allContacts.length} contacts matching filters`);
      
      if (allContacts.length === 0) {
        return res.status(404).json({ 
          error: 'No contacts found matching the specified filters' 
        });
      }
      
      // Add to queue in batches
      const BATCH_SIZE = 500;
      const allQueueIds: string[] = [];
      
      for (let i = 0; i < allContacts.length; i += BATCH_SIZE) {
        const batch = allContacts.slice(i, i + BATCH_SIZE);
        const queueIds = await emailQueue.addBatch(
          batch,
          variant,
          user.id,
          campaignId,
          priority
        );
        allQueueIds.push(...queueIds);
      }
      
      const stats = emailQueue.getStats();
      
      res.json({
        success: true,
        message: `Queued ${allQueueIds.length} emails for sending`,
        totalContacts: allContacts.length,
        queueIds: allQueueIds,
        stats: {
          ...stats,
          estimatedCompletionTime: stats.estimatedTimeRemaining > 0
            ? new Date(Date.now() + stats.estimatedTimeRemaining * 1000).toISOString()
            : null
        }
      });
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: error.errors 
        });
      }
      console.error('[BulkSendAll] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/bulk/status - Get queue status
  app.get("/api/bulk/status", async (req: Request, res: Response) => {
    try {
      const stats = emailQueue.getStats();
      
      res.json({
        ...stats,
        estimatedCompletionTime: stats.estimatedTimeRemaining > 0
          ? new Date(Date.now() + stats.estimatedTimeRemaining * 1000).toISOString()
          : null,
        queueHealth: {
          isProcessing: stats.processing > 0,
          isHealthy: stats.failed < stats.completed * 0.1, // Less than 10% failure rate
          throughput: `${stats.rate} emails/minute`
        }
      });
      
    } catch (error: any) {
      console.error('[BulkStatus] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // DELETE /api/bulk/clear - Clear the queue
  app.delete("/api/bulk/clear", async (req: Request, res: Response) => {
    try {
      emailQueue.clear();
      
      res.json({
        success: true,
        message: 'Email queue cleared successfully'
      });
      
    } catch (error: any) {
      console.error('[BulkClear] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/bulk/limits - Get system limits and recommendations
  app.get("/api/bulk/limits", async (req: Request, res: Response) => {
    try {
      const totalContacts = await storage.getAllContacts();
      
      res.json({
        currentLimits: {
          oldSystem: {
            sendToSelected: 100,
            sendBulk: 100,
            description: 'Legacy synchronous endpoints'
          },
          newSystem: {
            bulkSend: 'Unlimited',
            bulkSendAll: 'Unlimited',
            description: 'Queue-based asynchronous processing'
          }
        },
        performance: {
          databaseInsertRate: '~800 contacts/second',
          emailLogRate: '~26 emails/second',
          gmailApiLimit: '150 emails/minute',
          queueCapacity: 'Unlimited (memory permitting)',
          concurrentProcessing: 2
        },
        recommendations: {
          smallBatch: 'Use /api/emails/send-to-selected for < 100 contacts (immediate)',
          mediumBatch: 'Use /api/bulk/send for 100-10,000 contacts (queued)',
          largeBatch: 'Use /api/bulk/send-all for 10,000+ contacts (queued)',
          monitoring: 'Use /api/bulk/status to monitor progress'
        },
        currentStatus: {
          totalContactsInSystem: totalContacts.length,
          estimatedTimeForAll: Math.ceil(totalContacts.length / 150) + ' minutes'
        }
      });
      
    } catch (error: any) {
      console.error('[BulkLimits] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}