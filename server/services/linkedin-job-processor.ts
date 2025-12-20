import { LinkedInJobOrchestrator } from "./linkedin-job-orchestrator";

const PROCESS_INTERVAL = 60 * 1000;
const POLL_INTERVAL = 5 * 60 * 1000;
const RETRY_INTERVAL = 2 * 60 * 1000;

let isRunning = false;
let processTimer: NodeJS.Timeout | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let retryTimer: NodeJS.Timeout | null = null;

export class LinkedInJobProcessor {
  
  static start(): void {
    if (isRunning) {
      console.log('[LinkedInJobProcessor] Already running');
      return;
    }
    
    isRunning = true;
    console.log('[LinkedInJobProcessor] Starting LinkedIn job processor...');
    
    processTimer = setInterval(async () => {
      await this.processPendingJobs();
    }, PROCESS_INTERVAL);
    
    pollTimer = setInterval(async () => {
      await this.pollQueuedJobs();
    }, POLL_INTERVAL);
    
    retryTimer = setInterval(async () => {
      await this.processRetryQueue();
    }, RETRY_INTERVAL);
    
    setTimeout(() => {
      this.processPendingJobs();
      this.pollQueuedJobs();
    }, 5000);
    
    console.log('[LinkedInJobProcessor] LinkedIn job processor started');
  }
  
  static stop(): void {
    if (!isRunning) {
      return;
    }
    
    isRunning = false;
    
    if (processTimer) {
      clearInterval(processTimer);
      processTimer = null;
    }
    
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    
    console.log('[LinkedInJobProcessor] LinkedIn job processor stopped');
  }
  
  private static async processPendingJobs(): Promise<void> {
    try {
      const processed = await LinkedInJobOrchestrator.processPendingJobs();
      if (processed > 0) {
        console.log(`[LinkedInJobProcessor] Processed ${processed} pending jobs`);
      }
    } catch (error) {
      console.error('[LinkedInJobProcessor] Error processing pending jobs:', error);
    }
  }
  
  private static async pollQueuedJobs(): Promise<void> {
    try {
      const polled = await LinkedInJobOrchestrator.pollPendingJobs();
      if (polled > 0) {
        console.log(`[LinkedInJobProcessor] Polled ${polled} queued jobs for status updates`);
      }
    } catch (error) {
      console.error('[LinkedInJobProcessor] Error polling queued jobs:', error);
    }
  }
  
  private static async processRetryQueue(): Promise<void> {
    try {
      const retried = await LinkedInJobOrchestrator.processRetryQueue();
      if (retried > 0) {
        console.log(`[LinkedInJobProcessor] Processed ${retried} retry jobs`);
      }
    } catch (error) {
      console.error('[LinkedInJobProcessor] Error processing retry queue:', error);
    }
  }
  
  static isProcessorRunning(): boolean {
    return isRunning;
  }
}
