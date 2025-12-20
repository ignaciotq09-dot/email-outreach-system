import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  followUpEngine,
  getQueueStats,
  getJobById,
  getJobsForContact,
  getJobAuditLog,
  getPendingDeadLetters,
  getDeadLetterById,
  reviewDeadLetter,
  getDeadLetterStats,
  getReconciliationHistory,
} from "../services/follow-up-engine";

const router = Router();

router.get("/api/follow-up-engine/stats", async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const deadLetterStats = await getDeadLetterStats();
    
    res.json({
      queue: queueStats,
      deadLetter: deadLetterStats,
      engine: {
        active: followUpEngine.isActive(),
        activeJobs: followUpEngine.getActiveJobCount(),
      },
    });
  } catch (error: any) {
    console.error("[API] Error getting follow-up engine stats:", error);
    res.status(500).json({ error: error?.message || "Failed to get stats" });
  }
});

router.get("/api/follow-up-engine/jobs/:id", async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }
    
    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const auditLog = await getJobAuditLog(jobId);
    
    res.json({ job, auditLog });
  } catch (error: any) {
    console.error("[API] Error getting job:", error);
    res.status(500).json({ error: error?.message || "Failed to get job" });
  }
});

router.get("/api/follow-up-engine/contacts/:contactId/jobs", async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    if (isNaN(contactId)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }
    
    const jobs = await getJobsForContact(contactId);
    res.json(jobs);
  } catch (error: any) {
    console.error("[API] Error getting contact jobs:", error);
    res.status(500).json({ error: error?.message || "Failed to get jobs" });
  }
});

router.get("/api/follow-up-engine/dead-letters", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const items = await getPendingDeadLetters(limit);
    res.json(items);
  } catch (error: any) {
    console.error("[API] Error getting dead letters:", error);
    res.status(500).json({ error: error?.message || "Failed to get dead letters" });
  }
});

router.get("/api/follow-up-engine/dead-letters/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    
    const item = await getDeadLetterById(id);
    if (!item) {
      return res.status(404).json({ error: "Dead letter not found" });
    }
    
    res.json(item);
  } catch (error: any) {
    console.error("[API] Error getting dead letter:", error);
    res.status(500).json({ error: error?.message || "Failed to get dead letter" });
  }
});

const reviewSchema = z.object({
  action: z.enum(["retry", "skip", "manual_send", "cancel"]),
  notes: z.string().optional(),
});

router.post("/api/follow-up-engine/dead-letters/:id/review", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    
    const body = reviewSchema.parse(req.body);
    const reviewedBy = (req as any).user?.email || "system";
    
    const result = await reviewDeadLetter(id, body, reviewedBy);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, newJobId: result.newJobId });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request body", details: error.errors });
    }
    console.error("[API] Error reviewing dead letter:", error);
    res.status(500).json({ error: error?.message || "Failed to review dead letter" });
  }
});

router.get("/api/follow-up-engine/reconciliation/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await getReconciliationHistory(limit);
    res.json(history);
  } catch (error: any) {
    console.error("[API] Error getting reconciliation history:", error);
    res.status(500).json({ error: error?.message || "Failed to get history" });
  }
});

router.post("/api/follow-up-engine/force-process", async (req, res) => {
  try {
    await followUpEngine.forceProcessNow();
    res.json({ success: true, message: "Queue processing triggered" });
  } catch (error: any) {
    console.error("[API] Error forcing process:", error);
    res.status(500).json({ error: error?.message || "Failed to force process" });
  }
});

router.post("/api/follow-up-engine/force-reconciliation", async (req, res) => {
  try {
    const result = await followUpEngine.forceReconciliationNow();
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("[API] Error forcing reconciliation:", error);
    res.status(500).json({ error: error?.message || "Failed to force reconciliation" });
  }
});

export default router;
