import { Router, Request, Response } from "express";
import { z } from "zod";
import { replyDetectionEngine } from "../../services/reply-detection-engine";
import { getBulletproofSchedulerStatus, triggerDeltaSweep } from "../../services/reply-detection";

export const router = Router();

router.post("/api/reply-detection-engine/start", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const schema = z.object({ provider: z.enum(["gmail", "outlook", "yahoo"]) });
    const data = schema.parse(req.body);
    await replyDetectionEngine.start(userId, data.provider);
    res.json({ success: true, message: "Reply detection engine started" });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to start engine:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/stop", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    replyDetectionEngine.stop();
    res.json({ success: true, message: "Reply detection engine stopped" });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to stop engine:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/api/reply-detection-engine/scheduler/status", async (req: Request, res: Response) => {
  try {
    const { getPushStatus } = await import("../../services/reply-detection/gmail-push-notifications");
    const schedulerStatus = getBulletproofSchedulerStatus();
    const pushStatus = getPushStatus();
    res.json({ success: true, scheduler: schedulerStatus, push: pushStatus });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get scheduler status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/scheduler/sweep", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    await triggerDeltaSweep(userId);
    res.json({ success: true, message: "Delta sweep triggered" });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to trigger sweep:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
