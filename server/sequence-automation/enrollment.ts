import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { campaigns, followUpSequences } from "@shared/schema";

export async function enrollCampaignInSequence(campaignId: number, sequenceId: number, userId: number) {
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId))).limit(1);
  if (!campaign) {
    throw new Error(`[SequenceAutomation] Campaign ${campaignId} not found or access denied for user ${userId}`);
  }

  const [sequence] = await db.select().from(followUpSequences).where(and(eq(followUpSequences.id, sequenceId), eq(followUpSequences.userId, userId))).limit(1);
  if (!sequence) {
    throw new Error(`[SequenceAutomation] Sequence ${sequenceId} not found or access denied for user ${userId}`);
  }

  await db.update(campaigns).set({ followUpSequenceId: sequenceId }).where(eq(campaigns.id, campaignId));

  await db.update(followUpSequences).set({ totalEnrolled: sql`${followUpSequences.totalEnrolled} + 1` }).where(eq(followUpSequences.id, sequenceId));

  console.log(`[SequenceAutomation] Enrolled campaign ${campaignId} in sequence ${sequenceId} for user ${userId}`);
}

export async function getSequenceMetrics(sequenceId: number) {
  const sequence = await db.query.followUpSequences.findFirst({
    where: eq(followUpSequences.id, sequenceId),
    with: { sequenceSteps: true },
  });

  if (!sequence) return null;

  const totalReplies = sequence.sequenceSteps.reduce((sum: number, step: any) => sum + (step.totalReplied || 0), 0);
  const totalSent = sequence.sequenceSteps.reduce((sum: number, step: any) => sum + (step.totalSent || 0), 0);
  const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;

  return { ...sequence, totalReplies, totalSent, replyRate };
}
