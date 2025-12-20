import { Router, Request, Response } from "express";
import { z } from "zod";
import { createDetectionJob, getJobById } from "../../services/reply-detection-engine";
import type { ReplyDetectionJobType } from "@shared/schema";

export const router = Router();

router.get("/api/reply-detection-engine/jobs/:id", async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = await getJobById(jobId);
    if (!job) return res.status(404).json({ success: false, error: "Job not found" });
    res.json({ success: true, job });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/jobs", async (req: Request, res: Response) => {
  try {
    const schema = z.object({ sentEmailId: z.number(), contactId: z.number(), provider: z.enum(["gmail", "outlook", "yahoo"]), priority: z.number().optional().default(5) });
    const data = schema.parse(req.body);
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const job = await createDetectionJob({ userId, sentEmailId: data.sentEmailId, contactId: data.contactId, jobType: "manual_recheck" as ReplyDetectionJobType, provider: data.provider, priority: data.priority, scheduledFor: new Date(), metadata: { triggeredBy: "manual_api_request" } });
    res.json({ success: true, job });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to create job:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
