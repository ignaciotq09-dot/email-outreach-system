import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDeadLetterQueue, getPendingReviewEntries, getDeadLetterStats, reviewDeadLetterEntry } from "../../services/reply-detection-engine";

export const router = Router();

router.get("/api/reply-detection-engine/dead-letters", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = await getDeadLetterQueue(userId, status, limit);
    const stats = await getDeadLetterStats(userId);
    res.json({ success: true, entries, stats });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get dead letters:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/api/reply-detection-engine/dead-letters/pending", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = await getPendingReviewEntries(userId, limit);
    res.json({ success: true, entries });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get pending reviews:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/dead-letters/:id/review", async (req: Request, res: Response) => {
  try {
    const deadLetterId = parseInt(req.params.id);
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const schema = z.object({ action: z.enum(["retry", "manual_check", "skip", "mark_no_reply", "mark_has_reply"]), notes: z.string().optional(), replyContent: z.string().optional() });
    const data = schema.parse(req.body);
    const result = await reviewDeadLetterEntry(deadLetterId, data.action, userId, data.notes, data.replyContent);
    res.json(result);
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to review dead letter:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
