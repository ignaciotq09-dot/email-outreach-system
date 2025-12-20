import { db } from "../../../db";
import { users, detectionAlertsSent } from "@shared/schema";
import { eq } from "drizzle-orm";
import { UserEmailService } from "../../../user-email-service";
import type { AlertType, AlertDetails } from "./types";
import { alertCooldowns, ALERT_COOLDOWN_MS } from "./types";

export async function sendDetectionAlert(userId: number, alertType: AlertType, details: AlertDetails): Promise<boolean> {
  const cooldownKey = `${userId}:${alertType}`;
  const lastAlert = alertCooldowns.get(cooldownKey);
  if (lastAlert && (Date.now() - lastAlert.getTime()) < ALERT_COOLDOWN_MS) {
    console.log(`[BulletproofScheduler] Alert ${alertType} for user ${userId} on cooldown, skipping`);
    return false;
  }
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user[0] || !user[0].email) { console.warn(`[BulletproofScheduler] User ${userId} has no email`); return false; }
    const emailProvider = (user[0].emailProvider || 'gmail') as 'gmail' | 'outlook';
    const emailService = new UserEmailService(emailProvider, userId);
    const isConnected = await emailService.isConnected();
    if (!isConnected) { console.warn(`[BulletproofScheduler] User ${userId} email not connected`); return false; }
    const htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: ${details.severity === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;"><h1 style="margin: 0; font-size: 24px;">${details.severity === 'critical' ? '⚠️ Critical Alert' : '⚡ Warning'}</h1></div><div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;"><p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${details.message}</p><div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px;"><p style="color: #64748b; margin: 0; font-size: 14px;"><strong>What to do:</strong><br>1. Go to your email outreach dashboard<br>2. Navigate to Settings → Email Connectors<br>3. Reconnect your email account</p></div></div></div>`;
    await emailService.sendEmail(user[0].email, `[Alert] ${details.subject}`, htmlBody, { htmlBody });
    await db.insert(detectionAlertsSent).values({ userId, alertType, severity: details.severity, subject: details.subject, sentAt: new Date(), metadata: { message: details.message } }).catch(() => {});
    alertCooldowns.set(cooldownKey, new Date());
    console.log(`[BulletproofScheduler] Sent ${alertType} alert to user ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`[BulletproofScheduler] Failed to send alert:`, error);
    return false;
  }
}
