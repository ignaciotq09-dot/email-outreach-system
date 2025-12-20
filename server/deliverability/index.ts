/**
 * Deliverability Module Exports
 */

export { checkSpamScore } from './spam-checker';
export type { SpamCheckResult, SpamIssue } from './types';
export {
  checkSendingThrottle,
  getRandomizedDelay,
  getNextAvailableSendTime,
  calculateBatchSchedule
} from './sending-throttle';
export type { ThrottleConfig, ThrottleCheck } from './sending-throttle';
