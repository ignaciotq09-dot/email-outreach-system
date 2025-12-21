/**
 * Reply Detection Engine v2.0
 * 
 * Bulletproof reply detection with 100% reliability.
 * 
 * Features:
 * - Persistent job queue with status tracking
 * - Pre-flight health checks before each run
 * - 5 detection layers with quorum validation
 * - Execution verification
 * - Retry with exponential backoff (5min, 30min, 2hrs, 6hrs, 24hrs)
 * - Dead letter queue for manual review
 * - Hourly + nightly reconciliation
 * - Complete audit trail
 */

export {
  replyDetectionEngine,
} from "./engine";

export {
  createDetectionJob,
  createBulkDetectionJobs,
  getQueuedJobs,
  getJobById,
  updateJobStatus,
  logAnomaly,
  getQueueStats,
  getDeadLetterQueue,
  getRecentAnomalies,
} from "./job-queue";

export { getReconciliationHistory } from "./reconciliation";
export { getPendingReviewEntries, getDeadLetterStats, reviewDeadLetterEntry } from "./dead-letter";
export { invalidateHealthCache } from "./health-checker";


import { createDetectionJob as internalCreateJob } from "./job-queue";
import type { DetectionProvider } from "./types";

export async function queueReplyDetectionForSentEmail(
  userId: number,
  sentEmailId: number,
  contactId: number,
  provider: DetectionProvider,
  delayMinutes: number = 5
): Promise<void> {
  const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

  await internalCreateJob({
    userId,
    sentEmailId,
    contactId,
    jobType: "scheduled_scan",
    provider,
    priority: 5,
    scheduledFor,
    metadata: {
      triggeredBy: "email_sent" as const,
    },
  });

  console.log(`[ReplyDetectionEngine] Queued detection for email ${sentEmailId} in ${delayMinutes} minutes`);
}

export { processDetectionJob } from "./processor";

export { performHealthCheck, clearHealthCache, getHealthCacheStats } from "./health-checker";

export { runHourlyReconciliation, runNightlyReconciliation } from "./reconciliation";

export type {
  DetectionProvider,
  DetectionLayer,
  HealthCheckResult,
  LayerExecutionResult,
  DetectedReply,
  QuorumResult,
  VerificationResult,
  JobProcessingResult,
} from "./types";

export {
  RETRY_SCHEDULE_MS,
  MAX_RETRY_ATTEMPTS,
  QUORUM_CONFIG,
  ENGINE_CONFIG,
  getNextRetryDelay,
  shouldMoveToDeadLetter,
} from "./types";
