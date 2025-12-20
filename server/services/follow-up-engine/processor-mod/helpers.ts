import type { HealthCheckResult, ProcessingResult } from '../types';

export function createResult(jobId: number, status: 'sent' | 'failed' | 'cancelled', success: boolean, startTime: number, error?: string, healthCheck?: HealthCheckResult): ProcessingResult { return { jobId, status, success, healthCheck, processingTimeMs: Date.now() - startTime, error }; }
