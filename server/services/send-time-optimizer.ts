// Re-export from modular structure for backward compatibility
export { calculateOptimalSendTime, calculateBatchOptimalSendTimes, recordSendTimeEvent, updateSendTimeOutcome, getSendTimeInsights } from "./send-time-optimizer/index";
export type { OptimalSendTime, SendTimeOptions } from "./send-time-optimizer/types";
