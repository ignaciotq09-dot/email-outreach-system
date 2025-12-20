/**
 * Layer 2: Message-ID Search
 * Searches for replies using RFC822 message IDs and References headers
 */

import { getUncachableGmailClient } from "../../../gmail";
import { logDetectionAttempt } from "../audit";
import { withRetry } from "../retry";
import { extractEmailFromString, extractMessageContent, isAutoReply } from "../utils";
import type { DetectionResult } from "../types";

export async function messageIdSearch(
  gmailMessageId: string,
  sentEmailId?: number,
  contactId?: number
): Promise<DetectionResult> {
  const startTime = Date.now();

  try {
    const gmail = await getUncachableGmailClient();
    
    // Search for messages that reference our message ID
    const query = `rfc822msgid:${gmailMessageId} OR "In-Reply-To:${gmailMessageId}" OR "References:${gmailMessageId}"`;
    console.log(`[MessageIDSearch] Searching with query: ${query}`);

    const response = await withRetry(
      () => gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      }),
      `Message ID search: ${query}`,
      { maxRetries: 3, initialDelay: 500 }
    );

    if (!response) {
      console.log(`[MessageIDSearch] Failed to search messages after retries`);
      return { 
        found: false,
        replies: [],
        searchMetadata: {
          layer: 'message-id',
          queriesRun: [query],
          pagesChecked: 0,
          messagesScanned: 0,
          notes: 'Failed to search messages after retries'
        }
      };
    }

    const messages = response.data.messages || [];
    
    if (messages.length > 1) { // More than just our original message
      // Get details of potential replies
      for (const msg of messages) {
        if (msg.id === gmailMessageId) continue; // Skip original
        
        const fullMessage = await withRetry(
          () => gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          }),
          `Get message ${msg.id}`,
          { maxRetries: 3, initialDelay: 500 }
        );

        if (!fullMessage) continue;

        const headers = fullMessage.data.payload?.headers || [];
        const headersMap: Record<string, string> = {};
        headers.forEach(h => {
          if (h.name && h.value) headersMap[h.name] = h.value;
        });

        // Skip auto-replies
        if (isAutoReply(headers)) continue;

        const fromEmail = extractEmailFromString(headersMap['From'] || '');
        const content = extractMessageContent(fullMessage.data.payload || {});

        const messageDate = headersMap['Date'] ? new Date(headersMap['Date']) : new Date();
        
        // Build normalized format with only the required fields
        const result: DetectionResult = {
          found: true,
          replies: [{
            gmailMessageId: msg.id || '',
            gmailThreadId: fullMessage.data.threadId,
            subject: headersMap['Subject'] || '',
            content,
            receivedAt: messageDate,
          }],
          searchMetadata: {
            layer: 'message-id',
            queriesRun: [query],
            pagesChecked: 1,
            messagesScanned: messages.length,
            notes: 'Found via message ID reference'
          }
        };

        console.log(`[MessageIDSearch] ✓ Found reply via message ID reference`);

        await logDetectionAttempt({
          sentEmailId,
          contactId,
          detectionLayer: 'message_id',
          gmailQuery: query,
          resultFound: true,
          gmailMessageId: msg.id,
          gmailThreadId: fullMessage.data.threadId,
          senderEmail: fromEmail,
          matchReason: 'Message references our message ID in headers',
          processingTimeMs: Date.now() - startTime,
        });

        return result;
      }
    }

    await logDetectionAttempt({
      sentEmailId,
      contactId,
      detectionLayer: 'message_id',
      gmailQuery: query,
      resultFound: false,
      matchReason: 'No messages found referencing our message ID',
      processingTimeMs: Date.now() - startTime,
    });

    return { 
      found: false,
      replies: [],
      searchMetadata: {
        layer: 'message-id',
        queriesRun: [query],
        pagesChecked: 0,
        messagesScanned: messages.length,
        notes: 'No messages found referencing our message ID'
      }
    };

  } catch (error: any) {
    console.error('[MessageIDSearch] Error:', error);
    
    await logDetectionAttempt({
      sentEmailId,
      contactId,
      detectionLayer: 'message_id',
      resultFound: false,
      errorMessage: error?.message || 'Unknown error',
      processingTimeMs: Date.now() - startTime,
    });

    return { 
      found: false,
      replies: [],
      searchMetadata: {
        layer: 'message-id',
        queriesRun: [],
        pagesChecked: 0,
        messagesScanned: 0,
        notes: `Error: ${error?.message || 'Unknown error'}`
      }
    };
  }
}