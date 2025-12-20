import { db } from "../../../db";
import { leadFeedbackEvents, FEEDBACK_WEIGHTS } from "@shared/schema";

export async function recordFeedback(userId: number, leadId: string, feedbackType: 'interested' | 'not_interested' | 'skipped' | 'saved' | 'replied' | 'converted', leadAttributes: { title?: string | null; industry?: string | null; companySize?: string | null; location?: string | null }): Promise<void> {
  console.log(`[ICP] Recording feedback: ${feedbackType} for lead ${leadId}`);
  let weight = 0;
  switch (feedbackType) {
    case 'converted': weight = FEEDBACK_WEIGHTS.converted; break;
    case 'replied': weight = FEEDBACK_WEIGHTS.replied; break;
    case 'interested': weight = FEEDBACK_WEIGHTS.interested; break;
    case 'saved': weight = FEEDBACK_WEIGHTS.saved; break;
    case 'skipped': weight = FEEDBACK_WEIGHTS.skipped; break;
    case 'not_interested': weight = FEEDBACK_WEIGHTS.not_interested; break;
  }
  await db.insert(leadFeedbackEvents).values({ userId, leadId, feedbackType, leadAttributes, weightedScore: weight, createdAt: new Date() });
  console.log(`[ICP] Feedback recorded with weight ${weight}`);
}
