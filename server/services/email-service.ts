// Unified email service that routes to Gmail, Outlook, or Yahoo based on app-level configuration
import * as gmail from '../gmail';
import * as outlook from '../outlook';
import * as yahoo from '../yahoo';
import { getEmailProvider } from '../email-config';

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo';

export interface EmailOptions {
  htmlBody?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
}

export interface ThreadReplyOptions {
  htmlBody?: string;
  messageId?: string;
  replyTo?: string;
}

// Get email address from the currently configured provider
export async function getUserEmail(userId: number): Promise<string | null> {
  const provider = getEmailProvider();
  switch (provider) {
    case 'gmail':
      const gmailEmail = await gmail.getGmailUserEmail(userId);
      return gmailEmail ?? null;
    case 'outlook':
      const outlookEmail = await outlook.getOutlookUserEmail(userId);
      return outlookEmail ?? null;
    case 'yahoo':
      const yahooEmail = await yahoo.getYahooUserEmail(userId);
      return yahooEmail ?? null;
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// Send email using the configured provider
export async function sendEmail(
  userId: number,
  to: string,
  subject: string,
  body: string,
  options?: EmailOptions
) {
  const provider = getEmailProvider();
  switch (provider) {
    case 'gmail':
      return gmail.sendEmail(userId, to, subject, body, options);
    case 'outlook':
      return outlook.sendEmail(userId, to, subject, body, options);
    case 'yahoo':
      return yahoo.sendEmail(userId, to, subject, body, options);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// Send reply in thread using the configured provider
export async function sendReplyInThread(
  userId: number,
  threadId: string,
  to: string,
  subject: string,
  body: string,
  options?: ThreadReplyOptions
) {
  const provider = getEmailProvider();
  switch (provider) {
    case 'gmail':
      return gmail.sendReplyInThread(userId, threadId, to, subject, body, options);
    case 'outlook':
      return outlook.sendReply(userId, to, subject, body, threadId, options);
    case 'yahoo':
      return yahoo.sendReply(userId, to, subject, body, threadId, options);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// Check inbox for contact emails using the configured provider
export async function checkInboxForContactEmails(
  userId: number,
  contactEmail: string,
  afterDate?: Date,
  originalSubject?: string
) {
  const provider = getEmailProvider();
  switch (provider) {
    case 'gmail':
      return gmail.checkInboxForContactEmails(userId, contactEmail, afterDate, originalSubject);
    case 'outlook':
      return outlook.checkInboxForContactEmails(userId, contactEmail, afterDate, originalSubject);
    case 'yahoo':
      return yahoo.checkInboxForContactEmails(userId, contactEmail, afterDate, originalSubject);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// Check thread for replies using the configured provider
export async function checkThreadForReplies(
  userId: number,
  threadId: string,
  originalMessageId: string
) {
  const provider = getEmailProvider();
  switch (provider) {
    case 'gmail':
      return gmail.checkThreadForReplies(userId, threadId, originalMessageId);
    case 'outlook':
      return outlook.checkThreadForReplies(userId, threadId, originalMessageId);
    case 'yahoo':
      return yahoo.checkThreadForReplies(userId, threadId, originalMessageId);
    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

// Check if currently configured provider is connected (via Replit Connectors)
export async function isProviderConnected(userId: number): Promise<boolean> {
  try {
    const email = await getUserEmail(userId);
    return email !== null && email !== undefined && email.length > 0;
  } catch (error) {
    return false;
  }
}
