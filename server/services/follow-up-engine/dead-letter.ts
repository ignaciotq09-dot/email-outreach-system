import { db } from "../../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { followUpDeadLetter, followUpJobs, contacts, sentEmails } from "@shared/schema";
import { createJob } from "./job-queue";
import type { DeadLetterReviewAction } from "./types";

export async function getPendingDeadLetters(limit: number = 50) {
  const items = await db
    .select({
      deadLetter: followUpDeadLetter,
      contact: {
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        company: contacts.company,
      },
      originalEmail: {
        id: sentEmails.id,
        subject: sentEmails.subject,
      },
    })
    .from(followUpDeadLetter)
    .innerJoin(contacts, eq(followUpDeadLetter.contactId, contacts.id))
    .innerJoin(sentEmails, eq(followUpDeadLetter.originalEmailId, sentEmails.id))
    .where(eq(followUpDeadLetter.reviewStatus, 'pending'))
    .orderBy(desc(followUpDeadLetter.createdAt))
    .limit(limit);
  
  return items.map(row => ({
    ...row.deadLetter,
    contact: row.contact,
    originalEmail: row.originalEmail,
  }));
}

export async function getDeadLetterById(id: number) {
  const [row] = await db
    .select({
      deadLetter: followUpDeadLetter,
      contact: {
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        company: contacts.company,
      },
      originalEmail: {
        id: sentEmails.id,
        subject: sentEmails.subject,
        gmailThreadId: sentEmails.gmailThreadId,
      },
      job: followUpJobs,
    })
    .from(followUpDeadLetter)
    .innerJoin(contacts, eq(followUpDeadLetter.contactId, contacts.id))
    .innerJoin(sentEmails, eq(followUpDeadLetter.originalEmailId, sentEmails.id))
    .innerJoin(followUpJobs, eq(followUpDeadLetter.jobId, followUpJobs.id))
    .where(eq(followUpDeadLetter.id, id));
  
  if (!row) return null;
  
  return {
    ...row.deadLetter,
    contact: row.contact,
    originalEmail: row.originalEmail,
    job: row.job,
  };
}

export async function reviewDeadLetter(
  id: number,
  action: DeadLetterReviewAction,
  reviewedBy: string
): Promise<{ success: boolean; newJobId?: number; error?: string }> {
  const deadLetter = await getDeadLetterById(id);
  
  if (!deadLetter) {
    return { success: false, error: 'Dead letter not found' };
  }
  
  if (deadLetter.reviewStatus !== 'pending') {
    return { success: false, error: 'Dead letter already reviewed' };
  }
  
  let newJobId: number | undefined;
  
  if (action.action === 'retry') {
    try {
      const context = deadLetter.fullContext as any;
      
      newJobId = await createJob({
        campaignId: context?.campaignId,
        contactId: deadLetter.contactId,
        originalEmailId: deadLetter.originalEmailId,
        sequenceId: context?.sequenceId,
        stepNumber: context?.stepNumber || 1,
        scheduledFor: new Date(),
        subject: context?.subject,
        body: context?.body,
        metadata: {
          userId: (deadLetter.job as any)?.metadata?.userId,
          source: 'dead_letter_retry',
          originalDeadLetterId: id,
        },
      });
      
      await db.update(followUpDeadLetter)
        .set({
          reviewStatus: 'retried',
          reviewedAt: new Date(),
          reviewedBy,
          reviewAction: 'retry',
          reviewNotes: action.notes,
          retriedJobId: newJobId,
          updatedAt: new Date(),
        })
        .where(eq(followUpDeadLetter.id, id));
      
      console.log(`[DeadLetter] Item ${id} retried as job ${newJobId}`);
      
    } catch (error: any) {
      return { success: false, error: error?.message || 'Failed to create retry job' };
    }
    
  } else if (action.action === 'skip' || action.action === 'cancel') {
    await db.update(followUpDeadLetter)
      .set({
        reviewStatus: action.action === 'skip' ? 'skipped' : 'cancelled',
        reviewedAt: new Date(),
        reviewedBy,
        reviewAction: action.action,
        reviewNotes: action.notes,
        updatedAt: new Date(),
      })
      .where(eq(followUpDeadLetter.id, id));
    
    console.log(`[DeadLetter] Item ${id} ${action.action}ped`);
    
  } else if (action.action === 'manual_send') {
    await db.update(followUpDeadLetter)
      .set({
        reviewStatus: 'manual_send',
        reviewedAt: new Date(),
        reviewedBy,
        reviewAction: 'manual_send',
        reviewNotes: action.notes,
        updatedAt: new Date(),
      })
      .where(eq(followUpDeadLetter.id, id));
    
    console.log(`[DeadLetter] Item ${id} marked for manual send`);
  }
  
  return { success: true, newJobId };
}

export async function getDeadLetterStats() {
  const [stats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${followUpDeadLetter.reviewStatus} = 'pending')`,
      retried: sql<number>`COUNT(*) FILTER (WHERE ${followUpDeadLetter.reviewStatus} = 'retried')`,
      skipped: sql<number>`COUNT(*) FILTER (WHERE ${followUpDeadLetter.reviewStatus} = 'skipped')`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${followUpDeadLetter.reviewStatus} = 'cancelled')`,
      manualSend: sql<number>`COUNT(*) FILTER (WHERE ${followUpDeadLetter.reviewStatus} = 'manual_send')`,
    })
    .from(followUpDeadLetter);
  
  return {
    total: Number(stats?.total || 0),
    pending: Number(stats?.pending || 0),
    retried: Number(stats?.retried || 0),
    skipped: Number(stats?.skipped || 0),
    cancelled: Number(stats?.cancelled || 0),
    manualSend: Number(stats?.manualSend || 0),
  };
}
