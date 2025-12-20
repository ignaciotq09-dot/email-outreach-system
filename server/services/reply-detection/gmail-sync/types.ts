export interface HistorySyncResult {
  success: boolean;
  messagesProcessed: number;
  repliesFound: number;
  autoRepliesFiltered: number;
  bouncesFiltered: number;
  duplicatesSkipped: number;
  newHistoryId?: string;
  errors: string[];
}

export interface MessageAnalysis {
  isAutoReply: boolean;
  isBounce: boolean;
  isReply: boolean;
  inReplyTo?: string;
  references: string[];
  messageId?: string;
  from: string;
  subject: string;
  content: string;
  receivedAt: Date;
}

export const AUTO_REPLY_HEADERS = ['auto-submitted', 'x-auto-response-suppress', 'x-autoreply', 'x-autorespond', 'precedence'];
export const BOUNCE_INDICATORS = ['mailer-daemon', 'postmaster', 'mail delivery failed', 'undeliverable', 'returned mail', 'delivery status notification'];
