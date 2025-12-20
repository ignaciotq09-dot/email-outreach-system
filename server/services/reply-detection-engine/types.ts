/**
 * Reply Detection Engine Types v2.0
 * 
 * Core types and configuration for bulletproof reply detection.
 */

export type DetectionProvider = "gmail" | "outlook" | "yahoo";

export type DetectionLayer = 
  | "enhanced_thread"
  | "message_id"
  | "inbox_sweep_exact"
  | "inbox_sweep_domain"
  | "inbox_sweep_name"
  | "alias_intelligence"
  | "gmail_history";

export interface HealthCheckResult {
  healthy: boolean;
  tokenValid: boolean;
  providerReachable: boolean;
  layersReady: DetectionLayer[];
  layersFailed: DetectionLayer[];
  errorMessage?: string;
  checkedAt: Date;
}

export interface LayerExecutionResult {
  layer: DetectionLayer;
  healthy: boolean;
  found: boolean;
  messagesScanned: number;
  pagesChecked: number;
  queriesRun: string[];
  durationMs: number;
  error?: string;
  replies?: DetectedReply[];
}

export interface DetectedReply {
  gmailMessageId: string;
  gmailThreadId?: string;
  senderEmail: string;
  receivedAt: Date;
  subject?: string;
  content?: string;
  detectedByLayer: DetectionLayer;
  confidence: number;
}

export interface QuorumResult {
  quorumMet: boolean;
  found: boolean;
  healthyLayers: DetectionLayer[];
  foundLayers: DetectionLayer[];
  failedLayers: DetectionLayer[];
  pendingReview: boolean;
}

export interface VerificationResult {
  passed: boolean;
  allLayersRan: boolean;
  quorumSatisfied: boolean;
  dbWriteConfirmed: boolean;
  historyBaselineAdvanced: boolean;
  errors: string[];
}

export interface JobProcessingResult {
  success: boolean;
  replyFound: boolean;
  healthCheck: HealthCheckResult;
  layerResults: LayerExecutionResult[];
  quorumResult: QuorumResult;
  verification: VerificationResult;
  durationMs: number;
  error?: string;
}

// Aggressive exponential backoff for faster recovery: 1min → 5min → 15min → 1hr → 6hr
// Designed to catch transient errors quickly while not overwhelming the API
export const RETRY_SCHEDULE_MS = [
  1 * 60 * 1000,      // 1 minute - catch transient network issues fast
  5 * 60 * 1000,      // 5 minutes - handle token refresh scenarios
  15 * 60 * 1000,     // 15 minutes - allow API rate limits to clear
  1 * 60 * 60 * 1000, // 1 hour - longer-term provider issues
  6 * 60 * 60 * 1000  // 6 hours - give time for service recovery
];

export const MAX_RETRY_ATTEMPTS = 5;

export const QUORUM_CONFIG = {
  minHealthyLayers: 3,
  minConfirmingLayers: 2,
  markPendingOnQuorumFailure: true,
};

export const ENGINE_CONFIG = {
  processingIntervalMs: 30 * 1000,
  maxConcurrentJobs: 10,
  jobTimeoutMs: 60 * 1000,
  healthCacheTtlMs: 5 * 60 * 1000,
  
  reconciliation: {
    hourlyLookbackHours: 24,
    hourlyMinCheckAgeHours: 1,
    nightlyMaxEmails: 500,
    nightlyScheduleHour: 2,
  },
  
  metrics: {
    aggregationIntervalMs: 60 * 60 * 1000,
  },
};

export function getNextRetryDelay(attemptNumber: number): number {
  const index = Math.min(attemptNumber - 1, RETRY_SCHEDULE_MS.length - 1);
  return RETRY_SCHEDULE_MS[index];
}

export function shouldMoveToDeadLetter(attemptNumber: number): boolean {
  return attemptNumber >= MAX_RETRY_ATTEMPTS;
}
