export { followUpEngine } from "./engine";

export {
  createJob,
  getDueJobs,
  getRetryableJobs,
  updateJobStatus,
  incrementAttempt,
  scheduleRetry,
  moveToDeadLetter,
  cancelJob,
  getJobById,
  getQueueStats,
  getJobsForContact,
  getJobAuditLog,
} from "./job-queue";

export {
  checkProviderHealth,
  validateTokenBeforeSend,
  clearHealthCache,
  getHealthCacheStats,
} from "./health-checker";

export { processJob } from "./processor";

export { verifySendComplete, quickVerify } from "./send-verifier";

export {
  runHourlyReconciliation,
  runNightlyReconciliation,
  getReconciliationHistory,
} from "./reconciliation";

export {
  getPendingDeadLetters,
  getDeadLetterById,
  reviewDeadLetter,
  getDeadLetterStats,
} from "./dead-letter";

export type {
  JobStatus,
  HealthCheckResult,
  SendResult,
  VerificationResult,
  ProcessingResult,
  RetrySchedule,
  JobQueueStats,
  ReconciliationResult,
  DeadLetterReviewAction,
  FollowUpJobWithContext,
} from "./types";

export { RETRY_SCHEDULE, MAX_RETRY_ATTEMPTS } from "./types";
