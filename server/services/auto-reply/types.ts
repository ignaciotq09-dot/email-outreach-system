import type { TwoPassIntentResult } from "../../ai/bulletproof-intent-detection";
export type { TwoPassIntentResult };
export interface BulletproofAutoReplyResult { processed: boolean; autoReplySent: boolean; userNotified: boolean; flaggedForReview: boolean; intent: TwoPassIntentResult | null; error?: string; }
