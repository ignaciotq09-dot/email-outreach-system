/**
 * Email & SMS Archival Scheduler
 * 
 * Runs the archival jobs daily at 2 AM to archive old emails and SMS
 * and keep the Sent tab fast (only 100 recent items per user).
 */

import { archiveOldEmails } from "./email-archival";
import { archiveOldSms } from "./sms-archival";

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
 * Run both email and SMS archival jobs and schedule next run
 */
async function runArchivalJob() {
    console.log("[ArchivalScheduler] Running scheduled archival jobs...");

    // Run Email Archival
    try {
        const emailResult = await archiveOldEmails();
        console.log(`[ArchivalScheduler] Emails: ${emailResult.usersProcessed} users, ${emailResult.emailsArchived} archived`);
    } catch (error) {
        console.error("[ArchivalScheduler] Email archival failed:", error);
    }

    // Run SMS Archival
    try {
        const smsResult = await archiveOldSms();
        console.log(`[ArchivalScheduler] SMS: ${smsResult.usersProcessed} users, ${smsResult.smsArchived} archived`);
    } catch (error) {
        console.error("[ArchivalScheduler] SMS archival failed:", error);
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
