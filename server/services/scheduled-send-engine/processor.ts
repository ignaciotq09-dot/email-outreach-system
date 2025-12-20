import { db } from "../../db";
import { sentEmails, contacts } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { ScheduledSendWithContext, ProcessResult } from "./types";
import { markProcessing, markSent, markFailed } from "./job-queue";
import { getUniqueVariationForContact, recordVariationUsage } from "../spintax-generator";
import { recordSendTimeEvent } from "../send-time-optimizer";

export async function processScheduledSend(
  send: ScheduledSendWithContext,
  sendEmailFn: (params: {
    userId: number;
    contactId: number;
    to: string;
    subject: string;
    body: string;
  }) => Promise<{ messageId: string; threadId: string }>
): Promise<ProcessResult> {
  const startTime = Date.now();
  console.log(`[ScheduledSendProcessor] Processing send ${send.id} for ${send.contact.email}`);

  try {
    await markProcessing(send.id);

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, send.contactId))
      .limit(1);

    if (!contact) {
      throw new Error(`Contact ${send.contactId} not found`);
    }

    let finalSubject = send.subject;
    let finalBody = send.body;
    let appliedVariation: { subject: string; body: string; variationHash: string; variationIndex: number } | null = null;

    const metadata = send.metadata as any;
    if (metadata?.enableSpintax) {
      try {
        const variation = await getUniqueVariationForContact({
          userId: send.userId,
          campaignId: send.campaignId || undefined,
          contactId: send.contactId,
          contact,
          originalSubject: send.subject,
          originalBody: send.body,
        });

        finalSubject = variation.subject;
        finalBody = variation.body;
        appliedVariation = variation;

        console.log(`[ScheduledSendProcessor] Applied spintax variation for send ${send.id}, hash: ${variation.variationHash}`);
      } catch (spintaxError: any) {
        console.warn(`[ScheduledSendProcessor] Spintax failed, using original: ${spintaxError.message}`);
      }
    }

    const result = await sendEmailFn({
      userId: send.userId,
      contactId: send.contactId,
      to: send.contact.email,
      subject: finalSubject,
      body: finalBody,
    });

    const [sentEmail] = await db.insert(sentEmails).values({
      userId: send.userId,
      contactId: send.contactId,
      subject: finalSubject,
      body: finalBody,
      gmailMessageId: result.messageId,
      gmailThreadId: result.threadId,
      sentAt: new Date(),
    }).returning({ id: sentEmails.id });

    await markSent(send.id, sentEmail.id);

    await recordSendTimeEvent(
      send.userId,
      send.contactId,
      sentEmail.id,
      new Date(),
      'email'
    );

    if (metadata?.enableSpintax && appliedVariation) {
      await recordVariationUsage(
        send.userId,
        send.contactId,
        send.campaignId || null,
        appliedVariation,
        send.subject,
        send.body,
        sentEmail.id
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[ScheduledSendProcessor] Send ${send.id} completed in ${duration}ms`);

    return { success: true, sentEmailId: sentEmail.id };

  } catch (error: any) {
    console.error(`[ScheduledSendProcessor] Send ${send.id} failed:`, error.message);
    await markFailed(send.id, error.message);
    return { success: false, error: error.message };
  }
}

export async function processBatch(
  sends: ScheduledSendWithContext[],
  sendEmailFn: (params: {
    userId: number;
    contactId: number;
    to: string;
    subject: string;
    body: string;
  }) => Promise<{ messageId: string; threadId: string }>
): Promise<{ processed: number; succeeded: number; failed: number }> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const send of sends) {
    const result = await processScheduledSend(send, sendEmailFn);
    processed++;
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[ScheduledSendProcessor] Batch complete: ${succeeded}/${processed} succeeded`);
  return { processed, succeeded, failed };
}
