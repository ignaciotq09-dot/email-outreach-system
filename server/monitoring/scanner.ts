import { storage } from "../storage";
import { getUserEmailService } from "../user-email-service";
import type { MonitoringResult } from "./types";
import { getMonitoringSettings, updateLastScanTime } from "./settings";
import { getEmailedContacts } from "./contacts";
import { processReply } from "./reply-processor";

export async function scanForReplies(): Promise<MonitoringResult> {
  const result: MonitoringResult = { newReplies: 0, smsNotificationsSent: 0, appointmentsDetected: 0, errors: [] };
  try { console.log('[Monitor] Starting scan at', new Date().toISOString()); const settings = await getMonitoringSettings(); if (!settings.enabled) { console.log('[Monitor] Monitoring is disabled'); return result; }
  const users = await storage.getAllUsers(); if (users.length === 0) { console.log('[Monitor] No active users to monitor'); return result; } console.log(`[Monitor] Scanning for ${users.length} active user(s)`);
  for (const user of users) { try { console.log(`[Monitor] Processing user: ${user.email} (provider: ${user.emailProvider || 'gmail'})`); const emailService = getUserEmailService(user); const isConnected = await emailService.isConnected(); if (!isConnected) { console.log(`[Monitor] User ${user.email} email provider not connected, skipping`); continue; }
  const userContactIds = await storage.getUserSentEmailContactIds(user.id); if (userContactIds.length === 0) { console.log(`[Monitor] No contacts to monitor for user ${user.email} (no sent emails)`); continue; }
  const emailedContacts = await getEmailedContacts(userContactIds); if (emailedContacts.length === 0) { console.log(`[Monitor] No contacts to monitor for user ${user.email} (after filtering)`); continue; } console.log(`[Monitor] Monitoring ${emailedContacts.length} contacts for user ${user.email}`);
  for (const contact of emailedContacts) { try { const newReplies = await emailService.checkForReplies(contact.email); for (const replyData of newReplies) { try { await processReply(replyData, contact, settings, result); } catch (error: any) { console.error(`[Monitor] Error processing reply:`, error); result.errors.push(`Reply processing failed: ${error.message}`); } } } catch (error: any) { result.errors.push(`Contact ${contact.name} check failed: ${error.message}`); } } } catch (userError: any) { console.error(`[Monitor] Error processing user ${user.email}:`, userError); result.errors.push(`User ${user.email} processing failed: ${userError.message}`); } }
  await updateLastScanTime(); console.log('[Monitor] Scan complete:', result); return result; } catch (error: any) { console.error('[Monitor] Fatal error in scanForReplies:', error); result.errors.push(`Fatal error: ${error.message}`); return result; }
}
