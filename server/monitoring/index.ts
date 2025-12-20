import { scanForReplies } from "./scanner";
import type { MonitoringResult } from "./types";

export class EmailMonitoringService {
  private isRunning = false; private intervalId: NodeJS.Timeout | null = null;
  async start() { if (this.isRunning) { console.log('[Monitor] Service already running'); return; } console.log('[Monitor] Starting email monitoring service'); this.isRunning = true; await scanForReplies(); this.intervalId = setInterval(async () => { try { await scanForReplies(); } catch (error) { console.error('[Monitor] Error in scheduled scan:', error); } }, 30 * 60 * 1000); console.log('[Monitor] Service started - scanning every 30 minutes'); }
  stop() { if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } this.isRunning = false; console.log('[Monitor] Service stopped'); }
  async scanForReplies(): Promise<MonitoringResult> { return scanForReplies(); }
}

export const monitoringService = new EmailMonitoringService();
export type { MonitoringResult };
