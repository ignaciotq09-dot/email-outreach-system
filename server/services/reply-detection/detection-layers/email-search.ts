import { getAdapter } from "../adapters";
import { logDetectionAttempt } from "../audit";
import type { ComprehensiveDetectionOptions, DetectionResult } from "../types";
import { emailsMatchLoose } from "./utils";

export async function runExactEmailSearch(options: ComprehensiveDetectionOptions): Promise<DetectionResult> {
  const startTime = Date.now();
  const layer = 'inbox_sweep_exact';
  try {
    const adapter = getAdapter(options.provider);
    const query = `from:${options.contactEmail}`;
    const messages = await adapter.searchMessages(options.userId, query, { maxResults: 50, afterDate: options.sentAt });
    const userEmail = options.userEmail || await adapter.getUserEmail(options.userId);
    const replies = [];
    for (const msg of messages) {
      if (userEmail && emailsMatchLoose(msg.from, userEmail)) continue;
      if (msg.isAutoReply) continue;
      if (emailsMatchLoose(msg.from, options.contactEmail)) {
        replies.push({ gmailMessageId: msg.id, gmailThreadId: msg.threadId, subject: msg.subject, content: msg.content, receivedAt: msg.receivedAt, provider: options.provider });
      }
    }
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, gmailQuery: query, resultFound: replies.length > 0, matchReason: replies.length > 0 ? `Found ${replies.length} emails from exact address` : 'No emails found', processingTimeMs: Date.now() - startTime });
    return { found: replies.length > 0, replies, searchMetadata: { layer, queriesRun: [query], pagesChecked: 1, messagesScanned: messages.length, notes: replies.length > 0 ? 'Found via exact email search' : 'No matches' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
  } catch (error: any) {
    console.error(`[ExactEmailSearch] Error:`, error);
    return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${error?.message}` }, layerHealth: { layer, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message } };
  }
}

export async function runDomainSearch(options: ComprehensiveDetectionOptions): Promise<DetectionResult> {
  const startTime = Date.now();
  const layer = 'inbox_sweep_domain';
  const domain = options.contactEmail.split('@')[1];
  if (!domain) return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: 'Invalid contact email' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date() } };
  try {
    const adapter = getAdapter(options.provider);
    const query = `from:@${domain}`;
    const messages = await adapter.searchMessages(options.userId, query, { maxResults: 100, afterDate: options.sentAt });
    const userEmail = options.userEmail || await adapter.getUserEmail(options.userId);
    const replies = [];
    for (const msg of messages) {
      if (userEmail && emailsMatchLoose(msg.from, userEmail)) continue;
      if (msg.isAutoReply) continue;
      if (msg.from.includes(`@${domain}`)) {
        let isRelevant = true;
        if (options.subject) { const baseSubject = msg.subject.replace(/^(Re:|Fwd:|FW:|RE:)\s*/gi, '').trim().toLowerCase(); const ourSubject = options.subject.replace(/^(Re:|Fwd:|FW:|RE:)\s*/gi, '').trim().toLowerCase(); isRelevant = baseSubject.includes(ourSubject) || ourSubject.includes(baseSubject); }
        if (isRelevant) replies.push({ gmailMessageId: msg.id, gmailThreadId: msg.threadId, subject: msg.subject, content: msg.content, receivedAt: msg.receivedAt, detectedAlias: msg.from, provider: options.provider });
      }
    }
    await logDetectionAttempt({ sentEmailId: options.sentEmailId, contactId: options.contactId, detectionLayer: layer, gmailQuery: query, resultFound: replies.length > 0, matchReason: replies.length > 0 ? `Found ${replies.length} emails from domain ${domain}` : 'No emails found', processingTimeMs: Date.now() - startTime });
    return { found: replies.length > 0, replies, searchMetadata: { layer, queriesRun: [query], pagesChecked: 1, messagesScanned: messages.length, notes: replies.length > 0 ? `Found via domain search @${domain}` : 'No matches' }, layerHealth: { layer, healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime } };
  } catch (error: any) {
    console.error(`[DomainSearch] Error:`, error);
    return { found: false, replies: [], searchMetadata: { layer, queriesRun: [], pagesChecked: 0, messagesScanned: 0, notes: `Error: ${error?.message}` }, layerHealth: { layer, healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message } };
  }
}
