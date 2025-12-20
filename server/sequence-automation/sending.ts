import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { followUps, sequenceSteps } from "@shared/schema";
import { personalizeVariantForContact } from "../services/openai";
import { EmailTrackingService } from "../services/email-tracking";

export async function sendSequenceStep(contact: any, initialEmail: any, step: any, campaignId: number, user: any) {
  try {
    const personalizedContent = await personalizeVariantForContact(
      {
        approach: step.variantName || 'Follow-up',
        subject: step.subject || initialEmail.subject,
        body: step.body
      },
      contact.name,
      contact.company,
      contact.pronoun,
      contact.notes
    );

    const result = await EmailTrackingService.sendTrackedReply({
      userId: user.id,
      contactId: contact.id,
      to: contact.email,
      subject: personalizedContent.subject,
      body: personalizedContent.body,
      threadId: initialEmail.gmailThreadId || '',
      messageId: initialEmail.gmailMessageId,
      writingStyle: step.variantName || 'Follow-up',
      campaignId: campaignId,
      provider: 'gmail',
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send sequence step');
    }

    await db.insert(followUps).values({
      userId: user.id,
      originalEmailId: initialEmail.id,
      followUpBody: personalizedContent.body,
      gmailMessageId: result.messageId || '',
    });

    await db.update(sequenceSteps)
      .set({ totalSent: sql`${sequenceSteps.totalSent} + 1` })
      .where(eq(sequenceSteps.id, step.id));

    console.log(`[SequenceAutomation] Sent tracked follow-up to ${contact.email} (step ${step.stepNumber})`);
  } catch (error) {
    console.error(`[SequenceAutomation] Error sending step to ${contact.email}:`, error);
  }
}
