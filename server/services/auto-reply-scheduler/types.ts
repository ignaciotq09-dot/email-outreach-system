export interface SchedulerState { isRunning: boolean; intervalId?: NodeJS.Timeout; lastRun?: Date; }
export type ProcessingStatus = { status: string | null; attemptCount: number; lastAttempt: Date | null; };
export interface ProcessDecision { shouldProcess: boolean; reason: 'new' | 'retry' | 'terminal' | 'max_retries' | 'backoff_pending' | 'unknown'; }
export interface ProcessResult { processed: number; autoRepliesSent: number; flaggedForReview: number; retried: number; escalated: number; errors: number; }
