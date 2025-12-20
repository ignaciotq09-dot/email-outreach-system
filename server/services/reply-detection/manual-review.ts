/**
 * Manual Review Queue for Reply Detection v1.0
 * 
 * Handles uncertain detections (low confidence, layer disagreement)
 * with a simple Accept/Reject workflow.
 */

import { db } from "../../db";
import { sentEmails, replies, contacts } from "../../../shared/schemas";
import { eq, and, desc, isNull, gte } from "drizzle-orm";
import { logDetectionAttempt } from "./audit";
import type { EmailProvider } from "./types";

// Review item status
export type ReviewStatus = 'pending' | 'accepted' | 'rejected' | 'auto_resolved';

// Review item
export interface ReviewItem {
  id: string;
  sentEmailId: number;
  contactId: number;
  contactEmail: string;
  contactName: string | null;
  subject: string;
  sentAt: Date;
  reason: string;
  layersChecked: number;
  healthyLayers: number;
  foundLayers: string[];
  failedLayers: string[];
  potentialReply?: {
    messageId: string;
    content: string;
    receivedAt: Date;
    from: string;
  };
  createdAt: Date;
  status: ReviewStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

// In-memory review queue (would be persisted to DB in production)
const reviewQueue: Map<string, ReviewItem> = new Map();

/**
 * Generate unique review ID
 */
function generateReviewId(): string {
  return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add an item to the manual review queue
 */
export function addToReviewQueue(item: Omit<ReviewItem, 'id' | 'createdAt' | 'status'>): string {
  const id = generateReviewId();
  
  const reviewItem: ReviewItem = {
    ...item,
    id,
    createdAt: new Date(),
    status: 'pending',
  };
  
  reviewQueue.set(id, reviewItem);
  console.log(`[ManualReview] Added item ${id} to review queue for sent_email ${item.sentEmailId}`);
  
  return id;
}

/**
 * Get all pending review items
 */
export function getPendingReviews(): ReviewItem[] {
  return Array.from(reviewQueue.values())
    .filter(item => item.status === 'pending')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get review item by ID
 */
export function getReviewItem(id: string): ReviewItem | undefined {
  return reviewQueue.get(id);
}

/**
 * Accept a review item (mark as valid reply)
 */
export async function acceptReview(
  id: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const item = reviewQueue.get(id);
  
  if (!item) {
    console.error(`[ManualReview] Review item ${id} not found`);
    return false;
  }
  
  if (item.status !== 'pending') {
    console.error(`[ManualReview] Review item ${id} already ${item.status}`);
    return false;
  }
  
  try {
    // If there's a potential reply, save it
    if (item.potentialReply) {
      // Check if reply already exists
      const existingReply = await db
        .select()
        .from(replies)
        .where(eq(replies.gmailMessageId, item.potentialReply.messageId))
        .limit(1);
      
      if (existingReply.length === 0) {
        // Save the reply
        await db.insert(replies).values({
          sentEmailId: item.sentEmailId,
          replyReceivedAt: item.potentialReply.receivedAt,
          replyContent: item.potentialReply.content,
          gmailMessageId: item.potentialReply.messageId,
        });
        
        // Update sent email status
        await db
          .update(sentEmails)
          .set({ replyReceived: true })
          .where(eq(sentEmails.id, item.sentEmailId));
      }
    }
    
    // Update review item
    item.status = 'accepted';
    item.reviewedAt = new Date();
    item.reviewedBy = reviewedBy;
    item.notes = notes;
    
    // Log the decision
    await logDetectionAttempt({
      sentEmailId: item.sentEmailId,
      contactId: item.contactId,
      detectionLayer: 'manual_review',
      resultFound: true,
      matchReason: `Manually accepted by ${reviewedBy}${notes ? `: ${notes}` : ''}`,
      processingTimeMs: 0,
    });
    
    console.log(`[ManualReview] Accepted review ${id} by ${reviewedBy}`);
    return true;
    
  } catch (error) {
    console.error(`[ManualReview] Error accepting review ${id}:`, error);
    return false;
  }
}

/**
 * Reject a review item (mark as not a valid reply)
 */
export async function rejectReview(
  id: string,
  reviewedBy: string,
  notes?: string
): Promise<boolean> {
  const item = reviewQueue.get(id);
  
  if (!item) {
    console.error(`[ManualReview] Review item ${id} not found`);
    return false;
  }
  
  if (item.status !== 'pending') {
    console.error(`[ManualReview] Review item ${id} already ${item.status}`);
    return false;
  }
  
  try {
    // Update review item
    item.status = 'rejected';
    item.reviewedAt = new Date();
    item.reviewedBy = reviewedBy;
    item.notes = notes;
    
    // Log the decision
    await logDetectionAttempt({
      sentEmailId: item.sentEmailId,
      contactId: item.contactId,
      detectionLayer: 'manual_review',
      resultFound: false,
      matchReason: `Manually rejected by ${reviewedBy}${notes ? `: ${notes}` : ''}`,
      processingTimeMs: 0,
    });
    
    console.log(`[ManualReview] Rejected review ${id} by ${reviewedBy}`);
    return true;
    
  } catch (error) {
    console.error(`[ManualReview] Error rejecting review ${id}:`, error);
    return false;
  }
}

/**
 * Auto-resolve review items when a reply is detected through normal channels
 */
export async function autoResolveReviews(sentEmailId: number): Promise<void> {
  for (const [id, item] of reviewQueue.entries()) {
    if (item.sentEmailId === sentEmailId && item.status === 'pending') {
      item.status = 'auto_resolved';
      item.reviewedAt = new Date();
      item.reviewedBy = 'system';
      item.notes = 'Auto-resolved: Reply detected through normal detection';
      
      console.log(`[ManualReview] Auto-resolved review ${id} for sent_email ${sentEmailId}`);
    }
  }
}

/**
 * Get review statistics
 */
export function getReviewStats(): {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  autoResolved: number;
} {
  let pending = 0, accepted = 0, rejected = 0, autoResolved = 0;
  
  for (const item of reviewQueue.values()) {
    switch (item.status) {
      case 'pending': pending++; break;
      case 'accepted': accepted++; break;
      case 'rejected': rejected++; break;
      case 'auto_resolved': autoResolved++; break;
    }
  }
  
  return {
    total: reviewQueue.size,
    pending,
    accepted,
    rejected,
    autoResolved,
  };
}

/**
 * Clear old resolved reviews (keep for audit)
 */
export function clearOldReviews(olderThanDays: number = 30): number {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  let cleared = 0;
  
  for (const [id, item] of reviewQueue.entries()) {
    if (item.status !== 'pending' && item.createdAt < cutoff) {
      reviewQueue.delete(id);
      cleared++;
    }
  }
  
  console.log(`[ManualReview] Cleared ${cleared} old reviews`);
  return cleared;
}

/**
 * Export review queue for backup/migration
 */
export function exportReviewQueue(): ReviewItem[] {
  return Array.from(reviewQueue.values());
}

/**
 * Import review queue from backup
 */
export function importReviewQueue(items: ReviewItem[]): void {
  for (const item of items) {
    reviewQueue.set(item.id, item);
  }
  console.log(`[ManualReview] Imported ${items.length} review items`);
}
