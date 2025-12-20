import type { ScheduledSend, Contact } from "@shared/schema";

export type ScheduledSendStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface ScheduledSendWithContext extends ScheduledSend {
  contact: {
    id: number;
    email: string;
    name: string;
    company: string | null;
    phone: string | null;
  };
}

export interface ScheduledSendQueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  dueInNextHour: number;
}

export const RETRY_DELAYS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000];
export const MAX_ATTEMPTS = 3;

export interface ProcessResult {
  success: boolean;
  sentEmailId?: number;
  error?: string;
}
