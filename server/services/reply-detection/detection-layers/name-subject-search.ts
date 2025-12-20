import { getAdapter } from "../adapters";
import { logDetectionAttempt } from "../audit";
import type { ComprehensiveDetectionOptions, DetectionResult } from "../types";
import { emailsMatchLoose } from "./utils";

export async function runNameSearch(options: ComprehensiveDetectionOptions): Promise<DetectionResult> {
  const startTime = Date.now();
  const layer = 'inbox_sweep_name';
  if (!options.contactName) return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: 'No contact name provided' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date() } };
  try {
    const adapter = getAdapter(options.provider);
    const query = `from:"${options.contactName}"`;
    const messages = await adapter.searchMessages(options.userId, query, { maxResults: 50, afterDate: options.sentAt });
    const userEmail = options.userEmail || await adapter.getUserEmail(options.userId);
    const domain = options.contactEmail.split('@')[1];
    const replies = [];
    for (const msg of messages) {
      if (userEmail && emailsMatchLoose(msg.from, userEmail)) continue;
      if (msg.isAutoReply) continue;
      const fromDomain = msg.from.split('@')[1];
      if (fromDomain === domain) replies.push({ gmailMessageId: msg.id, gmailThreadId: msg.threadId, subject: msg.subject, content: msg.content, receivedAt: msg.receivedAt, detectedAlias: msg.from, provider: options.provider });
    }
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, gmailQuery: query, resultFound: replies.length > 0, matchReason: replies.length > 0 ? `Found ${replies.length} emails from name match` : 'No matches', processingTimeMs: Date.now() - startTime });
    return { found: replies.length > 0, replies, searchMetadata: { layer, queriesRun: [query], pagesChecked: 1, messagesScanned: messages.length, notes: replies.length > 0 ? 'Found via name search' : 'No matches' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
  } catch (error: any) {
    console.error(`[NameSearch] Error:`, error);
    return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${error?.message}` }, layerHealth: { layer, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message } };
  }
}

export async function runSubjectSearch(options: ComprehensiveDetectionOptions): Promise<DetectionResult> {
  const startTime = Date.now();
  const layer = 'message_id';
  if (!options.subject) return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: 'No subject provided' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date() } };
  try {
    const adapter = getAdapter(options.provider);
    const baseSubject = options.subject.replace(/^(Re:|Fwd:|FW:|RE:)\s*/gi, '').trim();
    const query = `subject:"${baseSubject}"`;
    const messages = await adapter.searchMessages(options.userId, query, { maxResults: 50, afterDate: options.sentAt });
    const userEmail = options.userEmail || await adapter.getUserEmail(options.userId);
    const domain = options.contactEmail.split('@')[1];
    const replies = [];
    for (const msg of messages) {
      if (userEmail && emailsMatchLoose(msg.from, userEmail)) continue;
      if (msg.isAutoReply) continue;
      const fromDomain = msg.from.split('@')[1];
      if (fromDomain === domain || emailsMatchLoose(msg.from, options.contactEmail)) replies.push({ gmailMessageId: msg.id, gmailThreadId: msg.threadId, subject: msg.subject, content: msg.content, receivedAt: msg.receivedAt, detectedAlias: msg.from !== options.contactEmail ? msg.from : undefined, provider: options.provider });
    }
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, gmailQuery: query, resultFound: replies.length > 0, matchReason: replies.length > 0 ? `Found ${replies.length} emails matching subject` : 'No matches', processingTimeMs: Date.now() - startTime });
    return { found: replies.length > 0, replies, searchMetadata: { layer, queriesRun: [query], pagesChecked: 1, messagesScanned: messages.length, notes: replies.length > 0 ? 'Found via subject search' : 'No matches' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
  } catch (error: any) {
    console.error(`[SubjectSearch] Error:`, error);
    return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${error?.message}` }, layerHealth: { layer, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message } };
  }
}
