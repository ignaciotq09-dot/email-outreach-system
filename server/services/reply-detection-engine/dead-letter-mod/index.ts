import { db } from "../../../db";
import { replyDetectionDeadLetter } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { DeadLetterReviewAction, DeadLetterReviewResult } from './types';
import { handleRetry, handleManualCheck, handleSkip, handleNoReply, handleHasReply } from './actions';
export * from './types';
export { getDeadLetterStats, getPendingReviewEntries } from './queries';

export async function reviewDeadLetterEntry(deadLetterId: number, action: DeadLetterReviewAction, reviewedBy: number, notes?: string, replyContent?: string): Promise<DeadLetterReviewResult> {
  const [entry] = await db.select().from(replyDetectionDeadLetter).where(eq(replyDetectionDeadLetter.id, deadLetterId)).limit(1); if (!entry) return { success: false, action, message: "Dead letter entry not found" }; if (entry.status !== "pending_review") return { success: false, action, message: `Entry already reviewed with status: ${entry.status}` };
  try { switch (action) { case "retry": return { ...await handleRetry(entry, reviewedBy, notes), action }; case "manual_check": return { ...await handleManualCheck(deadLetterId, reviewedBy, notes), action }; case "skip": return { ...await handleSkip(deadLetterId, reviewedBy, notes), action }; case "mark_no_reply": return { ...await handleNoReply(deadLetterId, entry.sentEmailId, reviewedBy, notes), action }; case "mark_has_reply": if (!replyContent) return { success: false, action, message: "Reply content required to mark as has reply" }; return { ...await handleHasReply(entry, reviewedBy, replyContent, notes), action }; default: return { success: false, action, message: `Unknown action: ${action}` }; } } catch (error: any) { console.error(`[DeadLetter] Review failed for ${deadLetterId}:`, error); return { success: false, action, message: error.message }; }
}
