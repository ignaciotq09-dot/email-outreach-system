import { FOLLOW_UP_STRATEGIES } from './strategies';

export function calculateOptimalFollowUpTime(lastSentTime: Date, sequenceNumber: number, recipientTimezone?: string): Date {
  const sequence = FOLLOW_UP_STRATEGIES.timing.sequence; const timing = sequence[Math.min(sequenceNumber - 1, sequence.length - 1)]; const followUpDate = new Date(lastSentTime); followUpDate.setDate(followUpDate.getDate() + timing.day); followUpDate.setHours(10, 0, 0, 0); return followUpDate;
}

export function shouldSendFollowUp(sequenceNumber: number, daysSinceLastSent: number, previousOpened: boolean, previousResponded: boolean): { shouldSend: boolean; reason: string } {
  if (previousResponded) return { shouldSend: false, reason: 'Recipient already responded' }; const minDays = sequenceNumber === 1 ? 3 : 5; if (daysSinceLastSent < minDays) return { shouldSend: false, reason: `Wait ${minDays - daysSinceLastSent} more days` }; if (sequenceNumber > 5 && !previousOpened) return { shouldSend: false, reason: 'No engagement after 5 attempts' }; if (sequenceNumber <= 7) return { shouldSend: true, reason: 'Within optimal follow-up sequence' }; return { shouldSend: false, reason: 'Maximum follow-ups reached' };
}
