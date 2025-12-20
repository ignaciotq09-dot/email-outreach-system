// User-based email service that routes to Gmail or Outlook based on user's emailProvider
import * as gmail from './gmail';
import * as outlook from './outlook';
import type { User } from '@shared/schema';

export type EmailProvider = 'gmail' | 'outlook';

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

export class UserEmailService {
  constructor(
    private _provider: EmailProvider,
    private _userId: number
  ) {}
  
  get provider(): EmailProvider {
    return this._provider;
  }
  
  get userId(): number {
    return this._userId;
  }

  async getUserEmail(): Promise<string | null> {
    switch (this.provider) {
      case 'gmail':
        return await gmail.getGmailUserEmail(this.userId);
      case 'outlook':
        return await outlook.getOutlookUserEmail(this.userId);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: EmailOptions
  ) {
    switch (this.provider) {
      case 'gmail':
        return await gmail.sendEmail(this.userId, to, subject, body, options);
      case 'outlook':
        return await outlook.sendEmail(this.userId, to, subject, body, options);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  async sendReplyInThread(
    threadId: string,
    to: string,
    subject: string,
    body: string,
    options?: ThreadReplyOptions
  ) {
    switch (this.provider) {
      case 'gmail':
        return await gmail.sendReplyInThread(this.userId, threadId, to, subject, body, options);
      case 'outlook':
        return await outlook.sendReplyInThread(this.userId, threadId, to, subject, body, options);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  async checkInboxForContactEmails(
    contactEmail: string,
    afterDate?: Date,
    originalSubject?: string
  ) {
    switch (this.provider) {
      case 'gmail':
        return await gmail.checkInboxForContactEmails(this.userId, contactEmail, afterDate, originalSubject);
      case 'outlook':
        return await outlook.checkInboxForContactEmails(this.userId, contactEmail, afterDate, originalSubject);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  async checkThreadForReplies(
    threadId: string,
    originalMessageId: string
  ) {
    switch (this.provider) {
      case 'gmail':
        return await gmail.checkThreadForReplies(this.userId, threadId, originalMessageId);
      case 'outlook':
        return await outlook.checkThreadForReplies(this.userId, threadId, originalMessageId);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const email = await this.getUserEmail();
      return email !== null && email !== undefined && email.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Factory function to create email service based on user's provider
export function getUserEmailService(user: User): UserEmailService {
  const provider = (user.emailProvider || 'gmail') as EmailProvider;
  return new UserEmailService(provider, user.id);
}

// Helper to check if a provider is connected (for Replit Connectors)
export async function isProviderConnected(userId: number, provider: EmailProvider): Promise<boolean> {
  const service = new UserEmailService(provider, userId);
  return await service.isConnected();
}
