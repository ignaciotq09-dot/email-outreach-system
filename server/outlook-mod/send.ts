import { graphApiRequest } from './tokens';

export async function sendEmail(userId: number, to: string, subject: string, body: string, options?: { htmlBody?: string; replyTo?: string; unsubscribeUrl?: string }) {
  const message: any = { subject, body: { contentType: options?.htmlBody ? 'HTML' : 'Text', content: options?.htmlBody || body }, toRecipients: [{ emailAddress: { address: to } }] }; if (options?.replyTo) message.replyTo = [{ emailAddress: { address: options.replyTo } }]; if (options?.unsubscribeUrl) message.internetMessageHeaders = [{ name: 'List-Unsubscribe', value: `<${options.unsubscribeUrl}>` }];
  await graphApiRequest(userId, '/me/sendMail', { method: 'POST', body: JSON.stringify({ message, saveToSentItems: true }) }); return { messageId: `outlook-${Date.now()}`, threadId: `outlook-thread-${Date.now()}` };
}

export async function sendReply(userId: number, to: string, subject: string, body: string, threadId: string, options?: { htmlBody?: string; messageId?: string; replyTo?: string }) {
  if (!options?.messageId) return sendEmail(userId, to, subject, body, options); const comment = options?.htmlBody || body;
  try { await graphApiRequest(userId, `/me/messages/${options.messageId}/reply`, { method: 'POST', body: JSON.stringify({ message: { toRecipients: [{ emailAddress: { address: to } }] }, comment }) }); return { messageId: `outlook-reply-${Date.now()}`, threadId }; } catch (error) { console.error('Error sending reply via Graph API, falling back to regular send:', error); const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`; return sendEmail(userId, to, replySubject, body, options); }
}
