import type { EmailProvider } from "../types";
import { runHourlyReconciliation, runNightlyReconciliation } from "./runners";

class ReconciliationService {
  private hourlyTimer: NodeJS.Timeout | null = null;
  private nightlyTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(userId: number, provider: EmailProvider): Promise<void> {
    if (this.isRunning) { console.log('[Reconciliation] Service already running'); return; }
    this.isRunning = true; console.log('[Reconciliation] Starting reconciliation service');
    await runHourlyReconciliation(userId, provider);
    this.hourlyTimer = setInterval(async () => { try { await runHourlyReconciliation(userId, provider); } catch (error) { console.error('[Reconciliation] Hourly check failed:', error); } }, 60 * 60 * 1000);
    const scheduleNightly = () => {
      const now = new Date(); const next2AM = new Date(now); next2AM.setHours(2, 0, 0, 0);
      if (next2AM <= now) next2AM.setDate(next2AM.getDate() + 1);
      const msUntil2AM = next2AM.getTime() - now.getTime();
      this.nightlyTimer = setTimeout(async () => { try { await runNightlyReconciliation(userId, provider); } catch (error) { console.error('[Reconciliation] Nightly check failed:', error); } scheduleNightly(); }, msUntil2AM);
      console.log(`[Reconciliation] Nightly sweep scheduled for ${next2AM.toISOString()}`);
    };
    scheduleNightly(); console.log('[Reconciliation] Service started - hourly checks every hour, nightly at 2 AM');
  }

  stop(): void { if (this.hourlyTimer) { clearInterval(this.hourlyTimer); this.hourlyTimer = null; } if (this.nightlyTimer) { clearTimeout(this.nightlyTimer); this.nightlyTimer = null; } this.isRunning = false; console.log('[Reconciliation] Service stopped'); }
  isServiceRunning(): boolean { return this.isRunning; }
}

export const reconciliationService = new ReconciliationService();
