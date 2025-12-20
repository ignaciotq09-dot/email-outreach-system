import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, smsSettings } from "@shared/schema";
import { isTwilioConfigured } from "./twilio-sms";
import Twilio from "twilio";
import { format } from "date-fns";
import { getUserEmailService } from "../user-email-service";

interface BookingNotificationData {
  userId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startTime: Date;
  endTime: Date;
  meetingLink?: string | null;
  guestNotes?: string;
}

export async function sendBookingNotifications(data: BookingNotificationData): Promise<{
  smsSuccess: boolean;
  emailSuccess: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let smsSuccess = false;
  let emailSuccess = false;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId))
    .limit(1);

  if (!user) {
    errors.push("User not found");
    return { smsSuccess, emailSuccess, errors };
  }

  const hasPhone = !!user.phone;
  const hasEmail = !!user.email;

  if (!hasPhone && !hasEmail) {
    console.log("[BookingNotifications] No notification channels configured for user, skipping");
    return { smsSuccess, emailSuccess, errors };
  }

  const formattedDate = format(data.startTime, "EEEE, MMMM d, yyyy");
  const formattedTime = format(data.startTime, "h:mm a");
  const duration = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);

  if (hasPhone) {
    smsSuccess = await sendSmsNotification(user, data, formattedDate, formattedTime, errors);
  }
  
  if (hasEmail) {
    emailSuccess = await sendEmailNotification(user, data, formattedDate, formattedTime, duration, errors);
  }

  return { smsSuccess, emailSuccess, errors };
}

async function sendSmsNotification(
  user: any,
  data: BookingNotificationData,
  formattedDate: string,
  formattedTime: string,
  errors: string[]
): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.log("[BookingNotifications] Twilio not configured, skipping SMS");
    return false;
  }

  const [userSmsSettings] = await db
    .select()
    .from(smsSettings)
    .where(eq(smsSettings.userId, data.userId))
    .limit(1);

  const userPhone = user.phone || userSmsSettings?.twilioPhoneNumber;
  if (!userPhone) {
    console.log("[BookingNotifications] No phone number for user, skipping SMS");
    return false;
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return false;
    }

    const client = Twilio(accountSid, authToken);

    const message = `New meeting booked! ${data.guestName} (${data.guestEmail}) scheduled a meeting with you on ${formattedDate} at ${formattedTime}.`;

    await client.messages.create({
      body: message,
      to: userPhone,
      from: fromNumber,
    });

    console.log(`[BookingNotifications] SMS sent to ${userPhone}`);
    return true;
  } catch (error: any) {
    const errorMsg = `SMS notification failed: ${error.message}`;
    console.error(`[BookingNotifications] ${errorMsg}`);
    errors.push(errorMsg);
    return false;
  }
}

async function sendEmailNotification(
  user: any,
  data: BookingNotificationData,
  formattedDate: string,
  formattedTime: string,
  duration: number,
  errors: string[]
): Promise<boolean> {
  if (!user.email) {
    console.log("[BookingNotifications] No email for user, skipping email notification");
    return false;
  }

  try {
    const emailService = getUserEmailService(user);
    const isConnected = await emailService.isConnected();

    if (!isConnected) {
      console.log("[BookingNotifications] Email not connected, skipping notification");
      return false;
    }

    const subject = `New Meeting Booked: ${data.guestName} on ${formattedDate}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; }
    .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: 600; color: #6b7280; width: 120px; }
    .detail-value { color: #111827; }
    .meeting-card { background: white; border-radius: 8px; padding: 16px; margin-top: 16px; border: 1px solid #e5e7eb; }
    .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
    .notes { background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Meeting Booked!</h1>
    </div>
    <div class="content">
      <p>Great news! Someone has booked a meeting with you through your scheduling link.</p>
      
      <div class="meeting-card">
        <div class="detail-row">
          <span class="detail-label">Guest:</span>
          <span class="detail-value">${data.guestName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${data.guestEmail}</span>
        </div>
        ${data.guestPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${data.guestPhone}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${formattedTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${duration} minutes</span>
        </div>
      </div>
      
      ${data.guestNotes ? `
      <div class="notes">
        <strong>Guest Notes:</strong><br/>
        ${data.guestNotes}
      </div>
      ` : ''}
      
      ${data.meetingLink ? `
      <a href="${data.meetingLink}" class="cta-button">View in Calendar</a>
      ` : ''}
      
      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        This meeting was automatically added to your calendar. The guest has received a calendar invitation.
      </p>
    </div>
  </div>
</body>
</html>
`;

    await emailService.sendEmail(user.email, subject, htmlBody, { htmlBody });

    console.log(`[BookingNotifications] Email sent to ${user.email}`);
    return true;
  } catch (error: any) {
    const errorMsg = `Email notification failed: ${error.message}`;
    console.error(`[BookingNotifications] ${errorMsg}`);
    errors.push(errorMsg);
    return false;
  }
}
