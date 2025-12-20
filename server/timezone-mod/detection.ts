import { db } from "../db";
import { contacts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { locationToTimezone, countryToTimezone } from './mappings';

export function detectTimezone(location?: string | null, email?: string, company?: string | null): string | null { if (location) { const locationLower = location.toLowerCase().trim(); for (const [key, tz] of Object.entries(locationToTimezone)) { if (locationLower.includes(key)) return tz; } for (const [key, tz] of Object.entries(countryToTimezone)) { if (locationLower.includes(key)) return tz; } } if (email) { const domain = email.split('@')[1]?.toLowerCase(); if (domain) { if (domain.endsWith('.uk') || domain.endsWith('.co.uk')) return "Europe/London"; if (domain.endsWith('.de')) return "Europe/Berlin"; if (domain.endsWith('.fr')) return "Europe/Paris"; if (domain.endsWith('.jp')) return "Asia/Tokyo"; if (domain.endsWith('.au')) return "Australia/Sydney"; if (domain.endsWith('.in')) return "Asia/Kolkata"; if (domain.endsWith('.sg')) return "Asia/Singapore"; } } return "America/New_York"; }

export function getDefaultOptimalSendTime(): string { return "09:30"; }

export async function detectAndUpdateTimezone(contactId: number): Promise<string | null> { const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1); if (!contact) return null; if (contact.timezone) return contact.timezone; const detectedTimezone = detectTimezone(contact.location, contact.email, contact.company); if (detectedTimezone) { await db.update(contacts).set({ timezone: detectedTimezone, optimalSendTime: getDefaultOptimalSendTime() }).where(eq(contacts.id, contactId)); console.log(`[Timezone] Detected timezone for contact ${contactId}: ${detectedTimezone}`); return detectedTimezone; } return null; }

export async function bulkDetectTimezones(contactIds: number[]): Promise<void> { console.log(`[Timezone] Starting bulk timezone detection for ${contactIds.length} contacts`); for (const contactId of contactIds) { try { await detectAndUpdateTimezone(contactId); } catch (error) { console.error(`[Timezone] Error detecting timezone for contact ${contactId}:`, error); } } console.log(`[Timezone] Bulk timezone detection completed`); }
