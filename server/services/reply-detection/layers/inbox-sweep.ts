/**
 * Layer 3: Comprehensive Inbox Sweep
 * Searches entire inbox with multiple strategies
 */

import { getUncachableGmailClient, getGmailUserEmail } from "../../../gmail";
import { logDetectionAttempt } from "../audit";
import { withRetry } from "../retry";
import { extractEmailFromString, emailsMatchLoose, extractMessageContent, isAutoReply } from "../utils";
import { getContactAliases } from "../alias";
import type { DetectionResult, ComprehensiveDetectionOptions, DetectionLayer } from "../types";

export async function comprehensiveInboxSweep(
  options: ComprehensiveDetectionOptions
): Promise<DetectionResult> {
  const { sentEmailId, contactId, contactEmail, contactName, companyName, subject, sentAt } = options;
  
  // Get all known aliases for this contact
  const knownAliases = await getContactAliases(contactId);
  const allEmails = [contactEmail, ...knownAliases];
  
  // Build multiple search queries with different strategies
  const searchStrategies: { query: string; layer: DetectionLayer; confidence: number }[] = [];
  
  // Strategy 1: Exact email matches (including aliases)
  for (const email of allEmails) {
    searchStrategies.push({
      query: `from:${email} after:${Math.floor(sentAt.getTime() / 1000)}`,
      layer: 'inbox_sweep_exact',
      confidence: 95,
    });
  }
  
  // Strategy 2: Domain-based search (same company)
  const domain = contactEmail.split('@')[1];
  if (domain) {
    searchStrategies.push({
      query: `from:@${domain} after:${Math.floor(sentAt.getTime() / 1000)}`,
      layer: 'inbox_sweep_domain',
      confidence: 75,
    });
  }
  
  // Strategy 3: Name + Company search
  if (contactName) {
    const nameParts = contactName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    if (companyName) {
      searchStrategies.push({
        query: `from:"${firstName}" from:"${lastName}" from:"${companyName}" after:${Math.floor(sentAt.getTime() / 1000)}`,
        layer: 'inbox_sweep_name',
        confidence: 70,
      });
    }
    
    // Just name search
    searchStrategies.push({
      query: `from:"${contactName}" after:${Math.floor(sentAt.getTime() / 1000)}`,
      layer: 'inbox_sweep_name',
      confidence: 65,
    });
  }
  
  // Execute searches in parallel
  console.log(`[InboxSweep] Running ${searchStrategies.length} search strategies`);
  
  const gmail = await getUncachableGmailClient();
  const ourEmail = await getGmailUserEmail();
  
  for (const strategy of searchStrategies) {
    const startTime = Date.now();
    
    try {
      console.log(`[InboxSweep] Trying ${strategy.layer}: ${strategy.query}`);
      
      // Search with pagination (up to 10 pages to check ALL messages)
      let nextPageToken: string | undefined = undefined;
      const maxPages = 10;
      
      for (let page = 0; page < maxPages; page++) {
        const response = await withRetry(
          () => gmail.users.messages.list({
            userId: 'me',
            q: strategy.query,
            maxResults: 100,
            pageToken: nextPageToken,
          }),
          `Inbox sweep page ${page + 1}: ${strategy.query}`,
          { maxRetries: 3, initialDelay: 500 }
        );

        if (!response) break;
        
        const messages = response.data.messages || [];
        
        for (const msg of messages) {
          const fullMessage = await withRetry(
            () => gmail.users.messages.get({
              userId: 'me',
              id: msg.id!,
              format: 'full',
            }),
            `Get message ${msg.id}`,
            { maxRetries: 2, initialDelay: 300 }
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
          
          // Skip if from ourselves
          if (ourEmail && emailsMatchLoose(fromEmail, ourEmail)) continue;
          
          // Additional validation based on strategy
          let isValid = true;
          
          if (strategy.layer === 'inbox_sweep_exact') {
            // Must match one of our known emails exactly
            isValid = allEmails.some(e => emailsMatchLoose(fromEmail, e));
          } else if (strategy.layer === 'inbox_sweep_domain') {
            // Must be from the same domain
            isValid = fromEmail.includes(`@${domain}`);
          } else if (strategy.layer === 'inbox_sweep_name') {
            // Already filtered by Gmail query
            isValid = true;
          }
          
          // Check subject correlation if provided
          if (isValid && subject) {
            const msgSubject = headersMap['Subject'] || '';
            const baseSubject = msgSubject.replace(/^(Re:|Fwd:|FW:|RE:)\s*/gi, '').trim();
            const ourSubject = subject.replace(/^(Re:|Fwd:|FW:|RE:)\s*/gi, '').trim();
            
            if (baseSubject.toLowerCase().includes(ourSubject.toLowerCase()) ||
                ourSubject.toLowerCase().includes(baseSubject.toLowerCase())) {
              // Subject matches - boost confidence
              strategy.confidence = Math.min(100, strategy.confidence + 10);
            }
          }
          
          if (isValid) {
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
                detectedAlias: fromEmail !== contactEmail ? fromEmail : undefined
              }],
              searchMetadata: {
                layer: strategy.layer,
                queriesRun: [strategy.query],
                pagesChecked: page + 1,
                messagesScanned: messagesScanned,
                notes: `Found via ${strategy.layer} search`
              }
            };
            
            console.log(`[InboxSweep] ✓ Found reply via ${strategy.layer}`);
            
            await logDetectionAttempt({
              sentEmailId,
              contactId,
              detectionLayer: strategy.layer,
              gmailQuery: strategy.query,
              resultFound: true,
              gmailMessageId: msg.id,
              gmailThreadId: fullMessage.data.threadId,
              senderEmail: fromEmail,
              matchReason: `Found via ${strategy.layer} search`,
              processingTimeMs: Date.now() - startTime,
              metadata: { page: page + 1, confidence: strategy.confidence },
            });
            
            return result;
          }
        }
        
        // Check if there are more pages
        nextPageToken = response.data.nextPageToken || undefined;
        if (!nextPageToken) break;
        
        console.log(`[InboxSweep] Checking page ${page + 2}...`);
      }
      
      await logDetectionAttempt({
        sentEmailId,
        contactId,
        detectionLayer: strategy.layer,
        gmailQuery: strategy.query,
        resultFound: false,
        matchReason: 'No matching replies found',
        processingTimeMs: Date.now() - startTime,
      });
      
    } catch (error: any) {
      console.error(`[InboxSweep] Error with ${strategy.layer}:`, error);
      
      await logDetectionAttempt({
        sentEmailId,
        contactId,
        detectionLayer: strategy.layer,
        gmailQuery: strategy.query,
        resultFound: false,
        errorMessage: error?.message || 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      });
    }
  }
  
  console.log('[InboxSweep] No replies found after checking all strategies');
  return { 
    found: false,
    replies: [],
    searchMetadata: {
      layer: 'inbox-sweep',
      queriesRun: strategies.map(s => s.query),
      pagesChecked: 0,
      messagesScanned: 0,
      notes: 'No replies found after checking all strategies'
    }
  };
}