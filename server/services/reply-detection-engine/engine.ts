// Re-export from modular structure for backward compatibility
export { replyDetectionEngine } from "./core/engine";
export { getActiveEmailUsers } from "./core/bootstrap";
export { syncPendingJobsForUser } from "./core/sync-jobs";
export { processQueuedJobs, processRetryQueue } from "./core/processing";
