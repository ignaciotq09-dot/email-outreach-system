import { db } from "../../../db";
import { eq, and } from "drizzle-orm";
import { sentEmails, replies, appointmentRequests } from "@shared/schema";
import type { FollowUpJobWithContext } from '../types';

/**
 * Check if the follow-up sequence should be stopped.
 * CRITICAL: Always stop if we've received a reply from the contact.
 */
export async function checkShouldStopSequence(job: FollowUpJobWithContext): Promise<{ stop: boolean; reason: string }> {
  try {
    const [originalEmail] = await db.select().from(sentEmails).where(eq(sentEmails.id, job.originalEmailId));
    if (!originalEmail) return { stop: true, reason: 'Original email not found' };

    // Primary check: replyReceived flag on the sent email
    if (originalEmail.replyReceived) {
      return { stop: true, reason: 'Contact has replied' };
    }

    // Secondary check: Look for any reply records in the replies table
    // This catches cases where a reply was received but the flag wasn't set
    const existingReplies = await db.query.replies.findMany({
      where: eq(replies.sentEmailId, originalEmail.id),
      limit: 1,
    });

    if (existingReplies.length > 0) {
      console.log(`[FollowUpProcessor] Found reply record for email ${originalEmail.id}, stopping sequence`);
      // Also update the flag for consistency
      await db.update(sentEmails).set({ replyReceived: true }).where(eq(sentEmails.id, originalEmail.id));
      return { stop: true, reason: 'Reply detected in inbox' };
    }

    // Note: Could add contact-level reply tracking in the future
    // For now, we rely on the replyReceived flag and replies table
    // Check sequence-specific stop conditions
    if (job.sequenceId) {
      const [sequence] = await db.query.followUpSequences.findMany({
        where: (seq, { eq }) => eq(seq.id, job.sequenceId!),
      });

      if (sequence) {
        if (sequence.stopOnOpen && originalEmail.opened) {
          return { stop: true, reason: 'Contact opened email (stopOnOpen enabled)' };
        }
        if (sequence.stopOnClick && originalEmail.clicked) {
          return { stop: true, reason: 'Contact clicked link (stopOnClick enabled)' };
        }
        if (sequence.stopOnMeeting) {
          const emailReplies = await db.query.replies.findMany({
            where: eq(replies.sentEmailId, originalEmail.id),
          });
          for (const reply of emailReplies) {
            const appointments = await db.query.appointmentRequests.findMany({
              where: and(
                eq(appointmentRequests.replyId, reply.id),
                eq(appointmentRequests.status, 'accepted')
              ),
            });
            if (appointments.length > 0) {
              return { stop: true, reason: 'Meeting scheduled (stopOnMeeting enabled)' };
            }
          }
        }
      }
    }

    return { stop: false, reason: '' };
  } catch (error: any) {
    console.error('[FollowUpProcessor] Error checking stop conditions:', error?.message);
    // Default to NOT stopping on error - let the follow-up attempt proceed
    return { stop: false, reason: '' };
  }
}

