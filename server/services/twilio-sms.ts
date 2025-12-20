import Twilio from "twilio";
import { db } from "../db";
import { sentSms, smsSettings, type InsertSentSms, type SmsStatus } from "@shared/schema";
import { eq } from "drizzle-orm";
import { SmsOptOutService } from "./sms-opt-out";
import { recordSendTimeEvent } from "./send-time-optimizer";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const defaultFromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    }
    twilioClient = Twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && defaultFromNumber);
}

export interface SendSmsOptions {
  userId: number;
  contactId: number;
  campaignId?: number;
  toPhone: string;
  message: string;
  personalizedMessage?: string;
  fromPhone?: string;
}

export interface SendSmsResult {
  success: boolean;
  smsId?: number;
  twilioSid?: string;
  status?: SmsStatus;
  error?: string;
}

export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const { userId, contactId, campaignId, toPhone, message, personalizedMessage, fromPhone } = options;

  let senderPhone = fromPhone;
  if (!senderPhone) {
    const userSettings = await db.select().from(smsSettings).where(eq(smsSettings.userId, userId)).limit(1);
    senderPhone = userSettings[0]?.twilioPhoneNumber || defaultFromNumber;
  }

  if (!senderPhone) {
    return { success: false, error: "No sender phone number configured" };
  }

  const normalizedTo = normalizePhoneNumber(toPhone);
  const normalizedFrom = normalizePhoneNumber(senderPhone);

  if (!normalizedTo) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const optOutCheck = await SmsOptOutService.checkOptOut(userId, normalizedTo);
  if (optOutCheck.isOptedOut) {
    console.log(`[TwilioSMS] Blocked send to opted-out number ${normalizedTo}`);
    return { 
      success: false, 
      error: "Cannot send message to this person - they opted out of receiving messages from you" 
    };
  }

  const smsRecord: InsertSentSms = {
    userId,
    contactId,
    campaignId: campaignId || null,
    toPhone: normalizedTo,
    fromPhone: normalizedFrom,
    message,
    personalizedMessage: personalizedMessage || message,
    status: "pending",
  };

  const [inserted] = await db.insert(sentSms).values(smsRecord).returning();
  const smsId = inserted.id;

  try {
    const client = getClient();
    const twilioMessage = await client.messages.create({
      body: personalizedMessage || message,
      to: normalizedTo,
      from: normalizedFrom,
      statusCallback: getStatusCallbackUrl(),
    });

    await db.update(sentSms)
      .set({
        status: mapTwilioStatus(twilioMessage.status),
        twilioSid: twilioMessage.sid,
        updatedAt: new Date(),
      })
      .where(eq(sentSms.id, smsId));

    try {
      await recordSendTimeEvent(userId, contactId, smsId, new Date(), 'sms');
    } catch (trackingError) {
      console.warn(`[TwilioSMS] Failed to record send time analytics for SMS ${smsId}:`, trackingError);
    }

    return {
      success: true,
      smsId,
      twilioSid: twilioMessage.sid,
      status: mapTwilioStatus(twilioMessage.status),
    };
  } catch (error: any) {
    const errorCode = error.code?.toString() || "UNKNOWN";
    const errorMessage = error.message || "Failed to send SMS";

    await db.update(sentSms)
      .set({
        status: "failed",
        errorCode,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(sentSms.id, smsId));

    console.error(`[TwilioSMS] Failed to send SMS to ${normalizedTo}:`, errorMessage);
    return { success: false, smsId, error: errorMessage };
  }
}

export async function sendBulkSms(
  smsList: SendSmsOptions[],
  delayMs: number = 1000
): Promise<SendSmsResult[]> {
  const results: SendSmsResult[] = [];

  for (const smsOptions of smsList) {
    const result = await sendSms(smsOptions);
    results.push(result);
    if (delayMs > 0 && smsList.indexOf(smsOptions) < smsList.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export async function handleTwilioWebhook(body: any): Promise<void> {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = body;

  if (!MessageSid) {
    console.warn("[TwilioSMS] Webhook received without MessageSid");
    return;
  }

  const status = mapTwilioStatus(MessageStatus);
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "delivered") {
    updateData.deliveredAt = new Date();
  }

  if (ErrorCode) {
    updateData.errorCode = ErrorCode;
    updateData.errorMessage = ErrorMessage || null;
  }

  await db.update(sentSms)
    .set(updateData)
    .where(eq(sentSms.twilioSid, MessageSid));

  console.log(`[TwilioSMS] Updated SMS ${MessageSid} status to ${status}`);
}

export async function getSmsSettings(userId: number) {
  const [settings] = await db.select().from(smsSettings).where(eq(smsSettings.userId, userId)).limit(1);
  return settings || null;
}

export async function updateSmsSettings(userId: number, twilioPhoneNumber: string) {
  const existing = await getSmsSettings(userId);

  if (existing) {
    await db.update(smsSettings)
      .set({ twilioPhoneNumber, updatedAt: new Date() })
      .where(eq(smsSettings.userId, userId));
  } else {
    await db.insert(smsSettings).values({ userId, twilioPhoneNumber });
  }

  return getSmsSettings(userId);
}

function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

function mapTwilioStatus(twilioStatus: string): SmsStatus {
  const statusMap: Record<string, SmsStatus> = {
    queued: "queued",
    sending: "queued",
    sent: "sent",
    delivered: "delivered",
    failed: "failed",
    undelivered: "undelivered",
  };
  return statusMap[twilioStatus?.toLowerCase()] || "pending";
}

function getStatusCallbackUrl(): string | undefined {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.BASE_URL;
  
  if (baseUrl) {
    return `${baseUrl}/api/webhooks/twilio/sms-status`;
  }
  return undefined;
}

export async function getSmsStats(userId: number) {
  const allSms = await db.select().from(sentSms).where(eq(sentSms.userId, userId));
  
  const stats = {
    total: allSms.length,
    delivered: allSms.filter(s => s.status === "delivered").length,
    sent: allSms.filter(s => s.status === "sent").length,
    failed: allSms.filter(s => s.status === "failed" || s.status === "undelivered").length,
    pending: allSms.filter(s => s.status === "pending" || s.status === "queued").length,
  };

  return stats;
}
