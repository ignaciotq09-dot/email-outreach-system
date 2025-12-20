import { Router, Request, Response } from "express";
import { performIncrementalSync, getSyncStatus } from "../../services/reply-detection/gmail-sync";

export const router = Router();

router.get("/api/reply-detection-engine/sync/status", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const syncStatus = await getSyncStatus(userId);
    res.json({ success: true, status: syncStatus });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get sync status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/sync/now", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const result = await performIncrementalSync(userId);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to perform sync:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
