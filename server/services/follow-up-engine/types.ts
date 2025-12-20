import type { FollowUpJob, FollowUpJobAudit, FollowUpDeadLetter } from "@shared/schema";

export type JobStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'dead' | 'cancelled';

export interface HealthCheckResult {
  passed: boolean;
  providerHealthy: boolean;
  tokenValid: boolean;
  errorMessage?: string;
  checkTimeMs?: number;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  errorCode?: string;
  errorMessage?: string;
  responseTime?: number;
  retryable?: boolean;
}

export interface VerificationResult {
  verified: boolean;
  foundInSent: boolean;
  checkCount: number;
  errorMessage?: string;
}

export interface ProcessingResult {
  jobId: number;
  status: JobStatus;
  success: boolean;
  healthCheck?: HealthCheckResult;
  sendResult?: SendResult;
  verification?: VerificationResult;
  processingTimeMs: number;
  error?: string;
}

export interface RetrySchedule {
  attempt: number;
  delayMs: number;
  delayDescription: string;
}

export const RETRY_SCHEDULE: RetrySchedule[] = [
  { attempt: 1, delayMs: 5 * 60 * 1000, delayDescription: '5 minutes' },
  { attempt: 2, delayMs: 30 * 60 * 1000, delayDescription: '30 minutes' },
  { attempt: 3, delayMs: 2 * 60 * 60 * 1000, delayDescription: '2 hours' },
  { attempt: 4, delayMs: 6 * 60 * 60 * 1000, delayDescription: '6 hours' },
  { attempt: 5, delayMs: 24 * 60 * 60 * 1000, delayDescription: '24 hours' },
];

export const MAX_RETRY_ATTEMPTS = RETRY_SCHEDULE.length;

export interface JobQueueStats {
  pending: number;
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  dead: number;
  cancelled: number;
  totalToday: number;
  successRateToday: number;
  avgProcessingTimeMs: number;
}

export interface ReconciliationResult {
  runType: 'hourly' | 'nightly';
  emailsChecked: number;
  missedFollowUpsFound: number;
  jobsCreated: number;
  jobsRetried: number;
  anomaliesLogged: number;
  errors: Array<{ type: string; message: string; context?: any }>;
  durationMs: number;
}

export interface DeadLetterReviewAction {
  action: 'retry' | 'skip' | 'manual_send' | 'cancel';
  notes?: string;
}

export interface FollowUpJobWithContext extends FollowUpJob {
  contact?: {
    id: number;
    email: string;
    name: string | null;
    company: string | null;
    pronoun: string | null;
  };
  originalEmail?: {
    id: number;
    subject: string | null;
    gmailThreadId: string | null;
    gmailMessageId: string | null;
  };
}
