import { db } from "../db";
import { smsOptOuts, smsSettings, contacts, type OptOutSource } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");
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

export interface OptOutCheckResult {
  isOptedOut: boolean;
  optedOutAt?: Date;
  twilioPhone?: string;
}

export interface OptOutResult {
  success: boolean;
  message: string;
  phone?: string;
}

export class SmsOptOutService {
  static async checkOptOut(userId: number, phone: string): Promise<OptOutCheckResult> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return { isOptedOut: false };
    }

    const optOut = await db
      .select()
      .from(smsOptOuts)
      .where(
        and(
          eq(smsOptOuts.userId, userId),
          eq(smsOptOuts.phone, normalizedPhone),
          eq(smsOptOuts.isActive, 1)
        )
      )
      .limit(1);

    if (optOut.length > 0) {
      return {
        isOptedOut: true,
        optedOutAt: optOut[0].optedOutAt || undefined,
        twilioPhone: optOut[0].twilioPhone,
      };
    }

    return { isOptedOut: false };
  }

  static async checkBulkOptOuts(userId: number, phones: string[]): Promise<Map<string, boolean>> {
    const normalizedPhones = phones.map(p => normalizePhone(p)).filter(Boolean);
    if (normalizedPhones.length === 0) {
      return new Map();
    }

    const optOuts = await db
      .select({ phone: smsOptOuts.phone })
      .from(smsOptOuts)
      .where(
        and(
          eq(smsOptOuts.userId, userId),
          inArray(smsOptOuts.phone, normalizedPhones),
          eq(smsOptOuts.isActive, 1)
        )
      );

    const optOutSet = new Set(optOuts.map(o => o.phone));
    const result = new Map<string, boolean>();
    
    for (const phone of phones) {
      const normalized = normalizePhone(phone);
      result.set(phone, optOutSet.has(normalized));
    }

    return result;
  }

  static async recordOptOut(
    userId: number,
    phone: string,
    twilioPhone: string,
    source: OptOutSource = "webhook",
    contactId?: number
  ): Promise<OptOutResult> {
    const normalizedPhone = normalizePhone(phone);
    const normalizedTwilioPhone = normalizePhone(twilioPhone);

    if (!normalizedPhone) {
      return { success: false, message: "Invalid phone number" };
    }

    try {
      const existing = await db
        .select()
        .from(smsOptOuts)
        .where(
          and(
            eq(smsOptOuts.userId, userId),
            eq(smsOptOuts.phone, normalizedPhone)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(smsOptOuts)
          .set({
            isActive: 1,
            optedOutAt: new Date(),
            resubscribedAt: null,
            source,
            updatedAt: new Date(),
          })
          .where(eq(smsOptOuts.id, existing[0].id));
      } else {
        await db.insert(smsOptOuts).values({
          userId,
          phone: normalizedPhone,
          twilioPhone: normalizedTwilioPhone,
          contactId,
          source,
          optedOutAt: new Date(),
          isActive: 1,
        });
      }

      if (contactId) {
        await db
          .update(contacts)
          .set({
            smsOptedOut: 1,
            smsOptedOutAt: new Date(),
          })
          .where(eq(contacts.id, contactId));
      } else {
        await db
          .update(contacts)
          .set({
            smsOptedOut: 1,
            smsOptedOutAt: new Date(),
          })
          .where(
            and(
              eq(contacts.userId, userId),
              eq(contacts.phone, normalizedPhone)
            )
          );
      }

      console.log(`[SmsOptOut] Recorded opt-out for ${normalizedPhone} (user: ${userId})`);
      return { success: true, message: "Opt-out recorded", phone: normalizedPhone };
    } catch (error) {
      console.error(`[SmsOptOut] Error recording opt-out:`, error);
      return { success: false, message: "Failed to record opt-out" };
    }
  }

  static async recordResubscribe(
    userId: number,
    phone: string
  ): Promise<OptOutResult> {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return { success: false, message: "Invalid phone number" };
    }

    try {
      await db
        .update(smsOptOuts)
        .set({
          isActive: 0,
          resubscribedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(smsOptOuts.userId, userId),
            eq(smsOptOuts.phone, normalizedPhone)
          )
        );

      await db
        .update(contacts)
        .set({
          smsOptedOut: 0,
          smsOptedOutAt: null,
        })
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.phone, normalizedPhone)
          )
        );

      console.log(`[SmsOptOut] Recorded resubscribe for ${normalizedPhone} (user: ${userId})`);
      return { success: true, message: "Resubscribe recorded", phone: normalizedPhone };
    } catch (error) {
      console.error(`[SmsOptOut] Error recording resubscribe:`, error);
      return { success: false, message: "Failed to record resubscribe" };
    }
  }

  static async getOptOutsForUser(userId: number): Promise<string[]> {
    const optOuts = await db
      .select({ phone: smsOptOuts.phone })
      .from(smsOptOuts)
      .where(
        and(
          eq(smsOptOuts.userId, userId),
          eq(smsOptOuts.isActive, 1)
        )
      );

    return optOuts.map(o => o.phone);
  }

  static async getUserTwilioPhone(userId: number): Promise<string | null> {
    const settings = await db
      .select({ twilioPhoneNumber: smsSettings.twilioPhoneNumber })
      .from(smsSettings)
      .where(eq(smsSettings.userId, userId))
      .limit(1);

    return settings[0]?.twilioPhoneNumber || null;
  }

  static isOptOutKeyword(message: string): boolean {
    const keywords = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];
    const normalized = message.toLowerCase().trim();
    return keywords.includes(normalized);
  }

  static isResubscribeKeyword(message: string): boolean {
    const keywords = ["start", "yes", "unstop"];
    const normalized = message.toLowerCase().trim();
    return keywords.includes(normalized);
  }
}
