import { db } from "../../db";
import { linkedinMessages, linkedinSendTimeAnalytics, contacts } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import type { MessageStats } from "./types";

export async function updateMessageStatus(messageId: number, status: string, additionalData?: { acceptedAt?: Date; repliedAt?: Date; errorCode?: string; errorMessage?: string }): Promise<void> {
  try {
    const updateData: any = { status, updatedAt: new Date() };
    if (additionalData?.acceptedAt) updateData.acceptedAt = additionalData.acceptedAt;
    if (additionalData?.repliedAt) updateData.repliedAt = additionalData.repliedAt;
    if (additionalData?.errorCode) updateData.errorCode = additionalData.errorCode;
    if (additionalData?.errorMessage) updateData.errorMessage = additionalData.errorMessage;
    await db.update(linkedinMessages).set(updateData).where(eq(linkedinMessages.id, messageId));
    if (status === 'accepted' || status === 'replied') {
      const [message] = await db.select().from(linkedinMessages).where(eq(linkedinMessages.id, messageId)).limit(1);
      if (message) {
        const analyticsUpdate: any = {};
        if (status === 'accepted') { analyticsUpdate.wasAccepted = true; analyticsUpdate.acceptedAt = additionalData?.acceptedAt || new Date(); }
        if (status === 'replied') { analyticsUpdate.wasReplied = true; analyticsUpdate.repliedAt = additionalData?.repliedAt || new Date(); }
        await db.update(linkedinSendTimeAnalytics).set(analyticsUpdate).where(eq(linkedinSendTimeAnalytics.linkedinMessageId, messageId));
      }
    }
  } catch (error) { console.error('[LinkedIn] Error updating message status:', error); }
}

export async function getSentMessages(userId: number, options?: { campaignId?: number; limit?: number; offset?: number; messageType?: string }): Promise<any[]> {
  try {
    let query = db.select({ message: linkedinMessages, contact: contacts }).from(linkedinMessages).leftJoin(contacts, eq(linkedinMessages.contactId, contacts.id)).where(eq(linkedinMessages.userId, userId)).$dynamic();
    if (options?.campaignId) { query = query.where(eq(linkedinMessages.campaignId, options.campaignId)); }
    if (options?.messageType) { query = query.where(eq(linkedinMessages.messageType, options.messageType)); }
    const messages = await query.orderBy(desc(linkedinMessages.sentAt)).limit(options?.limit || 50).offset(options?.offset || 0);
    return messages.map(m => ({ ...m.message, contact: m.contact }));
  } catch (error) { console.error('[LinkedIn] Error getting sent messages:', error); return []; }
}

export async function getMessageStats(userId: number, days: number = 30): Promise<MessageStats> {
  try {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const messages = await db.select({ messageType: linkedinMessages.messageType, status: linkedinMessages.status }).from(linkedinMessages).where(and(eq(linkedinMessages.userId, userId), gte(linkedinMessages.sentAt, startDate)));
    const totalSent = messages.length;
    const connectionRequests = messages.filter(m => m.messageType === 'connection_request').length;
    const directMessages = messages.filter(m => m.messageType !== 'connection_request').length;
    const accepted = messages.filter(m => m.status === 'accepted').length;
    const replied = messages.filter(m => m.status === 'replied').length;
    const pending = messages.filter(m => m.status === 'pending' || m.status === 'sent').length;
    return { totalSent, connectionRequests, directMessages, accepted, replied, pending, acceptanceRate: connectionRequests > 0 ? (accepted / connectionRequests) * 100 : 0, replyRate: totalSent > 0 ? (replied / totalSent) * 100 : 0 };
  } catch (error) { console.error('[LinkedIn] Error getting message stats:', error); return { totalSent: 0, connectionRequests: 0, directMessages: 0, accepted: 0, replied: 0, pending: 0, acceptanceRate: 0, replyRate: 0 }; }
}
