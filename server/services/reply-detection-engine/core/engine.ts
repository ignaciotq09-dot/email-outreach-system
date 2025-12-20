import { ENGINE_CONFIG, type DetectionProvider } from "../types";
import { startScheduler as startBulletproofScheduler, stopScheduler as stopBulletproofScheduler } from "../../reply-detection/scheduler";
import { getActiveEmailUsers } from "./bootstrap";
import { syncPendingJobsForUser } from "./sync-jobs";
import { processQueuedJobs, processRetryQueue, type ProcessingState } from "./processing";
import { startHourlyReconciliation, startNightlyReconciliation, clearUserTimers, type UserState } from "./user-timers";

class ReplyDetectionEngine {
  private isRunning = false; private processingTimer: NodeJS.Timeout | null = null; private isBootstrapped = false;
  private processingState: ProcessingState = { processingCount: 0, maxConcurrent: ENGINE_CONFIG.maxConcurrentJobs, perUserProcessingCount: new Map(), maxPerUserConcurrent: 3 };
  private activeUsers: Map<number, UserState> = new Map();

  async bootstrap(): Promise<void> {
    if (this.isBootstrapped) { console.log("[ReplyDetectionEngine] Already bootstrapped, skipping"); return; }
    console.log("[ReplyDetectionEngine] Bootstrapping active users from database...");
    try { const users = await getActiveEmailUsers(); for (const { userId, provider } of users) await this.start(userId, provider); this.isBootstrapped = true; console.log("[ReplyDetectionEngine] Bootstrap complete"); }
    catch (error) { console.error("[ReplyDetectionEngine] Bootstrap failed:", error); }
  }

  async start(userId: number, provider: DetectionProvider): Promise<void> {
    const existing = this.activeUsers.get(userId);
    if (existing) { existing.provider = provider; return; }
    const userState: UserState = { provider, hourlyTimer: null, nightlyTimeout: null };
    this.activeUsers.set(userId, userState);
    console.log(`[ReplyDetectionEngine] User ${userId} registered with provider: ${provider}`);
    await syncPendingJobsForUser(userId, provider);
    startHourlyReconciliation(userId, provider, userState);
    startNightlyReconciliation(userId, provider, userState, this.activeUsers);
    if (!this.isRunning) this.startGlobal();
  }

  private startGlobal(): void {
    this.isRunning = true; startBulletproofScheduler();
    this.processingTimer = setInterval(async () => { if (!this.isRunning) return; try { await processQueuedJobs(this.processingState); await processRetryQueue(); } catch (error) { console.error("[ReplyDetectionEngine] Processing loop error:", error); } }, ENGINE_CONFIG.processingIntervalMs);
    processQueuedJobs(this.processingState);
  }

  stopUser(userId: number): void {
    const userState = this.activeUsers.get(userId);
    if (userState) clearUserTimers(userState);
    this.activeUsers.delete(userId);
    console.log(`[ReplyDetectionEngine] User ${userId} removed from active users`);
    if (this.activeUsers.size === 0) this.stop();
  }

  stop(): void {
    console.log("[ReplyDetectionEngine] Stopping global processor...");
    this.isRunning = false;
    this.activeUsers.forEach((userState, userId) => { clearUserTimers(userState); console.log(`[ReplyDetectionEngine] Cleared timers for user ${userId}`); });
    this.activeUsers.clear();
    if (this.processingTimer) { clearInterval(this.processingTimer); this.processingTimer = null; }
    stopBulletproofScheduler();
    console.log("[ReplyDetectionEngine] Stopped");
  }

  isActive(): boolean { return this.isRunning; }
  getActiveUserCount(): number { return this.activeUsers.size; }
  hasUser(userId: number): boolean { return this.activeUsers.has(userId); }
}

export const replyDetectionEngine = new ReplyDetectionEngine();
