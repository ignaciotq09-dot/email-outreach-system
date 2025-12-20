export interface AutoReplyLog {
  id: number;
  contactId: number;
  intentConfidence: number;
  intentType: string;
  status: string;
  sentAt: string;
}

export interface GmailStatus {
  connected: boolean;
  hasCustomOAuth: boolean;
  email: string | null;
  hasRefreshToken?: boolean;
}

export interface ProviderStatus {
  connected: boolean;
  email: string | null;
}

export interface Preferences {
  senderName: string | null;
  senderPhone: string | null;
  tone?: string;
  length?: string;
  styleNotes?: string | null;
}

export interface SmsConfig {
  configured: boolean;
  userPhoneNumber: string | null;
}

export interface SmsSettings {
  twilioPhoneNumber: string | null;
  enabled: number;
}

export interface AutoReplySettings {
  enabled: boolean;
  bookingLink: string | null;
  customMessage: string | null;
}

export interface NotificationSettings {
  phone: string | null;
  email: string | null;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

export interface PhantombusterStatus {
  connected: boolean;
  hasAutoConnectAgent: boolean;
  hasMessageSenderAgent: boolean;
}

export interface ExtensionStatus {
  connected: boolean;
  lastVerified?: string | null;
  cookiesUpdatedAt?: string | null;
}

export interface LinkedinStatus {
  connected: boolean;
  profileUrl?: string | null;
  displayName?: string | null;
  dailyConnectionLimit?: number;
  dailyMessageLimit?: number;
  connectionsSentToday?: number;
  messagesSentToday?: number;
}

export interface SettingsState {
  checkInterval: string;
  senderName: string;
  senderPhone: string;
  twilioPhoneNumber: string;
  autoReplyEnabled: boolean;
  bookingLink: string;
  customAutoReplyMessage: string;
  notificationPhone: string;
  linkedinProfileUrl: string;
  linkedinDisplayName: string;
  linkedinDailyConnectionLimit: number;
  linkedinDailyMessageLimit: number;
  phantombusterApiKey: string;
  phantombusterAutoConnectAgentId: string;
  phantombusterMessageSenderAgentId: string;
  isVerifyingPhantombuster: boolean;
  extensionToken: string;
  showExtensionToken: boolean;
}
