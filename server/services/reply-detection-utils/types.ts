import type { gmail_v1 } from 'googleapis';
export interface ReplyDetectionResult { hasReply: boolean; replyMessageId?: string; replyContent?: string; replyReceivedAt?: Date; sender?: string; isAutoReply?: boolean; }
export interface ThreadCheckOptions { threadId: string; originalMessageId: string; sentAt: Date; recipientEmail: string; }
