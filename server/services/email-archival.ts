/**
 * Email Archival Service
 * 
 * Automatically archives older sent emails to keep the main "Sent" tab fast.
 * Each user keeps their 100 most recent emails as non-archived.
 * Archived emails are still accessible via a separate endpoint.
 */

import { db } from "../db";
import { sentEmails } from "@shared/schema";
import { eq, and, lt, desc, sql } from "drizzle-orm";

const EMAILS_TO_KEEP = 100;

/**
 * Archive old emails for all users
 * Keeps only the newest 100 emails as non-archived per user
 */
export async function archiveOldEmails(): Promise<{ usersProcessed: number; emailsArchived: number }> {
    console.log("[EmailArchival] Starting archival job...");

    let usersProcessed = 0;
    let emailsArchived = 0;

    // Get all unique user IDs with sent emails
    const usersWithEmails = await db
        .selectDistinct({ userId: sentEmails.userId })
        .from(sentEmails)
        .where(eq(sentEmails.archived, false));

    for (const { userId } of usersWithEmails) {
        if (!userId) continue;

        try {
            // Get the 100th newest email's date (the cutoff point)
            const [cutoffEmail] = await db
                .select({ sentAt: sentEmails.sentAt })
                .from(sentEmails)
                .where(and(
                    eq(sentEmails.userId, userId),
                    eq(sentEmails.archived, false)
                ))
                .orderBy(desc(sentEmails.sentAt))
                .offset(EMAILS_TO_KEEP)
                .limit(1);

            if (cutoffEmail && cutoffEmail.sentAt) {
                // Archive emails older than the cutoff
                const result = await db
                    .update(sentEmails)
                    .set({
                        archived: true,
                        archivedAt: new Date()
                    })
                    .where(and(
                        eq(sentEmails.userId, userId),
                        lt(sentEmails.sentAt, cutoffEmail.sentAt),
                        eq(sentEmails.archived, false)
                    ));

                // Count affected rows (Drizzle returns the result)
                const archivedCount = (result as any)?.rowCount || 0;
                emailsArchived += archivedCount;

                if (archivedCount > 0) {
                    console.log(`[EmailArchival] Archived ${archivedCount} emails for user ${userId}`);
                }
            }

            usersProcessed++;
        } catch (error) {
            console.error(`[EmailArchival] Error processing user ${userId}:`, error);
        }
    }

    console.log(`[EmailArchival] Completed: ${usersProcessed} users, ${emailsArchived} emails archived`);
    return { usersProcessed, emailsArchived };
}

/**
 * Get non-archived emails for a user (for the main Sent tab)
 */
export async function getRecentSentEmails(userId: number, limit: number = 100) {
    return db
        .select()
        .from(sentEmails)
        .where(and(
            eq(sentEmails.userId, userId),
            eq(sentEmails.archived, false)
        ))
        .orderBy(desc(sentEmails.sentAt))
        .limit(limit);
}

/**
 * Get archived emails for a user with pagination
 */
export async function getArchivedEmails(userId: number, page: number = 0, pageSize: number = 50) {
    return db
        .select()
        .from(sentEmails)
        .where(and(
            eq(sentEmails.userId, userId),
            eq(sentEmails.archived, true)
        ))
        .orderBy(desc(sentEmails.sentAt))
        .limit(pageSize)
        .offset(page * pageSize);
}

/**
 * Get total count of archived emails for a user
 */
export async function getArchivedEmailsCount(userId: number): Promise<number> {
    const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(sentEmails)
        .where(and(
            eq(sentEmails.userId, userId),
            eq(sentEmails.archived, true)
        ));

    return Number(result[0]?.count || 0);
}

/**
 * Unarchive a specific email (restore to main view)
 */
export async function unarchiveEmail(userId: number, emailId: number): Promise<boolean> {
    const result = await db
        .update(sentEmails)
        .set({
            archived: false,
            archivedAt: null
        })
        .where(and(
            eq(sentEmails.id, emailId),
            eq(sentEmails.userId, userId)
        ));

    return (result as any)?.rowCount > 0;
}
