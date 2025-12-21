/**
 * Email Archival Scheduler
 * 
 * Runs the email archival job daily at 2 AM to archive old emails
 * and keep the Sent tab fast (only 100 recent emails per user).
 */

import { archiveOldEmails } from "./email-archival";

let schedulerTimer: NodeJS.Timeout | null = null;
let isRunning = false;

// Run at 2 AM local time
const TARGET_HOUR = 2;
const TARGET_MINUTE = 0;

/**
 * Calculate milliseconds until next 2 AM
 */
function msUntilNextRun(): number {
    const now = new Date();
    const target = new Date(now);

    target.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);

    // If we've passed 2 AM today, schedule for tomorrow
    if (now >= target) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}

/**
 * Run the archival job and schedule next run
 */
async function runArchivalJob() {
    console.log("[EmailArchivalScheduler] Running scheduled archival job...");

    try {
        const result = await archiveOldEmails();
        console.log(`[EmailArchivalScheduler] Completed: ${result.usersProcessed} users, ${result.emailsArchived} emails archived`);
    } catch (error) {
        console.error("[EmailArchivalScheduler] Job failed:", error);
    }

    // Schedule next run for tomorrow at 2 AM
    scheduleNextRun();
}

/**
 * Schedule the next run
 */
function scheduleNextRun() {
    if (!isRunning) return;

    const msUntil = msUntilNextRun();
    const hoursUntil = Math.round(msUntil / (1000 * 60 * 60) * 10) / 10;

    console.log(`[EmailArchivalScheduler] Next run in ${hoursUntil} hours`);

    schedulerTimer = setTimeout(runArchivalJob, msUntil);
}

/**
 * Start the email archival scheduler
 */
export function startEmailArchivalScheduler(): void {
    if (isRunning) {
        console.log("[EmailArchivalScheduler] Already running");
        return;
    }

    isRunning = true;
    console.log("[EmailArchivalScheduler] Starting scheduler (runs daily at 2 AM)");

    scheduleNextRun();
}

/**
 * Stop the email archival scheduler
 */
export function stopEmailArchivalScheduler(): void {
    if (!isRunning) return;

    isRunning = false;

    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }

    console.log("[EmailArchivalScheduler] Stopped");
}

/**
 * Manually trigger the archival job (for testing or admin use)
 */
export async function triggerArchivalJob(): Promise<{ usersProcessed: number; emailsArchived: number }> {
    console.log("[EmailArchivalScheduler] Manually triggered archival job");
    return archiveOldEmails();
}

/**
 * Get scheduler status
 */
export function getArchivalSchedulerStatus(): { isRunning: boolean; nextRunAt: Date | null } {
    if (!isRunning) {
        return { isRunning: false, nextRunAt: null };
    }

    const now = new Date();
    const target = new Date(now);
    target.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);
    if (now >= target) {
        target.setDate(target.getDate() + 1);
    }

    return { isRunning: true, nextRunAt: target };
}
