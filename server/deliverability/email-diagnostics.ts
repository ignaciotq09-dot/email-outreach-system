/**
 * Email Deliverability Diagnostics
 * 
 * Checks email authentication (SPF, DKIM, DMARC) and bounce classification
 * to help users maintain good sender reputation.
 */

import { getUncachableGmailClient } from '../gmail';

interface DeliverabilityStatus {
  hasIssues: boolean;
  spfStatus: 'pass' | 'fail' | 'unknown';
  dkimStatus: 'pass' | 'fail' | 'unknown';
  dmarcStatus: 'pass' | 'fail' | 'unknown';
  warnings: string[];
  recommendations: string[];
}

interface BounceClassification {
  isBounce: boolean;
  bounceType: 'hard' | 'soft' | 'none';
  reason: string;
  shouldRetry: boolean;
}

/**
 * Check email authentication status by examining sent message headers
 */
export async function checkEmailAuthentication(): Promise<DeliverabilityStatus> {
  try {
    const gmail = await getUncachableGmailClient();
    
    // Get a recent sent message to check authentication headers
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['SENT'],
      maxResults: 1,
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) {
      return {
        hasIssues: true,
        spfStatus: 'unknown',
        dkimStatus: 'unknown',
        dmarcStatus: 'unknown',
        warnings: ['No sent emails found to check authentication'],
        recommendations: ['Send a test email to check your authentication setup'],
      };
    }

    // Get full message details
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messages[0].id!,
      format: 'full',
    });

    const headers = message.data.payload?.headers || [];
    
    // Look for authentication results headers
    const authResults = headers.find(
      h => h.name?.toLowerCase() === 'authentication-results'
    )?.value || '';

    const status: DeliverabilityStatus = {
      hasIssues: false,
      spfStatus: 'unknown',
      dkimStatus: 'unknown',
      dmarcStatus: 'unknown',
      warnings: [],
      recommendations: [],
    };

    // Parse SPF status
    if (authResults.includes('spf=pass')) {
      status.spfStatus = 'pass';
    } else if (authResults.includes('spf=fail')) {
      status.spfStatus = 'fail';
      status.hasIssues = true;
      status.warnings.push('SPF authentication is failing');
      status.recommendations.push(
        'Check your DNS SPF record to ensure Gmail is authorized to send on your behalf'
      );
    }

    // Parse DKIM status
    if (authResults.includes('dkim=pass')) {
      status.dkimStatus = 'pass';
    } else if (authResults.includes('dkim=fail')) {
      status.dkimStatus = 'fail';
      status.hasIssues = true;
      status.warnings.push('DKIM authentication is failing');
      status.recommendations.push(
        'DKIM is automatically handled by Gmail - this should not fail'
      );
    }

    // Parse DMARC status
    if (authResults.includes('dmarc=pass')) {
      status.dmarcStatus = 'pass';
    } else if (authResults.includes('dmarc=fail')) {
      status.dmarcStatus = 'fail';
      status.hasIssues = true;
      status.warnings.push('DMARC authentication is failing');
      status.recommendations.push(
        'Check your domain DMARC policy and ensure SPF/DKIM are passing'
      );
    }

    // General recommendations if everything is unknown
    if (
      status.spfStatus === 'unknown' &&
      status.dkimStatus === 'unknown' &&
      status.dmarcStatus === 'unknown'
    ) {
      status.recommendations.push(
        'Send a test email and check the received headers to verify authentication'
      );
    }

    return status;
  } catch (error) {
    console.error('[EmailDiagnostics] Error checking authentication:', error);
    return {
      hasIssues: true,
      spfStatus: 'unknown',
      dkimStatus: 'unknown',
      dmarcStatus: 'unknown',
      warnings: ['Could not check email authentication'],
      recommendations: ['Ensure Gmail connection is active'],
    };
  }
}

/**
 * Classify bounce messages to determine if we should retry
 */
export function classifyBounce(
  subject: string,
  content: string
): BounceClassification {
  const lowerSubject = subject.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Hard bounce indicators (permanent failure - don't retry)
  const hardBounceIndicators = [
    'user unknown',
    'recipient not found',
    'address rejected',
    'mailbox not found',
    'does not exist',
    'invalid recipient',
    'no such user',
    '550 5.1.1', // User unknown
    '550 5.7.1', // Delivery not authorized
    '554 5.7.1', // Relay access denied
  ];

  // Soft bounce indicators (temporary failure - can retry)
  const softBounceIndicators = [
    'mailbox full',
    'quota exceeded',
    'temporarily unavailable',
    'try again later',
    'service unavailable',
    'connection timed out',
    '450', // Mailbox temporarily unavailable
    '451', // Local error in processing
    '452', // Insufficient system storage
  ];

  // Check for hard bounces
  for (const indicator of hardBounceIndicators) {
    if (lowerSubject.includes(indicator) || lowerContent.includes(indicator)) {
      return {
        isBounce: true,
        bounceType: 'hard',
        reason: indicator,
        shouldRetry: false,
      };
    }
  }

  // Check for soft bounces
  for (const indicator of softBounceIndicators) {
    if (lowerSubject.includes(indicator) || lowerContent.includes(indicator)) {
      return {
        isBounce: true,
        bounceType: 'soft',
        reason: indicator,
        shouldRetry: true,
      };
    }
  }

  // Check for delivery failure subjects
  if (
    lowerSubject.includes('delivery status notification') ||
    lowerSubject.includes('undelivered mail returned') ||
    lowerSubject.includes('failure notice') ||
    lowerSubject.includes('delivery failed')
  ) {
    // It's a bounce, but we couldn't classify - treat as soft
    return {
      isBounce: true,
      bounceType: 'soft',
      reason: 'Unclassified delivery failure',
      shouldRetry: true,
    };
  }

  return {
    isBounce: false,
    bounceType: 'none',
    reason: '',
    shouldRetry: false,
  };
}

/**
 * Check for bounce messages in inbox and classify them
 */
export async function detectBounces(
  afterDate?: Date
): Promise<Array<{ messageId: string; classification: BounceClassification }>> {
  try {
    const gmail = await getUncachableGmailClient();

    // Search for delivery failure notifications
    let query = 'subject:(delivery status notification OR undelivered mail OR failure notice)';
    if (afterDate) {
      const year = afterDate.getFullYear();
      const month = String(afterDate.getMonth() + 1).padStart(2, '0');
      const day = String(afterDate.getDate()).padStart(2, '0');
      query += ` after:${year}/${month}/${day}`;
    }

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const bounces = [];

    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      });

      const headers = fullMessage.data.payload?.headers || [];
      const subject =
        headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';

      // Extract content (simplified)
      const snippet = fullMessage.data.snippet || '';

      const classification = classifyBounce(subject, snippet);
      if (classification.isBounce) {
        bounces.push({
          messageId: message.id!,
          classification,
        });
      }
    }

    return bounces;
  } catch (error) {
    console.error('[EmailDiagnostics] Error detecting bounces:', error);
    return [];
  }
}
