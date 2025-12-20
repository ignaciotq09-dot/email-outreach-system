export interface PendingUserInfo {
  name: string;
  companyName: string;
  position: string | null;
  provider: 'gmail' | 'outlook';
  timestamp: number;
  expiresAt: number;
  state: string;
}

export interface SessionData {
  userId?: number;
  pendingUserInfo?: PendingUserInfo;
  csrfToken?: string;
}
