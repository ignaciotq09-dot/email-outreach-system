// Re-export from modular structure for backward compatibility
export type { DeadLetterReviewAction, DeadLetterReviewResult } from "./dead-letter-mod/index";
export { reviewDeadLetterEntry, getDeadLetterStats, getPendingReviewEntries } from "./dead-letter-mod/index";
