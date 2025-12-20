export const MAX_CONNECTION_REQUESTS_PER_DAY = 25;
export const MAX_MESSAGES_PER_DAY = 80;
export const RETRY_DELAYS = [30 * 60 * 1000, 60 * 60 * 1000, 120 * 60 * 1000]; // 30min, 1hr, 2hr

export interface PreflightResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface SendResult {
  success: boolean;
  jobId: number;
  containerId?: string;
  error?: string;
}

export interface JobStats {
  pending: number;
  queued: number;
  processing: number;
  sent: number;
  failed: number;
  deadLetter: number;
  retry: number;
}
