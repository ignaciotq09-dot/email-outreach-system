/**
 * Audit logging for reply detection attempts
 */

import { db } from "../../db";
import { replyDetectionAudit, type InsertReplyDetectionAudit } from "../../../shared/schemas";

/**
 * Log a detection attempt to the audit table for debugging and analysis
 */
export async function logDetectionAttempt(
  attempt: Partial<InsertReplyDetectionAudit>
): Promise<void> {
  try {
    // Build complete payload with defaults for required fields
    const payload: InsertReplyDetectionAudit = {
      detectionLayer: attempt.detectionLayer || 'unknown',
      sentEmailId: attempt.sentEmailId || null,
      contactId: attempt.contactId || null,
      gmailQuery: attempt.gmailQuery || null,
      resultFound: attempt.resultFound ?? false,
      gmailMessageId: attempt.gmailMessageId || null,
      gmailThreadId: attempt.gmailThreadId || null,
      senderEmail: attempt.senderEmail || null,
      matchReason: attempt.matchReason || null,
      headers: attempt.headers || null,
      errorMessage: attempt.errorMessage || null,
      processingTimeMs: attempt.processingTimeMs || null,
      metadata: attempt.metadata || null,
    };
    
    await db.insert(replyDetectionAudit).values([payload]);
  } catch (error) {
    console.error('[AuditLog] Failed to log detection attempt:', error);
  }
}