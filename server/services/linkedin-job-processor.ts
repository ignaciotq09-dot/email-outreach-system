/**
 * LinkedIn Job Processor - Stub
 * This module was referenced in server/index.ts but the implementation file was missing.
 * Creating a stub to allow the server to start.
 */

class LinkedInJobProcessorService {
    private isRunning = false;

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[LinkedInJobProcessor] Service initialized (stub - no actual processing)');
    }

    stop(): void {
        this.isRunning = false;
        console.log('[LinkedInJobProcessor] Service stopped');
    }
}

export const LinkedInJobProcessor = new LinkedInJobProcessorService();
