import { Router, Request, Response } from "express";
import { replyDetectionEngine, getQueueStats, getRecentAnomalies } from "../../services/reply-detection-engine";

export const router = Router();

router.get("/api/reply-detection-engine/stats", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const stats = await replyDetectionEngine.getStats(userId);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/api/reply-detection-engine/queue", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const queueStats = await getQueueStats(userId);
    res.json({ success: true, stats: queueStats });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get queue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/api/reply-detection-engine/anomalies", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const limit = parseInt(req.query.limit as string) || 50;
    const anomalies = await getRecentAnomalies(userId, limit);
    res.json({ success: true, anomalies });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get anomalies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/api/reply-detection-engine/health", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const isRunning = replyDetectionEngine.isEngineRunning();
    const stats = userId ? await replyDetectionEngine.getStats(userId) : { processingCount: 0, isRunning };
    res.json({ success: true, isRunning, stats });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get health:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
