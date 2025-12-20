export interface TrackingConfig {
  contactId: number;
  subject: string;
  body: string;
  writingStyle?: string;
  campaignId?: number;
  campaignContactId?: number;
  userId: number;
  isReply?: boolean;
  parentThreadId?: string;
  parentMessageId?: string;
}

export interface TrackedEmail {
  sentEmailId: number;
  trackedBody: string;
  trackingEnabled: boolean;
  baseUrl: string;
}

export interface TrackingResult {
  success: boolean;
  sentEmailId: number;
  trackedBody: string;
  trackingEnabled: boolean;
  error?: string;
}

export interface SendEmailConfig {
  userId: number;
  contactId: number;
  to: string;
  subject: string;
  body: string;
  writingStyle?: string;
  campaignId?: number;
  campaignContactId?: number;
  provider?: 'gmail' | 'outlook';
  options?: { htmlBody?: string; replyTo?: string; unsubscribeUrl?: string };
}

export interface SendResult { success: boolean; sentEmailId: number; messageId?: string; threadId?: string; error?: string }
