/**
 * Layer 1: Enhanced Thread Detection
 * Checks thread with CC/BCC tolerance and header validation
 */

import { getUncachableGmailClient, getGmailUserEmail } from "../../../gmail";
import { logDetectionAttempt } from "../audit";
import { withRetry } from "../retry";
import { extractEmailFromString, emailsMatchLoose, extractMessageContent, isAutoReply } from "../utils";
import type { DetectionResult, EnhancedThreadCheckOptions } from "../types";

export async function enhancedThreadDetection(
  options: EnhancedThreadCheckOptions
): Promise<DetectionResult> {
  const startTime = Date.now();
  const { threadId, originalMessageId, sentAt, recipientEmail, sentEmailId, contactId, checkCcBcc = true } = options;

  try {
    const gmail = await getUncachableGmailClient();
    const ourEmail = await getGmailUserEmail();
    
    console.log(`[EnhancedThread] Checking thread ${threadId} for replies from ${recipientEmail}`);
    
    // Fetch thread with full details using retry logic
    const thread = await withRetry(
      () => gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      }),
      `Thread fetch for ${threadId}`,
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!thread) {
      console.log(`[EnhancedThread] Failed to fetch thread ${threadId} after retries`);
      return { 
        found: false,
        replies: [],
        searchMetadata: {
          layer: 'enhanced-thread',
          queriesRun: [`threads.get(${threadId})`],
          pagesChecked: 0,
          messagesScanned: 0,
          notes: 'Failed to fetch thread after retries'
        }
      };
    }

    const messages = thread.data.messages || [];
    let bestReply: DetectionResult | null = null;
    let replySenderEmail: string | undefined;  // Track sender email for logging

    for (const message of messages) {
      // Skip original message
      if (message.id === originalMessageId) continue;

      const headers = message.payload?.headers || [];
      const headersMap: Record<string, string> = {};
      headers.forEach(h => {
        if (h.name && h.value) headersMap[h.name] = h.value;
      });

      // Get message date
      const messageDate = headersMap['Date'] ? new Date(headersMap['Date']) : null;
      if (messageDate && messageDate < sentAt) continue;

      // Skip auto-replies
      if (isAutoReply(headers)) continue;

      // Check sender (From, Reply-To, Return-Path)
      const fromEmail = extractEmailFromString(headersMap['From'] || '');
      const replyToEmail = extractEmailFromString(headersMap['Reply-To'] || '');
      const returnPathEmail = extractEmailFromString(headersMap['Return-Path'] || '');
      
      // Skip if from ourselves
      if (ourEmail && (
        emailsMatchLoose(fromEmail, ourEmail) ||
        emailsMatchLoose(replyToEmail, ourEmail) ||
        emailsMatchLoose(returnPathEmail, ourEmail)
      )) continue;

      // Check if sender matches recipient (with alias tolerance)
      let isMatch = false;
      let matchReason = '';

      if (emailsMatchLoose(fromEmail, recipientEmail)) {
        isMatch = true;
        matchReason = 'From header matches recipient';
      } else if (replyToEmail && emailsMatchLoose(replyToEmail, recipientEmail)) {
        isMatch = true;
        matchReason = 'Reply-To header matches recipient';
      } else if (checkCcBcc) {
        // Check CC/BCC for the recipient
        const ccEmails = (headersMap['Cc'] || '').split(',').map(e => extractEmailFromString(e.trim()));
        const bccEmails = (headersMap['Bcc'] || '').split(',').map(e => extractEmailFromString(e.trim()));
        
        if (ccEmails.some(e => emailsMatchLoose(e, recipientEmail))) {
          isMatch = true;
          matchReason = 'Recipient found in CC';
        } else if (bccEmails.some(e => emailsMatchLoose(e, recipientEmail))) {
          isMatch = true;
          matchReason = 'Recipient found in BCC';
        }
      }

      // Enhanced: Check In-Reply-To and References headers
      const inReplyTo = headersMap['In-Reply-To'];
      const references = headersMap['References'];
      
      if (!isMatch && (inReplyTo || references)) {
        // This message references our thread, likely a reply
        console.log(`[EnhancedThread] Found In-Reply-To: ${inReplyTo}, References: ${references}`);
        if (inReplyTo && inReplyTo.includes(originalMessageId)) {
          isMatch = true;
          matchReason = 'In-Reply-To header references our message';
        } else if (references && references.includes(originalMessageId)) {
          isMatch = true;
          matchReason = 'References header includes our message';
        }
      }

      if (isMatch) {
        const content = extractMessageContent(message.payload || {});
        replySenderEmail = fromEmail;  // Store for logging
        
        // Build normalized format with only the required fields
        bestReply = {
          found: true,
          replies: [{
            gmailMessageId: message.id || '',
            gmailThreadId: threadId,
            subject: headersMap['Subject'] || '',
            content,
            receivedAt: messageDate || new Date(),
            detectedAlias: fromEmail !== recipientEmail ? fromEmail : undefined
          }],
          searchMetadata: {
            layer: 'enhanced-thread',
            queriesRun: [`threads.get(${threadId})`],
            pagesChecked: 1,
            messagesScanned: messages.length,
            notes: matchReason
          }
        };
        
        console.log(`[EnhancedThread] ✓ Found reply: ${matchReason}`);
        break; // Take first matching reply
      }
    }

    // Log attempt
    await logDetectionAttempt({
      sentEmailId,
      contactId,
      detectionLayer: 'enhanced_thread',
      gmailQuery: `thread:${threadId}`,
      resultFound: bestReply?.found || false,
      gmailMessageId: bestReply?.replies?.[0]?.gmailMessageId,
      gmailThreadId: threadId,
      senderEmail: replySenderEmail,  // Use the tracked sender email
      matchReason: bestReply?.searchMetadata?.notes || 'No reply found in thread',
      processingTimeMs: Date.now() - startTime,
    });

    return bestReply || { 
      found: false,
      replies: [],
      searchMetadata: {
        layer: 'enhanced-thread',
        queriesRun: [`threads.get(${threadId})`],
        pagesChecked: 1,
        messagesScanned: messages.length,
        notes: 'No reply found in thread'
      }
    };

  } catch (error: any) {
    console.error('[EnhancedThread] Error:', error);
    
    await logDetectionAttempt({
      sentEmailId,
      contactId,
      detectionLayer: 'enhanced_thread',
      gmailQuery: `thread:${threadId}`,
      resultFound: false,
      errorMessage: error?.message || 'Unknown error',
      processingTimeMs: Date.now() - startTime,
    });

    return {
      found: false,
      replies: [],
      searchMetadata: {
        layer: 'enhanced-thread',
        queriesRun: [`threads.get(${threadId})`],
        pagesChecked: 0,
        messagesScanned: 0,
        notes: `Error: ${error?.message || 'Unknown error'}`
      }
    };
  }
}