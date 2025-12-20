import type { Contact } from "@shared/schema";
import type { TimingRecommendation, TriggerContext } from "./types";

export function getFirstName(fullName: string): string {
  return fullName?.split(' ')[0] || fullName || 'there';
}

export function replacePlaceholders(message: string, contact: Contact): string {
  const firstName = getFirstName(contact.name);
  return message.replace(/\{name\}/gi, contact.name || '').replace(/\{first_name\}/gi, firstName).replace(/\{company\}/gi, contact.company || "your company").replace(/\{position\}/gi, contact.position || "");
}

export function hasEmoji(text: string): boolean {
  const emojiPattern = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return emojiPattern.test(text);
}

export function stripEmojis(text: string): string {
  const emojiPattern = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  return text.replace(emojiPattern, '').replace(/\s+/g, ' ').trim();
}

export function smartTruncate(message: string, maxLength: number): string {
  if (message.length <= maxLength) return message;
  const truncated = message.substring(0, maxLength - 3);
  const lastBreak = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('! '), truncated.lastIndexOf('? '), truncated.lastIndexOf(' - '), truncated.lastIndexOf(', '));
  if (lastBreak > maxLength * 0.6) return truncated.substring(0, lastBreak + 1).trim();
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) return truncated.substring(0, lastSpace) + '...';
  return truncated + '...';
}

export function calculateOptimalSendTime(contact: Contact): TimingRecommendation {
  const timezone = contact.timezone || contact.optimalSendTime || null;
  const OPTIMAL_WINDOWS = [{ window: '10:00 AM - 11:00 AM', reason: 'Morning productivity peak' }, { window: '2:00 PM - 3:00 PM', reason: 'Post-lunch focus time' }, { window: '7:00 PM - 8:00 PM', reason: 'Evening wind-down' }];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const recommended = isWeekend ? OPTIMAL_WINDOWS[2] : OPTIMAL_WINDOWS[0];
  let localTime: string | null = null;
  if (timezone) { try { localTime = new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: true }); } catch {} }
  return { optimalWindow: recommended.window, timezone, localTime, reason: recommended.reason };
}

export function calculateContactWarmth(contact: Contact): 'cold' | 'warm' | 'hot' {
  const indicators = { hasReplied: !!contact.lastRepliedAt, hasOpened: (contact.openCount || 0) > 0, hasMet: !!contact.notes?.toLowerCase().includes('met ') || !!contact.notes?.toLowerCase().includes('meeting') };
  if (indicators.hasReplied || indicators.hasMet) return 'hot';
  if (indicators.hasOpened) return 'warm';
  return 'cold';
}

export function extractTriggerContext(contact: Contact): TriggerContext {
  const triggerText = contact.triggerEvent || contact.linkedinHeadline || '';
  return { hasTrigger: !!triggerText, triggerText: triggerText || 'recent growth', industry: contact.industry || 'their industry' };
}
