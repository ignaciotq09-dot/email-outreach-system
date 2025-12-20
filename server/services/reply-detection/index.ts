/**
 * Bulletproof Reply Detection System v4.0 - Orchestrator
 * 
 * 100% reliable reply detection using:
 * - Gmail History API for incremental sync (never misses an email)
 * - Message-ID header correlation (In-Reply-To, References)
 * - Multi-layer detection with quorum validation
 * - 3-tier scanning: Real-time + Delta sweep (15min) + Nightly reconciliation
 * - Processed message deduplication
 * - Complete audit trail
 * - Token health monitoring and dead man's switch alerting
 */

import { getAdapter } from "./adapters";
import { preFlightHealthCheck, validateQuorum } from "./health-watchdog";

// Export types and utilities for external use
export type { 
  DetectionResult, 
  ComprehensiveDetectionOptions, 
  ComprehensiveDetectionResult,
  DetectionLayer,
  EmailProvider,
  LayerHealthStatus,
  ProviderMessage,
} from "./types";
export { storeEmailAlias, getContactAliases } from "./alias";
export { preFlightHealthCheck, checkProviderHealth, validateQuorum, clearHealthCache } from "./health-watchdog";
export { getAdapter, getAllAdapters, isProviderSupported } from "./adapters";
export { addToReviewQueue, getPendingReviews, acceptReview, rejectReview, getReviewStats } from "./manual-review";
export { runHourlyReconciliation, runNightlyReconciliation, reconciliationService, getRecentAnomalies } from "./reconciliation";

// Bulletproof v4.0 exports - Gmail History API based detection
export { 
  performIncrementalSync, 
  checkTokenHealth, 
  getSyncStatus 
} from "./gmail-sync";
export { 
  startScheduler as startBulletproofScheduler,
  stopScheduler as stopBulletproofScheduler,
  getSchedulerStatus as getBulletproofSchedulerStatus,
  triggerDeltaSweep,
  triggerReconciliationForUser
} from "./scheduler";
export {
  setupPushNotifications,
  stopPushNotifications,
  handlePushNotification,
  startWatchRenewal,
  stopWatchRenewal,
  getPushStatus,
  startPollingForUser,
  stopPollingForUser,
  isPollingActive,
  getPollingUserCount,
} from "./gmail-push-notifications";

// Detection layers
export { 
  detectReplyWithAllLayers,
  checkDetectionHealth,
  runThreadDetection,
  runExactEmailSearch,
  runDomainSearch,
  runNameSearch,
  runSubjectSearch,
  mergeDetectionResults,
  emailsMatchLoose
} from "./detection-layers";
