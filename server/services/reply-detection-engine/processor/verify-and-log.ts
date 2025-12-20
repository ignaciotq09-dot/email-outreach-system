import type { ReplyDetectionJob } from "@shared/schema";
import type { JobProcessingResult, HealthCheckResult, LayerExecutionResult, QuorumResult, VerificationResult } from "../types";
import { markJobVerified, markJobFailed, logJobRun, logAnomaly } from "../job-queue";

export function buildVerification(quorumResult: QuorumResult, dbWriteConfirmed: boolean, layerCount: number): VerificationResult {
  const errors: string[] = []; if (layerCount < 3) errors.push(`Only ${layerCount} layers ran`); if (!quorumResult.quorumMet) errors.push("Quorum not satisfied"); return { passed: quorumResult.quorumMet && dbWriteConfirmed, allLayersRan: layerCount >= 3, quorumSatisfied: quorumResult.quorumMet, dbWriteConfirmed, historyBaselineAdvanced: true, errors };
}

export async function logQuorumFailureAnomaly(job: ReplyDetectionJob, quorumResult: QuorumResult, layerResults: LayerExecutionResult[]) {
  await logAnomaly({ userId: job.userId, sentEmailId: job.sentEmailId, contactId: job.contactId, jobId: job.id, anomalyType: "quorum_failure", severity: "medium", provider: job.provider, details: { description: `Quorum failed: ${quorumResult.healthyLayers.length} healthy, ${quorumResult.failedLayers.length} failed`, layersHealthy: quorumResult.healthyLayers.length, layersTotal: layerResults.length }, requiresManualReview: true, status: "open" });
}

export async function logLayerDisagreementAnomaly(job: ReplyDetectionJob, quorumResult: QuorumResult) {
  const layersThatFound = quorumResult.foundLayers.length; const layersThatDidntFind = quorumResult.healthyLayers.length - layersThatFound; if (layersThatFound > 0 && layersThatDidntFind > 0) { const disagreementSeverity = layersThatFound >= layersThatDidntFind ? "low" : "high"; await logAnomaly({ userId: job.userId, sentEmailId: job.sentEmailId, contactId: job.contactId, jobId: job.id, anomalyType: "layer_disagreement", severity: disagreementSeverity, provider: job.provider, details: { description: `Layer disagreement: ${layersThatFound} layers found reply, ${layersThatDidntFind} healthy layers did not`, layersFound: quorumResult.foundLayers, layersDidNotFind: quorumResult.healthyLayers.filter(l => !quorumResult.foundLayers.includes(l)), healthyLayersTotal: quorumResult.healthyLayers.length, recommendation: layersThatFound >= layersThatDidntFind ? "Reply likely valid - majority confirmed" : "Potential false positive - minority found reply" }, requiresManualReview: disagreementSeverity === "high", status: "open" }); console.log(`[ReplyDetectionProcessor] Layer disagreement detected: ${layersThatFound}/${quorumResult.healthyLayers.length} found reply`); }
}

export async function finalizeJob(job: ReplyDetectionJob, result: JobProcessingResult, healthCheck: HealthCheckResult, layerResults: LayerExecutionResult[], replyFound: boolean, replyMessageId?: string) {
  if (result.verification.passed) await markJobVerified(job, result); else await markJobFailed(job, result.verification.errors.join("; "), result);
  await logJobRun(job.id, job.attempts + 1, healthCheck, layerResults, result.quorumResult, result.verification, replyFound, replyMessageId, result.durationMs); console.log(`[ReplyDetectionProcessor] Job ${job.id} completed in ${result.durationMs}ms - reply found: ${replyFound}`);
}
