import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { LinkedInJobOrchestrator } from "../../services/linkedin-job-orchestrator";
import { PhantombusterService } from "../../services/phantombuster";
import { db } from "../../db";
import { contacts, linkedinJobQueue } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export function registerJobQueueRoutes(app: Express) {
  app.post("/api/linkedin/queue-send", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { contactId, campaignId, message, personalizedMessage, jobType, scheduledFor } = req.body;
      if (!contactId || !message) return res.status(400).json({ error: 'contactId and message are required' });
      
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId));
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
      if (!contact.linkedinUrl) return res.status(400).json({ error: 'Contact does not have a LinkedIn profile URL' });
      
      const preflight = await LinkedInJobOrchestrator.runPreflightChecks(userId, jobType || 'connection_request');
      if (!preflight.passed) return res.status(400).json({ error: 'Preflight checks failed', details: preflight.errors, warnings: preflight.warnings });
      
      const jobId = await LinkedInJobOrchestrator.queueJob({ userId, contactId, campaignId, linkedinProfileUrl: contact.linkedinUrl, jobType: jobType || 'connection_request', message, personalizedMessage, scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined });
      const result = await LinkedInJobOrchestrator.processJob(jobId);
      res.json({ success: result.success, jobId, containerId: result.containerId, error: result.error, warnings: preflight.warnings });
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error queueing send:', error);
      res.status(500).json({ error: error.message || 'Failed to queue LinkedIn send' });
    }
  });

  app.post("/api/linkedin/queue-send-bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { contactIds, campaignId, message, personalizedMessages, jobType } = req.body;
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) return res.status(400).json({ error: 'contactIds array is required' });
      if (!message) return res.status(400).json({ error: 'message is required' });
      
      const preflight = await LinkedInJobOrchestrator.runPreflightChecks(userId, jobType || 'connection_request');
      if (!preflight.passed) return res.status(400).json({ error: 'Preflight checks failed', details: preflight.errors });
      
      const results: Array<{ contactId: number; success: boolean; jobId?: number; error?: string }> = [];
      for (let i = 0; i < contactIds.length; i++) {
        const contactId = contactIds[i];
        const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId));
        if (!contact) { results.push({ contactId, success: false, error: 'Contact not found' }); continue; }
        if (!contact.linkedinUrl) { results.push({ contactId, success: false, error: 'No LinkedIn profile URL' }); continue; }
        const personalizedMessage = personalizedMessages?.[i] || undefined;
        const jobId = await LinkedInJobOrchestrator.queueJob({ userId, contactId, campaignId, linkedinProfileUrl: contact.linkedinUrl, jobType: jobType || 'connection_request', message, personalizedMessage });
        const result = await LinkedInJobOrchestrator.processJob(jobId);
        results.push({ contactId, success: result.success, jobId, error: result.error });
        if (!result.success && result.error?.includes('limit')) break;
      }
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      res.json({ success: successCount > 0, totalProcessed: results.length, successCount, failCount, results, warnings: preflight.warnings });
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error queueing bulk send:', error);
      res.status(500).json({ error: error.message || 'Failed to queue bulk LinkedIn send' });
    }
  });

  app.get("/api/linkedin/job-stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const stats = await LinkedInJobOrchestrator.getJobStats(userId);
      res.json(stats);
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error getting job stats:', error);
      res.status(500).json({ error: error.message || 'Failed to get job stats' });
    }
  });

  app.get("/api/linkedin/jobs", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      let query = db.select().from(linkedinJobQueue).where(eq(linkedinJobQueue.userId, userId)).orderBy(desc(linkedinJobQueue.createdAt)).limit(limit);
      if (status) query = db.select().from(linkedinJobQueue).where(and(eq(linkedinJobQueue.userId, userId), eq(linkedinJobQueue.status, status))).orderBy(desc(linkedinJobQueue.createdAt)).limit(limit);
      const jobs = await query;
      res.json(jobs);
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error getting jobs:', error);
      res.status(500).json({ error: error.message || 'Failed to get jobs' });
    }
  });

  app.get("/api/linkedin/dead-letter", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const jobs = await LinkedInJobOrchestrator.getDeadLetterJobs(userId);
      res.json(jobs);
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error getting dead letter jobs:', error);
      res.status(500).json({ error: error.message || 'Failed to get dead letter jobs' });
    }
  });

  app.post("/api/linkedin/dead-letter/:jobId/retry", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid job ID' });
      const result = await LinkedInJobOrchestrator.retryDeadLetterJob(jobId, userId);
      res.json(result);
    } catch (error: any) {
      console.error('[LinkedIn Queue] Error retrying dead letter job:', error);
      res.status(500).json({ error: error.message || 'Failed to retry job' });
    }
  });

  app.post("/api/linkedin/webhook/phantombuster", async (req: Request, res: Response) => {
    try {
      const { agentId, containerId, exitCode, exitMessage, resultObject } = req.body;
      console.log('[LinkedIn Webhook] Received Phantombuster callback:', { agentId, containerId, exitCode });
      const [job] = await db.select().from(linkedinJobQueue).where(eq(linkedinJobQueue.phantombusterContainerId, containerId));
      if (!job) { console.log('[LinkedIn Webhook] No matching job found for container:', containerId); return res.status(200).json({ received: true, matched: false }); }
      await db.update(linkedinJobQueue).set({ webhookReceived: true, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, job.id));
      await PhantombusterService.addAuditLog(job.id, 'webhook_received', { exitCode, exitMessage });
      if (exitCode === 0) {
        await db.update(linkedinJobQueue).set({ status: 'sent', sendVerified: true, completedAt: new Date(), updatedAt: new Date() }).where(eq(linkedinJobQueue.id, job.id));
        await PhantombusterService.addAuditLog(job.id, 'send_verified_via_webhook', {});
      } else await LinkedInJobOrchestrator.processJob(job.id);
      res.status(200).json({ received: true, matched: true, jobId: job.id });
    } catch (error: any) {
      console.error('[LinkedIn Webhook] Error processing callback:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
