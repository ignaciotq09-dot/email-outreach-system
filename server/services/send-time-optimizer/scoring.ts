import { INDUSTRY_PATTERNS } from "./constants";
import type { TimeSlotStats } from "./types";

export function scoreTimeSlot(day: number, hour: number, userStats: TimeSlotStats[], industry: string, contactHistory: { avgResponseHour?: number; preferredDay?: number }): number {
  let score = 50;
  const slotStats = userStats.find(s => s.dayOfWeek === day && s.hourOfDay === hour);
  if (slotStats && slotStats.totalSent >= 5) { score += slotStats.replyRate * 2; score += slotStats.openRate * 0.5; }
  const industryPattern = INDUSTRY_PATTERNS[industry.toLowerCase()] || INDUSTRY_PATTERNS['default'];
  if (industryPattern.bestDays.includes(day)) score += 15;
  if (industryPattern.bestHours.includes(hour)) score += 15;
  if (contactHistory.preferredDay === day) score += 20;
  if (contactHistory.avgResponseHour !== undefined) { const hourDiff = Math.abs(contactHistory.avgResponseHour - hour); if (hourDiff <= 1) score += 15; else if (hourDiff <= 2) score += 10; }
  if (day === 0 || day === 6) score -= 20;
  if (hour < 7 || hour > 19) score -= 30;
  if (hour >= 9 && hour <= 11) score += 10;
  if (hour >= 14 && hour <= 16) score += 10;
  if (hour >= 12 && hour <= 13) score -= 5;
  return Math.max(0, Math.min(100, score));
}
