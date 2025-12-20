export interface LinkedInMessageParams {
  userId: number;
  contactId: number;
  campaignId?: number;
  linkedinProfileUrl: string;
  message: string;
  messageType: 'connection_request' | 'direct_message' | 'inmail' | 'follow_up';
}

export interface LinkedInSendResult {
  success: boolean;
  messageId?: number;
  linkedinMessageId?: string;
  error?: string;
}

export interface MessageStats {
  totalSent: number;
  connectionRequests: number;
  directMessages: number;
  accepted: number;
  replied: number;
  pending: number;
  acceptanceRate: number;
  replyRate: number;
}

export interface ConnectionStatus {
  connected: boolean;
  profileUrl?: string | null;
  displayName?: string | null;
  linkedinEmail?: string | null;
  profileImageUrl?: string | null;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  connectionsSentToday?: number;
  messagesSentToday?: number;
}
