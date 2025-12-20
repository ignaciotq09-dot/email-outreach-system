import { getAdapter } from "../adapters";
import { logDetectionAttempt } from "../audit";
import type { ComprehensiveDetectionOptions, DetectionResult } from "../types";
import { emailsMatchLoose } from "./utils";

export async function runThreadDetection(options: ComprehensiveDetectionOptions): Promise<DetectionResult> {
  const startTime = Date.now();
  const layer = 'enhanced_thread';
  if (!options.gmailThreadId) return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: 'No thread ID provided' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date() } };
  try {
    const adapter = getAdapter(options.provider);
    const thread = await adapter.fetchThread(options.userId, options.gmailThreadId);
    if (!thread) return { found: false, replies: [], searchMetadata: { layer, queriesRun: ['fetchThread'], pagesChecked: 1, messagesScanned: 0, notes: 'Thread not found' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
    const userEmail = options.userEmail || await adapter.getUserEmail(options.userId);
    const replies = [];
    for (const msg of thread.messages) {
      if (userEmail && emailsMatchLoose(msg.from, userEmail)) continue;
      if (msg.isAutoReply) continue;
      if (msg.receivedAt < options.sentAt) continue;
      if (emailsMatchLoose(msg.from, options.contactEmail) || (options.contactEmail.split('@')[1] === msg.from.split('@')[1])) {
        replies.push({ gmailMessageId: msg.id, gmailThreadId: msg.threadId, subject: msg.subject, content: msg.content, receivedAt: msg.receivedAt, detectedAlias: msg.from !== options.contactEmail ? msg.from : undefined, provider: options.provider });
      }
    }
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, resultFound: replies.length > 0, gmailThreadId: options.gmailThreadId, matchReason: replies.length > 0 ? `Found ${replies.length} replies in thread` : 'No replies in thread', processingTimeMs: Date.now() - startTime });
    return { found: replies.length > 0, replies, searchMetadata: { layer, queriesRun: ['fetchThread'], pagesChecked: 1, messagesScanned: thread.messages.length, notes: replies.length > 0 ? 'Reply found in thread' : 'No replies in thread' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
  } catch (error: any) {
    console.error(`[ThreadDetection] Error:`, error);
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, resultFound: false, errorMessage: error?.message, processingTimeMs: Date.now() - startTime });
    return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${error?.message}` }, layerHealth: { layer, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message } };
  }
}
