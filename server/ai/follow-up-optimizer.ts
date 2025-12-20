// Re-export from modular structure for backward compatibility
export type { FollowUpConfig } from "./follow-up/index";
export { FOLLOW_UP_STRATEGIES, optimizeFollowUp, calculateOptimalFollowUpTime, shouldSendFollowUp } from "./follow-up/index";
