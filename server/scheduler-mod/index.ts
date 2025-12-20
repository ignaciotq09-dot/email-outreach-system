import type { ScheduledJob, InsertScheduledJob } from "@shared/schema";
import type { JobHandler } from './types';
import { createDefaultHandlers } from './handlers';
import { getPendingJobs, markJobProcessing, markJobCompleted, markJobFailed, scheduleJob, cancelJob, getJobStatus, cleanupOldJobs } from './operations';
export * from './types';

export class JobScheduler {
  private isRunning = false; private checkIntervalMs: number; private jobHandlers: Map<string, JobHandler>;
  constructor(checkIntervalMs: number = 60000) { this.checkIntervalMs = checkIntervalMs; this.jobHandlers = createDefaultHandlers(); }
  registerHandler(jobType: string, handler: JobHandler) { this.jobHandlers.set(jobType, handler); }
  async start() { if (this.isRunning) { console.log("[Scheduler] Already running"); return; } this.isRunning = true; console.log(`[Scheduler] Starting with check interval: ${this.checkIntervalMs}ms`); this.runLoop(); }
  stop() { this.isRunning = false; console.log("[Scheduler] Stopped"); }
  private async runLoop() { while (this.isRunning) { try { await this.processPendingJobs(); } catch (error) { console.error("[Scheduler] Error in run loop:", error); } await this.sleep(this.checkIntervalMs); } }
  private async processPendingJobs() { const jobs = await getPendingJobs(); for (const job of jobs) { await this.executeJob(job); } }
  private async executeJob(job: ScheduledJob) { try { await markJobProcessing(job.id, job.attempts || 0); const handler = this.jobHandlers.get(job.jobType); if (!handler) throw new Error(`No handler registered for job type: ${job.jobType}`); await handler(job); await markJobCompleted(job.id); } catch (error: any) { console.error(`[Scheduler] Job ${job.id} failed:`, error); await markJobFailed(job.id, error.message, (job.attempts || 0) + 1, job.maxAttempts || 3); } }
  private sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
  static scheduleJob = scheduleJob; static cancelJob = cancelJob; static getJobStatus = getJobStatus; static cleanupOldJobs = cleanupOldJobs;
}

export const jobScheduler = new JobScheduler();
