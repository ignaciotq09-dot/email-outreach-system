export type DeadLetterReviewAction = "retry" | "manual_check" | "skip" | "mark_no_reply" | "mark_has_reply";
export interface DeadLetterReviewResult { success: boolean; action: DeadLetterReviewAction; message: string; newJobId?: number; }
