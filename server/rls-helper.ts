/**
 * Row-Level Security (RLS) Helper
 * 
 * Provides a helper function to set the current user context for PostgreSQL
 * Row-Level Security policies. This ensures database-level enforcement of
 * multi-tenant data isolation.
 * 
 * Usage:
 *   const emails = await withUserContext(userId, async () => {
 *     return db.select().from(sentEmails).orderBy(desc(sentEmails.sentAt));
 *   });
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Execute a database operation with the current user's context set.
 * This sets a PostgreSQL session variable that RLS policies can use
 * to filter rows based on user_id.
 * 
 * @param userId - The authenticated user's ID
 * @param callback - The database operation to execute
 * @returns The result of the callback function
 * 
 * @example
 * // RLS will automatically filter to only show this user's emails
 * const emails = await withUserContext(userId, async () => {
 *   return db.select().from(sentEmails);
 * });
 */
export async function withUserContext<T>(
    userId: number,
    callback: () => Promise<T>
): Promise<T> {
    // Set the session-local user ID variable for RLS policies
    await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);

    // Execute the callback (all queries will be filtered by RLS)
    return callback();
}

/**
 * Clear the user context (optional, for cleanup)
 */
export async function clearUserContext(): Promise<void> {
    await db.execute(sql`RESET app.current_user_id`);
}

/**
 * Get the current user ID from the session (for debugging)
 */
export async function getCurrentUserContext(): Promise<number | null> {
    try {
        const result = await db.execute(sql`SELECT current_setting('app.current_user_id', TRUE) as user_id`);
        const rows = result as any[];
        const userId = rows[0]?.user_id;
        return userId ? parseInt(userId, 10) : null;
    } catch {
        return null;
    }
}
