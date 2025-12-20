import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { followUps, sentEmails, replies, appointmentRequests } from "@shared/schema";
import type { ContactSequenceState } from "./types";

export function getDaysSince(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function selectVariant(steps: any[], stepNumber: number): any {
  const stepVariants = steps.filter((s: any) => s.stepNumber === stepNumber);
  
  if (stepVariants.length === 1) {
    return stepVariants[0];
  }

  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of stepVariants) {
    cumulative += variant.variantPercentage;
    if (random <= cumulative) {
      return variant;
    }
  }

  return stepVariants[0];
}

export async function shouldStopSequence(sequence: any, initialEmail: any): Promise<boolean> {
  if (sequence.stopOnReply && initialEmail.replyReceived) return true;
  if (sequence.stopOnOpen && initialEmail.opened) return true;
  if (sequence.stopOnClick && initialEmail.clicked) return true;

  if (sequence.stopOnMeeting) {
    const emailReplies = await db.query.replies.findMany({
      where: eq(replies.sentEmailId, initialEmail.id),
    });
    
    if (emailReplies.length > 0) {
      for (const reply of emailReplies) {
        const appointments = await db.query.appointmentRequests.findMany({
          where: and(eq(appointmentRequests.replyId, reply.id), eq(appointmentRequests.status, 'accepted')),
        });
        if (appointments.length > 0) return true;
      }
    }
  }

  return false;
}

export async function getContactSequenceState(campaignId: number, contactId: number, sequenceId: number, initialEmailId: number): Promise<ContactSequenceState | null> {
  const initialEmail = await db.query.sentEmails.findFirst({ where: eq(sentEmails.id, initialEmailId) });
  if (!initialEmail) return null;

  const followUpsList = await db.query.followUps.findMany({
    where: eq(followUps.originalEmailId, initialEmailId),
    orderBy: (followUps, { desc }) => [desc(followUps.sentAt)],
  });

  const currentStepNumber = followUpsList.length;
  const lastStepSentAt = followUpsList[0]?.sentAt || initialEmail.sentAt || new Date();

  return { campaignId, contactId, sequenceId, currentStepNumber, lastStepSentAt, initialEmailId };
}
