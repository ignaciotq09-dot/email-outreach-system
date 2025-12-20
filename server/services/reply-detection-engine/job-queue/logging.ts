import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { replyDetectionJobs, replyDetectionRuns, replyDetectionAnomalies, type InsertReplyDetectionRun, type InsertReplyDetectionAnomaly } from "@shared/schema";
import type { HealthCheckResult, LayerExecutionResult, QuorumResult, VerificationResult } from "../types";

export async function logJobRun(jobId: number, runNumber: number, healthCheck: HealthCheckResult, layerResults: LayerExecutionResult[], quorumResult: QuorumResult, verification: VerificationResult, replyFound: boolean, replyMessageId?: string, durationMs?: number, error?: string): Promise<void> {
  const runData: InsertReplyDetectionRun = { jobId, runNumber, completedAt: new Date(), durationMs, healthCheckPassed: healthCheck.healthy, healthCheckDetails: { tokenValid: healthCheck.tokenValid, providerHealthy: healthCheck.providerReachable, layersReady: healthCheck.layersReady, errorMessage: healthCheck.errorMessage }, layerResults: layerResults.map(lr => ({ layer: lr.layer, healthy: lr.healthy, found: lr.found, messagesScanned: lr.messagesScanned, queriesRun: lr.queriesRun, durationMs: lr.durationMs, error: lr.error })), quorumResult: { quorumMet: quorumResult.quorumMet, healthyLayers: quorumResult.healthyLayers, foundLayers: quorumResult.foundLayers, failedLayers: quorumResult.failedLayers }, replyFound, replyMessageId, replySavedToDb: replyFound, verificationPassed: verification.passed, verificationDetails: { allLayersRan: verification.allLayersRan, quorumSatisfied: verification.quorumSatisfied, dbWriteConfirmed: verification.dbWriteConfirmed, historyBaselineAdvanced: verification.historyBaselineAdvanced, errors: verification.errors }, outcome: error ? "failed" : verification.passed ? "success" : "partial", errorMessage: error };
  await db.insert(replyDetectionRuns).values(runData as any);
}

export async function logAnomaly(anomaly: InsertReplyDetectionAnomaly): Promise<void> { await db.insert(replyDetectionAnomalies).values(anomaly as any); console.log(`[ReplyDetectionQueue] Logged anomaly: ${anomaly.anomalyType} for sent_email ${anomaly.sentEmailId}`); }

export async function getQueueStats(userId: number): Promise<{ pending: number; queued: number; executing: number; verified: number; failed: number; dead: number; total: number; }> {
  const stats = await db.select({ status: replyDetectionJobs.status, count: sql<number>`count(*)::int` }).from(replyDetectionJobs).where(eq(replyDetectionJobs.userId, userId)).groupBy(replyDetectionJobs.status);
  const result = { pending: 0, queued: 0, executing: 0, verified: 0, failed: 0, dead: 0, total: 0 };
  for (const row of stats) { const status = row.status as keyof typeof result; if (status in result) result[status] = row.count; result.total += row.count; }
  return result;
}
