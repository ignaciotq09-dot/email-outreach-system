import { getDueSends, getRetryableSends } from "./job-queue";
import { processBatch } from "./processor";
import type { ScheduledSendWithContext } from "./types";

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

const POLL_INTERVAL = 60 * 1000;
const BATCH_SIZE = 20;

let sendEmailFn: ((params: {
  userId: number;
  contactId: number;
  to: string;
  subject: string;
  body: string;
}) => Promise<{ messageId: string; threadId: string }>) | null = null;

export function setSendEmailFunction(fn: typeof sendEmailFn): void {
  sendEmailFn = fn;
  console.log("[ScheduledSendEngine] Email send function registered");
}

async function processQueue(): Promise<void> {
  if (!sendEmailFn) {
    console.log("[ScheduledSendEngine] No email send function registered, skipping");
    return;
  }

  try {
    const dueSends = await getDueSends(BATCH_SIZE);
    
    if (dueSends.length > 0) {
      console.log(`[ScheduledSendEngine] Processing ${dueSends.length} due sends`);
      await processBatch(dueSends, sendEmailFn);
    }

    const retryableSends = await getRetryableSends(10);
    
    if (retryableSends.length > 0) {
      console.log(`[ScheduledSendEngine] Retrying ${retryableSends.length} failed sends`);
      await processBatch(retryableSends, sendEmailFn);
    }

  } catch (error: any) {
    console.error("[ScheduledSendEngine] Queue processing error:", error.message);
  }
}

export function startEngine(): void {
  if (isRunning) {
    console.log("[ScheduledSendEngine] Already running");
    return;
  }

  isRunning = true;
  console.log("[ScheduledSendEngine] Starting scheduled send engine");

  processQueue().catch(console.error);

  intervalId = setInterval(() => {
    processQueue().catch(console.error);
  }, POLL_INTERVAL);

  console.log(`[ScheduledSendEngine] Polling every ${POLL_INTERVAL / 1000}s`);
}

export function stopEngine(): void {
  if (!isRunning) return;

  isRunning = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  console.log("[ScheduledSendEngine] Engine stopped");
}

export function isEngineRunning(): boolean {
  return isRunning;
}

export async function triggerImmediateProcess(): Promise<void> {
  console.log("[ScheduledSendEngine] Manual trigger requested");
  await processQueue();
}
