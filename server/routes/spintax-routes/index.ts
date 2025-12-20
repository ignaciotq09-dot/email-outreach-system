import { Router } from "express";
import { handleGenerateVariations, handlePreviewVariation, handleGetStats, handleBatchVariations } from "./variations";
import { handleOptimalSendTime, handleBatchOptimalTimes, handleGetInsights } from "./send-time";
import { handleScheduleSend, handleScheduleBatch, handleGetScheduledSends, handleGetQueueStats, handleCancelSend } from "./scheduled";

const router = Router();

router.post("/generate-variations", handleGenerateVariations);
router.post("/preview-variation", handlePreviewVariation);
router.get("/stats", handleGetStats);
router.post("/batch-variations", handleBatchVariations);
router.post("/optimal-send-time", handleOptimalSendTime);
router.post("/batch-optimal-times", handleBatchOptimalTimes);
router.get("/send-time-insights", handleGetInsights);
router.post("/schedule-send", handleScheduleSend);
router.post("/schedule-batch", handleScheduleBatch);
router.get("/scheduled-sends", handleGetScheduledSends);
router.get("/scheduled-queue-stats", handleGetQueueStats);
router.delete("/scheduled-sends/:id", handleCancelSend);

export default router;
