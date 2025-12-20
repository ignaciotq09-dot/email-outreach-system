import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { followUps, followUpSequences } from "@shared/schema";

export async function checkForMissedFollowUp(campaign: any, contact: any, sentEmail: any): Promise<{ missed: boolean; stepNumber: number; stepId?: number; subject?: string; body?: string; dueDate?: Date; }> {
  if (!campaign.followUpSequenceId) return { missed: false, stepNumber: 0 };
  const sequence = await db.query.followUpSequences.findFirst({ where: eq(followUpSequences.id, campaign.followUpSequenceId), with: { sequenceSteps: true } });
  if (!sequence || !sequence.active) return { missed: false, stepNumber: 0 };
  const existingFollowUps = await db.query.followUps.findMany({ where: eq(followUps.originalEmailId, sentEmail.id) });
  const currentStepNumber = existingFollowUps.length; const nextStepNumber = currentStepNumber + 1;
  const nextStep = sequence.sequenceSteps.find((step: any) => step.stepNumber === nextStepNumber);
  if (!nextStep) return { missed: false, stepNumber: nextStepNumber };
  const sentDate = new Date(sentEmail.sentAt); const lastFollowUp = existingFollowUps.length > 0 ? existingFollowUps.sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())[0] : null;
  const referenceDate = lastFollowUp ? new Date(lastFollowUp.sentAt!) : sentDate; const dueDate = new Date(referenceDate.getTime() + nextStep.delayDays * 24 * 60 * 60 * 1000);
  if (new Date() < dueDate) return { missed: false, stepNumber: nextStepNumber };
  return { missed: true, stepNumber: nextStepNumber, stepId: nextStep.id, subject: nextStep.subject || undefined, body: nextStep.body, dueDate };
}
