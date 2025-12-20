import { Router, Request, Response } from "express";
import { z } from "zod";
import { handlePushNotification, setupPushNotifications, stopPushNotifications, startPollingForUser, stopPollingForUser } from "../../services/reply-detection/gmail-push-notifications";

export const router = Router();

router.post("/api/webhooks/gmail/push", async (req: Request, res: Response) => {
  try {
    res.status(200).send();
    const result = await handlePushNotification(req.body);
    if (result.processed) console.log(`[GmailPush] Processed notification for user ${result.userId}, found ${result.repliesFound} replies`);
  } catch (error: any) {
    console.error("[GmailPush] Webhook error:", error);
    res.status(200).send();
  }
});

router.post("/api/reply-detection-engine/push/setup", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    const schema = z.object({ topicName: z.string().optional() });
    const data = schema.parse(req.body);
    const result = await setupPushNotifications(userId, data.topicName);
    if (!result.success && result.error?.includes("polling mode")) {
      startPollingForUser(userId);
      res.json({ success: true, mode: "polling", message: "Push not available, using aggressive polling (1 minute interval)" });
    } else if (result.success) {
      res.json({ success: true, mode: "push", expiration: result.expiration });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to setup push:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/api/reply-detection-engine/push/stop", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });
    await stopPushNotifications(userId);
    stopPollingForUser(userId);
    res.json({ success: true, message: "Push notifications and polling stopped" });
  } catch (error: any) {
    console.error("[ReplyDetectionAPI] Failed to stop push:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
