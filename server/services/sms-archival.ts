/**
 * SMS Archival Service
 * 
 * Automatically archives older sent SMS to keep the main "Sent" tab fast.
 * Each user keeps their 100 most recent SMS as non-archived.
 * Archived SMS are still accessible via a separate endpoint.
 */

import { db } from "../db";
import { sentSms } from "@shared/schema";
import { eq, and, lt, desc, sql } from "drizzle-orm";

const SMS_TO_KEEP = 100;

/**
 * Archive old SMS for all users
 * Keeps only the newest 100 SMS as non-archived per user
 */
export async function archiveOldSms(): Promise<{ usersProcessed: number; smsArchived: number }> {
    console.log("[SmsArchival] Starting archival job...");

    let usersProcessed = 0;
    let smsArchived = 0;

    // Get all unique user IDs with sent SMS
    const usersWithSms = await db
        .selectDistinct({ userId: sentSms.userId })
        .from(sentSms)
        .where(eq(sentSms.archived, false));

    for (const { userId } of usersWithSms) {
        if (!userId) continue;

        try {
            // Get the 100th newest SMS's date (the cutoff point)
            const [cutoffSms] = await db
                .select({ sentAt: sentSms.sentAt })
                .from(sentSms)
                .where(and(
                    eq(sentSms.userId, userId),
                    eq(sentSms.archived, false)
                ))
                .orderBy(desc(sentSms.sentAt))
                .offset(SMS_TO_KEEP)
                .limit(1);

            if (cutoffSms && cutoffSms.sentAt) {
                // Archive SMS older than the cutoff
                const result = await db
                    .update(sentSms)
                    .set({
                        archived: true,
                        archivedAt: new Date()
                    })
                    .where(and(
                        eq(sentSms.userId, userId),
                        lt(sentSms.sentAt, cutoffSms.sentAt),
                        eq(sentSms.archived, false)
                    ));

                // Count affected rows
                const archivedCount = (result as any)?.rowCount || 0;
                smsArchived += archivedCount;

                if (archivedCount > 0) {
                    console.log(`[SmsArchival] Archived ${archivedCount} SMS for user ${userId}`);
                }
            }

            usersProcessed++;
        } catch (error) {
            console.error(`[SmsArchival] Error processing user ${userId}:`, error);
        }
    }

    console.log(`[SmsArchival] Completed: ${usersProcessed} users, ${smsArchived} SMS archived`);
    return { usersProcessed, smsArchived };
}

/**
 * Get non-archived SMS for a user (for the main Sent tab)
 */
export async function getRecentSentSms(userId: number, limit: number = 100) {
    return db
        .select()
        .from(sentSms)
        .where(and(
            eq(sentSms.userId, userId),
            eq(sentSms.archived, false)
        ))
        .orderBy(desc(sentSms.sentAt))
        .limit(limit);
}

/**
 * Get archived SMS for a user with pagination
 */
export async function getArchivedSms(userId: number, page: number = 0, pageSize: number = 50) {
    return db
        .select()
        .from(sentSms)
        .where(and(
            eq(sentSms.userId, userId),
            eq(sentSms.archived, true)
        ))
        .orderBy(desc(sentSms.sentAt))
        .limit(pageSize)
        .offset(page * pageSize);
}

/**
 * Get total count of archived SMS for a user
 */
export async function getArchivedSmsCount(userId: number): Promise<number> {
    const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(sentSms)
        .where(and(
            eq(sentSms.userId, userId),
            eq(sentSms.archived, true)
        ));

    return Number(result[0]?.count || 0);
}

/**
 * Unarchive a specific SMS (restore to main view)
 */
export async function unarchiveSms(userId: number, smsId: number): Promise<boolean> {
    const result = await db
        .update(sentSms)
        .set({
            archived: false,
            archivedAt: null
        })
        .where(and(
            eq(sentSms.id, smsId),
            eq(sentSms.userId, userId)
        ));

    return (result as any)?.rowCount > 0;
}
