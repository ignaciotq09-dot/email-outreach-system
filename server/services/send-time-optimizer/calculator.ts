import { db } from "../../db";
import { sendTimeAnalytics, contacts } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { SendTimeOptions, OptimalSendTime, Contact } from "./types";
import { INDUSTRY_PATTERNS } from "./constants";
import { inferTimezoneFromLocation, getNextOccurrence } from "./timezone";
import { getUserSendTimeStats, getContactEngagementHistory } from "./stats";
import { scoreTimeSlot } from "./scoring";

export async function calculateOptimalSendTime(options: SendTimeOptions): Promise<OptimalSendTime> {
  const { userId, contact, preferredTimezone } = options;
  const timezone = preferredTimezone || contact.timezone || inferTimezoneFromLocation(contact.location);
  const industry = contact.industry || 'default';
  const [userStats, contactHistory] = await Promise.all([getUserSendTimeStats(userId), getContactEngagementHistory(userId, contact.id)]);
  let bestSlot = { day: 2, hour: 10, score: 0 };
  for (let day = 1; day <= 5; day++) for (let hour = 8; hour <= 18; hour++) { const score = scoreTimeSlot(day, hour, userStats, industry, contactHistory); if (score > bestSlot.score) bestSlot = { day, hour, score }; }
  const scheduledFor = getNextOccurrence(bestSlot.day, bestSlot.hour, timezone);
  const reasons: string[] = []; if (userStats.length > 0) reasons.push("Based on your past engagement data"); if (contactHistory.avgResponseHour !== undefined) reasons.push("Aligned with contact's response patterns"); const industryPattern = INDUSTRY_PATTERNS[industry.toLowerCase()]; if (industryPattern) reasons.push(`Optimized for ${industry} industry`); reasons.push(`Scheduled for ${timezone} timezone`);
  return { scheduledFor, timezone, confidenceScore: bestSlot.score, reason: reasons.join(". ") + ".", dayOfWeek: bestSlot.day, hourOfDay: bestSlot.hour };
}

export async function calculateBatchOptimalSendTimes(userId: number, contactsList: Contact[], preferredTimezone?: string): Promise<Map<number, OptimalSendTime>> {
  const results = new Map<number, OptimalSendTime>(); const userStats = await getUserSendTimeStats(userId);
  const MINUTE_SPREAD = 2; let minuteOffset = 0;
  for (const contact of contactsList) {
    const timezone = preferredTimezone || contact.timezone || inferTimezoneFromLocation(contact.location);
    const industry = contact.industry || 'default'; const contactHistory = await getContactEngagementHistory(userId, contact.id);
    let bestSlot = { day: 2, hour: 10, score: 0 };
    for (let day = 1; day <= 5; day++) for (let hour = 8; hour <= 18; hour++) { const score = scoreTimeSlot(day, hour, userStats, industry, contactHistory); if (score > bestSlot.score) bestSlot = { day, hour, score }; }
    const scheduledFor = getNextOccurrence(bestSlot.day, bestSlot.hour, timezone); scheduledFor.setMinutes(scheduledFor.getMinutes() + minuteOffset); minuteOffset = (minuteOffset + MINUTE_SPREAD) % 60;
    const reasons: string[] = []; if (contactHistory.avgResponseHour !== undefined) reasons.push("Personalized to contact"); const industryPattern = INDUSTRY_PATTERNS[industry.toLowerCase()]; if (industryPattern) reasons.push(`${industry} industry pattern`); reasons.push(timezone);
    results.set(contact.id, { scheduledFor, timezone, confidenceScore: bestSlot.score, reason: reasons.join(" | "), dayOfWeek: bestSlot.day, hourOfDay: bestSlot.hour });
  }
  console.log(`[SendTimeOptimizer] Calculated optimal times for ${contactsList.length} contacts`);
  return results;
}
