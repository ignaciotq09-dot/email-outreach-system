import type { ReplyDetectionJob } from "@shared/schema";
import type { JobProcessingResult, HealthCheckResult, QuorumResult, VerificationResult } from "../types";
import { markJobFailed, logJobRun } from "../job-queue";

export async function handleDetectionError(job: ReplyDetectionJob, healthCheck: HealthCheckResult, error: any, startTime: number): Promise<JobProcessingResult> {
  const durationMs = Date.now() - startTime; const errorMessage = error.message || "Unknown error during detection"; console.error(`[ReplyDetectionProcessor] Job ${job.id} failed:`, error);
  const quorumResult: QuorumResult = { quorumMet: false, found: false, healthyLayers: [], foundLayers: [], failedLayers: [], pendingReview: true };
  const verification: VerificationResult = { passed: false, allLayersRan: false, quorumSatisfied: false, dbWriteConfirmed: false, historyBaselineAdvanced: false, errors: [errorMessage] };
  const failResult: JobProcessingResult = { success: false, replyFound: false, healthCheck, layerResults: [], quorumResult, verification, durationMs, error: errorMessage };
  await markJobFailed(job, errorMessage, failResult); await logJobRun(job.id, job.attempts + 1, healthCheck, [], quorumResult, verification, false, undefined, durationMs, errorMessage); return failResult;
}
