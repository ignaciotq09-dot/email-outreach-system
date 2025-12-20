import { getUserEmailService } from "../../../user-email-service";
import type { SendResult, FollowUpJobWithContext } from '../types';

export async function sendFollowUpEmail(user: any, job: FollowUpJobWithContext, subject: string, body: string): Promise<SendResult> {
  const startTime = Date.now(); try { const emailService = getUserEmailService(user); const threadId = job.originalEmail?.gmailThreadId || ''; const contactEmail = job.contact?.email; if (!contactEmail) return { success: false, errorMessage: 'No contact email', retryable: false }; const result = await emailService.sendReplyInThread(threadId, contactEmail, subject, body); return { success: true, messageId: result.messageId, threadId: result.threadId || threadId, responseTime: Date.now() - startTime }; } catch (error: any) { const errorMessage = error?.message || 'Send failed'; const errorCode = error?.code?.toString(); const isRetryable = !(errorCode === '400' || errorCode === '403' || errorMessage.includes('invalid') || errorMessage.includes('blocked') || errorMessage.includes('suspended')); return { success: false, errorCode, errorMessage, responseTime: Date.now() - startTime, retryable: isRetryable }; }
}
