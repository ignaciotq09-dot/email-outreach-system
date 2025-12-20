import * as gmail from "../../gmail";
import * as outlook from "../../outlook";
import type { SendEmailConfig, SendResult } from "./types";
import { prepareTrackedEmail, finalizeTracking } from "./prepare";

export async function sendTrackedEmail(config: SendEmailConfig): Promise<SendResult> {
  const provider = config.provider || 'gmail';
  try {
    const trackingResult = await prepareTrackedEmail({ contactId: config.contactId, userId: config.userId, subject: config.subject, body: config.body, writingStyle: config.writingStyle, campaignId: config.campaignId, campaignContactId: config.campaignContactId });
    if (!trackingResult.success) throw new Error(trackingResult.error || 'Failed to prepare tracked email');
    let sendResult: { messageId?: string | null; threadId?: string | null };
    if (provider === 'gmail') { sendResult = await gmail.sendEmail(config.userId, config.to, config.subject, trackingResult.trackedBody, { htmlBody: trackingResult.trackedBody, replyTo: config.options?.replyTo, unsubscribeUrl: config.options?.unsubscribeUrl }); }
    else if (provider === 'outlook') { sendResult = await outlook.sendEmail(config.userId, config.to, config.subject, trackingResult.trackedBody, { htmlBody: trackingResult.trackedBody }); }
    else { throw new Error(`Unsupported provider: ${provider}`); }
    if (!sendResult.messageId) throw new Error('Email sent but no message ID returned');
    await finalizeTracking(trackingResult.sentEmailId, sendResult.messageId, sendResult.threadId || sendResult.messageId);
    console.log(`[EmailTracking] Successfully sent tracked email ${trackingResult.sentEmailId} to ${config.to}`);
    return { success: true, sentEmailId: trackingResult.sentEmailId, messageId: sendResult.messageId || undefined, threadId: sendResult.threadId || undefined };
  } catch (error: any) { console.error(`[EmailTracking] Failed to send tracked email to ${config.to}:`, error); return { success: false, sentEmailId: 0, error: error.message }; }
}

export async function sendTrackedReply(config: { userId: number; contactId: number; to: string; subject: string; body: string; threadId: string; messageId?: string; writingStyle?: string; campaignId?: number; provider?: 'gmail' | 'outlook' }): Promise<SendResult> {
  const provider = config.provider || 'gmail';
  try {
    const trackingResult = await prepareTrackedEmail({ contactId: config.contactId, userId: config.userId, subject: config.subject, body: config.body, writingStyle: config.writingStyle, campaignId: config.campaignId, isReply: true, parentThreadId: config.threadId, parentMessageId: config.messageId });
    if (!trackingResult.success) throw new Error(trackingResult.error || 'Failed to prepare tracked reply');
    let sendResult: { messageId?: string | null; threadId?: string | null };
    if (provider === 'gmail') { sendResult = await gmail.sendEmail(config.userId, config.to, config.subject, trackingResult.trackedBody, { htmlBody: trackingResult.trackedBody, threadId: config.threadId, inReplyTo: config.messageId }); }
    else if (provider === 'outlook') { sendResult = await outlook.sendEmail(config.userId, config.to, config.subject, trackingResult.trackedBody, { htmlBody: trackingResult.trackedBody, conversationId: config.threadId }); }
    else { throw new Error(`Unsupported provider: ${provider}`); }
    if (!sendResult.messageId) throw new Error('Reply sent but no message ID returned');
    await finalizeTracking(trackingResult.sentEmailId, sendResult.messageId, sendResult.threadId || config.threadId);
    console.log(`[EmailTracking] Successfully sent tracked reply ${trackingResult.sentEmailId} to ${config.to}`);
    return { success: true, sentEmailId: trackingResult.sentEmailId, messageId: sendResult.messageId || undefined, threadId: sendResult.threadId || config.threadId };
  } catch (error: any) { console.error(`[EmailTracking] Failed to send tracked reply to ${config.to}:`, error); return { success: false, sentEmailId: 0, error: error.message }; }
}
