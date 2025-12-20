import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getAccessToken, getYahooUserEmail } from './tokens';

async function createSMTPTransporter(userId: number): Promise<Transporter> {
  const accessToken = await getAccessToken(userId); const fromEmail = await getYahooUserEmail(userId); if (!fromEmail) throw new Error('Could not determine Yahoo email address');
  return nodemailer.createTransport({ host: 'smtp.mail.yahoo.com', port: 465, secure: true, auth: { type: 'OAuth2', user: fromEmail, accessToken: accessToken } });
}

export async function sendEmail(userId: number, to: string, subject: string, body: string, options?: { htmlBody?: string; replyTo?: string; unsubscribeUrl?: string }) {
  const transporter = await createSMTPTransporter(userId); const fromEmail = await getYahooUserEmail(userId); if (!fromEmail) throw new Error('Could not determine Yahoo email address');
  const mailOptions: any = { from: fromEmail, to, subject, text: body }; if (options?.htmlBody) mailOptions.html = options.htmlBody; if (options?.replyTo) mailOptions.replyTo = options.replyTo; if (options?.unsubscribeUrl) mailOptions.headers = { 'List-Unsubscribe': `<${options.unsubscribeUrl}>` };
  const result = await transporter.sendMail(mailOptions); return { messageId: result.messageId || 'unknown', threadId: result.messageId || 'unknown' };
}

export async function sendReply(userId: number, to: string, subject: string, body: string, threadId: string, options?: { htmlBody?: string; replyTo?: string; messageId?: string }) {
  const transporter = await createSMTPTransporter(userId); const fromEmail = await getYahooUserEmail(userId); if (!fromEmail) throw new Error('Could not determine Yahoo email address');
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`; const originalMessageId = options?.messageId || threadId;
  const mailOptions: any = { from: fromEmail, to, subject: replySubject, text: body, inReplyTo: originalMessageId, references: originalMessageId }; if (options?.htmlBody) mailOptions.html = options.htmlBody; if (options?.replyTo) mailOptions.replyTo = options.replyTo;
  const result = await transporter.sendMail(mailOptions); return { messageId: result.messageId || 'unknown', threadId: threadId };
}
