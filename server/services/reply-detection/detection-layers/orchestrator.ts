import { preFlightHealthCheck, validateQuorum } from "../health-watchdog";
import { storeEmailAlias } from "../alias";
import { logDetectionAttempt } from "../audit";
import { addToReviewQueue } from "../manual-review";
import type { ComprehensiveDetectionOptions, ComprehensiveDetectionResult, DetectionResult, EmailProvider } from "../types";
import { runThreadDetection } from "./thread-detection";
import { runExactEmailSearch, runDomainSearch } from "./email-search";
import { runNameSearch, runSubjectSearch } from "./name-subject-search";
import { mergeDetectionResults } from "./utils";

export async function detectReplyWithAllLayers(options: ComprehensiveDetectionOptions): Promise<ComprehensiveDetectionResult> {
  const startTime = Date.now();
  console.log(`[BulletproofDetection v3] Starting detection for email ${options.sentEmailId} (provider: ${options.provider})`);
  const healthCheck = await preFlightHealthCheck(options.userId, options.provider);
  if (!healthCheck.canProceed) {
    console.warn(`[BulletproofDetection] Provider ${options.provider} is unhealthy: ${healthCheck.healthStatus.errorMessage}`);
    return { found: false, replies: [], quorumMet: false, healthyLayersCount: 0, totalLayersChecked: 0, pendingReview: true, layerResults: [], searchMetadata: { layer: 'parallel-all', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Pre-flight failed: ${healthCheck.recommendation}` } };
  }
  console.log('[BulletproofDetection] Running 5 detection layers in parallel');
  const layerPromises = [
    runThreadDetection(options).catch(e => ({ found: false, replies: [], searchMetadata: { layer: 'enhanced_thread', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${e.message}` }, layerHealth: { layer: 'enhanced_thread', healthy: false, lastCheckedAt: new Date(), errorMessage: e.message } } as DetectionResult)),
    runExactEmailSearch(options).catch(e => ({ found: false, replies: [], searchMetadata: { layer: 'inbox_sweep_exact', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${e.message}` }, layerHealth: { layer: 'inbox_sweep_exact', healthy: false, lastCheckedAt: new Date(), errorMessage: e.message } } as DetectionResult)),
    runDomainSearch(options).catch(e => ({ found: false, replies: [], searchMetadata: { layer: 'inbox_sweep_domain', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${e.message}` }, layerHealth: { layer: 'inbox_sweep_domain', healthy: false, lastCheckedAt: new Date(), errorMessage: e.message } } as DetectionResult)),
    runNameSearch(options).catch(e => ({ found: false, replies: [], searchMetadata: { layer: 'inbox_sweep_name', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${e.message}` }, layerHealth: { layer: 'inbox_sweep_name', healthy: false, lastCheckedAt: new Date(), errorMessage: e.message } } as DetectionResult)),
    runSubjectSearch(options).catch(e => ({ found: false, replies: [], searchMetadata: { layer: 'message_id', queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${e.message}` }, layerHealth: { layer: 'message_id', healthy: false, lastCheckedAt: new Date(), errorMessage: e.message } } as DetectionResult)),
  ];
  const results = await Promise.all(layerPromises);
  const quorumResult = validateQuorum(results, { minHealthyLayers: 3, minConfirmingLayers: 3, markPendingOnQuorumFailure: true });
  const mergedResult = mergeDetectionResults(results);
  const layerResults = results.map(r => ({ layer: r.searchMetadata?.layer || 'unknown', found: r.found, healthy: r.layerHealth?.healthy !== false }));
  if (mergedResult.found && mergedResult.replies) {
    const aliasPromises = [];
    for (const reply of mergedResult.replies) { if (reply.detectedAlias && reply.detectedAlias !== options.contactEmail) aliasPromises.push(storeEmailAlias(options.contactId, reply.detectedAlias, 'reply_sender', 'v3_detection').catch(error => console.error('[BulletproofDetection] Error storing alias:', error))); }
    if (aliasPromises.length > 0) await Promise.all(aliasPromises);
  }
  const processingTime = Date.now() - startTime;
  console.log(`[BulletproofDetection v3] Complete in ${processingTime}ms - Found: ${mergedResult.found}, Quorum: ${quorumResult.quorumMet}, Pending: ${quorumResult.pendingReview}`);
  if (quorumResult.pendingReview && !mergedResult.found) {
    const potentialReply = mergedResult.replies?.[0];
    addToReviewQueue({ sentEmailId: options.sentEmailId, contactId: options.contactId, contactEmail: options.contactEmail, contactName: options.contactName || null, subject: options.subject || 'Unknown Subject', sentAt: options.sentAt, reason: `Quorum not met: only ${quorumResult.healthyLayers.length} healthy layers (need 3+)`, layersChecked: results.length, healthyLayers: quorumResult.healthyLayers.length, foundLayers: quorumResult.foundLayers, failedLayers: quorumResult.failedLayers, potentialReply: potentialReply ? { messageId: potentialReply.gmailMessageId, content: potentialReply.content, receivedAt: potentialReply.receivedAt, from: potentialReply.detectedAlias || options.contactEmail } : undefined });
    console.log(`[BulletproofDetection v3] Added to manual review queue`);
  }
  await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: 'parallel-all', resultFound: mergedResult.found, matchReason: `Quorum: ${quorumResult.quorumMet ? 'MET' : 'NOT MET'} (${quorumResult.healthyLayers.length} healthy, ${quorumResult.foundLayers.length} found)`, processingTimeMs: processingTime, metadata: { provider: options.provider, hasThreadId: !!options.gmailThreadId, hasMessageId: !!options.gmailMessageId, layersChecked: results.length, healthyLayers: quorumResult.healthyLayers, foundLayers: quorumResult.foundLayers, failedLayers: quorumResult.failedLayers, repliesFound: mergedResult.replies?.length || 0, quorumMet: quorumResult.quorumMet, pendingReview: quorumResult.pendingReview } });
  return { ...mergedResult, quorumMet: quorumResult.quorumMet, healthyLayersCount: quorumResult.healthyLayers.length, totalLayersChecked: results.length, pendingReview: quorumResult.pendingReview, layerResults };
}

export async function checkDetectionHealth(userId: number, provider: EmailProvider): Promise<{ canDetect: boolean; providerHealthy: boolean; recommendation: string }> {
  const healthCheck = await preFlightHealthCheck(userId, provider);
  return { canDetect: healthCheck.canProceed, providerHealthy: healthCheck.healthStatus.healthy, recommendation: healthCheck.recommendation === 'proceed' ? 'Ready for detection' : healthCheck.recommendation === 'requires_reauth' ? 'Please reconnect your email account' : 'Temporary issue - will retry automatically' };
}
