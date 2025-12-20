import { db } from "../../db";
import { linkedinSettings, linkedinMessages, linkedinSendTimeAnalytics, contacts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import type { LinkedInMessageParams, LinkedInSendResult } from "./types";
import { canSendConnectionRequest, canSendDirectMessage } from "./status";

export const LINKEDIN_PSYCHOLOGY_RULES = {
  connectionRequest: {
    blankRecommended: true,
    blankAcceptanceRate: '55-68%',
    noteAcceptanceRate: '28-45%',
    maxChars: 300,
    recommendation: 'Send blank for cold outreach - higher acceptance rate'
  },
  directMessage: {
    maxChars: 400,
    optimalChars: 200,
    structure: 'Value-first, no pitch in first message',
    endWithQuestion: true
  },
  noFabricationRules: [
    'NEVER invent company news or achievements',
    'NEVER fabricate mutual connections',
    'NEVER make up specific metrics or dates',
    'If context is limited, keep message simple and authentic'
  ]
};

export function shouldSendBlankConnectionRequest(contact: { notes?: string | null; industry?: string | null; position?: string | null }): { sendBlank: boolean; reason: string } {
  const hasRealContext = (contact.notes && contact.notes.length > 20) || (contact.industry && contact.position);
  if (!hasRealContext) {
    return { sendBlank: true, reason: 'Blank requests have 55-68% acceptance vs 28-45% with generic notes. No personalization context available.' };
  }
  return { sendBlank: false, reason: 'Contact has sufficient context for personalized note.' };
}

async function recordSendTimeAnalytics(userId: number, contactId: number, linkedinMessageId: number, messageType: string, sentAt: Date, timezone?: string | null, industry?: string | null): Promise<void> {
  try { await db.insert(linkedinSendTimeAnalytics).values({ userId, contactId, linkedinMessageId, messageType, dayOfWeek: sentAt.getDay(), hourOfDay: sentAt.getHours(), timezone: timezone || 'America/New_York', industry: industry || null, sentAt }); }
  catch (error) { console.error('[LinkedIn] Error recording send time analytics:', error); }
}

export async function sendConnectionRequest(params: LinkedInMessageParams): Promise<LinkedInSendResult> {
  try {
    const check = await canSendConnectionRequest(params.userId);
    if (!check.allowed) { return { success: false, error: check.reason }; }
    const contact = await db.select().from(contacts).where(eq(contacts.id, params.contactId)).limit(1);
    if (contact.length === 0) { return { success: false, error: 'Contact not found' }; }
    const now = new Date();
    const [insertedMessage] = await db.insert(linkedinMessages).values({ userId: params.userId, contactId: params.contactId, campaignId: params.campaignId, linkedinProfileUrl: params.linkedinProfileUrl, messageType: 'connection_request', message: params.message, personalizedMessage: params.message, status: 'sent', sentAt: now, updatedAt: now }).returning();
    await db.update(linkedinSettings).set({ connectionsSentToday: sql`${linkedinSettings.connectionsSentToday} + 1`, updatedAt: now }).where(eq(linkedinSettings.userId, params.userId));
    await recordSendTimeAnalytics(params.userId, params.contactId, insertedMessage.id, 'connection_request', now, contact[0].timezone, contact[0].industry);
    console.log(`[LinkedIn] Connection request sent to ${params.linkedinProfileUrl} for user ${params.userId}`);
    return { success: true, messageId: insertedMessage.id };
  } catch (error: any) { console.error('[LinkedIn] Error sending connection request:', error); return { success: false, error: error.message }; }
}

export async function sendDirectMessage(params: LinkedInMessageParams): Promise<LinkedInSendResult> {
  try {
    const { userId, contactId, campaignId, linkedinProfileUrl, message, messageType } = params;
    const check = await canSendDirectMessage(userId);
    if (!check.allowed) { return { success: false, error: check.reason }; }
    const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (contact.length === 0) { return { success: false, error: 'Contact not found' }; }
    const now = new Date();
    const [insertedMessage] = await db.insert(linkedinMessages).values({ userId, contactId, campaignId, linkedinProfileUrl, messageType: messageType || 'direct_message', message, personalizedMessage: message, status: 'sent', sentAt: now, updatedAt: now }).returning();
    await db.update(linkedinSettings).set({ messagesSentToday: sql`${linkedinSettings.messagesSentToday} + 1`, updatedAt: now }).where(eq(linkedinSettings.userId, userId));
    await recordSendTimeAnalytics(userId, contactId, insertedMessage.id, messageType || 'direct_message', now, contact[0].timezone, contact[0].industry);
    console.log(`[LinkedIn] Direct message sent to ${linkedinProfileUrl} for user ${userId}`);
    return { success: true, messageId: insertedMessage.id };
  } catch (error: any) { console.error('[LinkedIn] Error sending direct message:', error); return { success: false, error: error.message }; }
}

export async function sendMessage(params: LinkedInMessageParams): Promise<LinkedInSendResult> {
  if (params.messageType === 'connection_request') { return sendConnectionRequest(params); }
  else { return sendDirectMessage(params); }
}
