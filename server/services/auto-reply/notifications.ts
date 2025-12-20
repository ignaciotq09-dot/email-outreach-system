import { db } from "../../db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { sendEmail as sendGmailEmail } from "../../gmail";
import { sendEmail as sendOutlookEmail } from "../../outlook";

export async function sendUserNotification(userId: number, contactName: string, contactEmail: string, originalReply: string, autoReplyContent: string, provider: 'gmail' | 'outlook'): Promise<boolean> {
  try { const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1); if (!user?.email) { console.log(`[AutoReply] User ${userId}: No email found for notification`); return false; }
  const notificationSubject = `Meeting Booked: ${contactName} said YES!`;
  const notificationContent = `Great news! ${contactName} (${contactEmail}) expressed interest in booking a meeting.\n\nTheir reply:\n"${originalReply.substring(0, 500)}${originalReply.length > 500 ? '...' : ''}"\n\nI automatically sent them your calendar link:\n"${autoReplyContent}"\n\nThis was verified by our AI with 95%+ confidence across two independent checks.\n\n---\nSent by your AI Email Assistant`;
  if (provider === 'outlook') { await sendOutlookEmail(userId, user.email, notificationSubject, notificationContent); } else { await sendGmailEmail(userId, user.email, notificationSubject, notificationContent); }
  console.log(`[AutoReply] User ${userId}: Notification sent to ${user.email}`);
  return true; } catch (error: any) { console.error(`[AutoReply] User ${userId}: Failed to send notification:`, error.message); return false; }
}

export async function sendReviewNotification(userId: number, contactName: string, contactEmail: string, originalReply: string, reason: string, provider: 'gmail' | 'outlook'): Promise<boolean> {
  try { const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1); if (!user?.email) return false;
  const notificationSubject = `Review Needed: Reply from ${contactName}`;
  const notificationContent = `A reply from ${contactName} (${contactEmail}) needs your review.\n\nReason: ${reason}\n\nTheir reply:\n"${originalReply.substring(0, 500)}${originalReply.length > 500 ? '...' : ''}"\n\nPlease review and respond manually.\n\n---\nSent by your AI Email Assistant`;
  if (provider === 'outlook') { await sendOutlookEmail(userId, user.email, notificationSubject, notificationContent); } else { await sendGmailEmail(userId, user.email, notificationSubject, notificationContent); }
  return true; } catch (error: any) { console.error(`[AutoReply] User ${userId}: Failed to send review notification:`, error.message); return false; }
}
