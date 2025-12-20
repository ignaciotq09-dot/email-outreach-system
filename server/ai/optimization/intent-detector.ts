import { EmailIntent } from "./types";

export function detectIntent(content: string): EmailIntent {
  const lower = content.toLowerCase();
  if (lower.includes('follow') || lower.includes('following up')) return EmailIntent.FOLLOW_UP;
  else if (lower.includes('meeting') || lower.includes('call') || lower.includes('chat')) return EmailIntent.MEETING_REQUEST;
  else if (lower.includes('mutual') || lower.includes('introduced')) return EmailIntent.WARM_INTRODUCTION;
  else if (lower.includes('been a while') || lower.includes('reconnect')) return EmailIntent.RE_ENGAGEMENT;
  else if (lower.includes('closing') || lower.includes('last email')) return EmailIntent.BREAKUP;
  else if (lower.includes('resource') || lower.includes('guide') || lower.includes('case study')) return EmailIntent.VALUE_DELIVERY;
  return EmailIntent.COLD_OUTREACH;
}
