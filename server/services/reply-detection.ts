// Re-export from modular structure for backward compatibility
export type { ReplyDetectionResult, ThreadCheckOptions } from "./reply-detection-utils/index";
export { isAutoReplyMessage, extractSenderEmail, emailsMatch, decodeBase64Url, extractMessageContent, stripQuotedContent, checkThreadForAuthenticReplies } from "./reply-detection-utils/index";

// Re-export from main reply-detection module
export { detectReplyWithAllLayers, checkDetectionHealth, runThreadDetection, mergeDetectionResults, emailsMatchLoose } from "./reply-detection/index";
export type { DetectionResult, ComprehensiveDetectionOptions, ComprehensiveDetectionResult, DetectionLayer, EmailProvider } from "./reply-detection/index";

// Scheduler exports
export { startBulletproofScheduler, stopBulletproofScheduler, getBulletproofSchedulerStatus, triggerDeltaSweep, triggerReconciliationForUser } from "./reply-detection/index";

// Gmail sync exports
export { performIncrementalSync, checkTokenHealth, getSyncStatus } from "./reply-detection/index";

// Push notification exports
export { setupPushNotifications, stopPushNotifications, handlePushNotification, startWatchRenewal, stopWatchRenewal, getPushStatus, startPollingForUser, stopPollingForUser, isPollingActive, getPollingUserCount } from "./reply-detection/index";

// Health and reconciliation exports
export { preFlightHealthCheck, checkProviderHealth, validateQuorum, clearHealthCache, storeEmailAlias, getContactAliases, getAdapter, getAllAdapters, isProviderSupported, addToReviewQueue, getPendingReviews, acceptReview, rejectReview, getReviewStats, runHourlyReconciliation, runNightlyReconciliation, reconciliationService, getRecentAnomalies } from "./reply-detection/index";
