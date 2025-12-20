import type { ReplyDetectionJob } from "@shared/schema";
import type { JobProcessingResult, HealthCheckResult, QuorumResult, VerificationResult } from "../types";
import { markJobFailed, logJobRun } from "../job-queue";

export async function handleHealthCheckFail(job: ReplyDetectionJob, healthCheck: HealthCheckResult, startTime: number): Promise<JobProcessingResult> {
  console.warn(`[ReplyDetectionProcessor] Health check failed for job ${job.id}: ${healthCheck.errorMessage}`);
  const quorumResult: QuorumResult = { quorumMet: false, found: false, healthyLayers: [], foundLayers: [], failedLayers: healthCheck.layersFailed, pendingReview: true };
  const verification: VerificationResult = { passed: false, allLayersRan: false, quorumSatisfied: false, dbWriteConfirmed: false, historyBaselineAdvanced: false, errors: [healthCheck.errorMessage || "Health check failed"] };
  const failResult: JobProcessingResult = { success: false, replyFound: false, healthCheck, layerResults: [], quorumResult, verification, durationMs: Date.now() - startTime, error: healthCheck.errorMessage };
  await markJobFailed(job, healthCheck.errorMessage || "Health check failed", failResult);
  await logJobRun(job.id, job.attempts + 1, healthCheck, [], quorumResult, verification, false, undefined, failResult.durationMs, failResult.error);
  return failResult;
}
