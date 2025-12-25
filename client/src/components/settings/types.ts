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

export interface SettingsState {
  checkInterval: string;
  senderName: string;
  senderPhone: string;
  twilioPhoneNumber: string;
  autoReplyEnabled: boolean;
  bookingLink: string;
  customAutoReplyMessage: string;
  notificationPhone: string;
}
