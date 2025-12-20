import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { campaigns, followUpSequences } from "@shared/schema";
import { storage } from "../storage";
import { getContactSequenceState, shouldStopSequence, selectVariant, getDaysSince } from "./helpers";
import { sendSequenceStep } from "./sending";

export async function processSequences() {
  try {
    console.log('[SequenceAutomation] Processing sequences...');

    const campaignsWithSequences = await db.query.campaigns.findMany({
      where: and(eq(campaigns.status, 'sent'), sql`${campaigns.followUpSequenceId} IS NOT NULL`),
      with: { campaignContacts: { with: { contact: true, sentEmail: true } } },
    });

    for (const campaign of campaignsWithSequences) {
      if (!campaign.followUpSequenceId) continue;

      const sequence = await db.query.followUpSequences.findFirst({
        where: eq(followUpSequences.id, campaign.followUpSequenceId),
        with: { sequenceSteps: true },
      });

      if (!sequence || !sequence.active) continue;

      for (const cc of campaign.campaignContacts) {
        if (!cc.sentEmail) continue;
        await processContactSequence(campaign, sequence, cc.contact, cc.sentEmail);
      }
    }

    console.log('[SequenceAutomation] Sequence processing completed');
  } catch (error) {
    console.error('[SequenceAutomation] Error processing sequences:', error);
  }
}

async function processContactSequence(campaign: any, sequence: any, contact: any, initialEmail: any) {
  if (await shouldStopSequence(sequence, initialEmail)) {
    console.log(`[SequenceAutomation] Stopping sequence for contact ${contact.id} due to engagement`);
    return;
  }

  const currentState = await getContactSequenceState(campaign.id, contact.id, sequence.id, initialEmail.id);
  if (!currentState) return;

  const nextStep = sequence.sequenceSteps.find((step: any) => step.stepNumber === currentState.currentStepNumber + 1);
  if (!nextStep) {
    console.log(`[SequenceAutomation] Sequence completed for contact ${contact.id}`);
    return;
  }

  const daysSinceLastStep = getDaysSince(currentState.lastStepSentAt);
  if (daysSinceLastStep < nextStep.delayDays) return;

  const user = await storage.getUserById(campaign.userId);
  if (!user) {
    console.error(`[SequenceAutomation] User not found for campaign ${campaign.id}, userId: ${campaign.userId}. Skipping.`);
    return;
  }

  const variantToSend = selectVariant(sequence.sequenceSteps, nextStep.stepNumber);
  await sendSequenceStep(contact, initialEmail, variantToSend, campaign.id, user);
  console.log(`[SequenceAutomation] Sent step ${nextStep.stepNumber} to contact ${contact.id}`);
}
