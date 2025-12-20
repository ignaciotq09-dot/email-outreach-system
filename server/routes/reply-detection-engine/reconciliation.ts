import { Router, Request, Response } from "express";
import { z } from "zod";
import { getReconciliationHistory, runHourlyReconciliation, runNightlyReconciliation } from "../../services/reply-detection-engine";
import { triggerReconciliationForUser } from "../../services/reply-detection";

export const router = Router();

router.get("/api/reply-detection-engine/reconciliation/history", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const history = await getReconciliationHistory(userId, limit);
    res.json({ success: true, history });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to get reconciliation history:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/reconciliation/run", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const schema = z.object({ type: z.enum(["hourly", "nightly"]), provider: z.enum(["gmail", "outlook", "yahoo"]) });
    const data = schema.parse(req.body);
    let result;
    if (data.type === "hourly") result = await runHourlyReconciliation(userId, data.provider);
    else result = await runNightlyReconciliation(userId, data.provider);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to run reconciliation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/scheduler/reconcile", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    await triggerReconciliationForUser(userId);
    res.json({ success: true, message: "Reconciliation triggered" });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to trigger reconciliation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
