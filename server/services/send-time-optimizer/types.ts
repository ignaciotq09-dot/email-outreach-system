import type { Contact } from "@shared/schema";
export type { Contact };
export interface OptimalSendTime { scheduledFor: Date; timezone: string; confidenceScore: number; reason: string; dayOfWeek: number; hourOfDay: number; }
export interface SendTimeOptions { userId: number; contact: Contact; preferredTimezone?: string; }
export interface TimeSlotStats { dayOfWeek: number; hourOfDay: number; totalSent: number; opened: number; replied: number; openRate: number; replyRate: number; score: number; }
