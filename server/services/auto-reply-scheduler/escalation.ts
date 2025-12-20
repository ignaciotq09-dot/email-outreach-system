import { db } from "../../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { autoReplyLogs } from "@shared/schema";
import { MAX_RETRY_ATTEMPTS } from "./constants";

export async function escalateExhaustedRetries(userId: number): Promise<number> {
  const failedReplies = await db.execute(sql`SELECT reply_id, COUNT(*) as attempt_count, MAX(sent_at) as last_attempt FROM auto_reply_logs WHERE user_id = ${userId} AND status IN ('error', 'send_failed') GROUP BY reply_id HAVING COUNT(*) >= ${MAX_RETRY_ATTEMPTS}`);
  let escalated = 0;
  for (const row of failedReplies.rows as any[]) {
    const existingEscalation = await db.select({ id: autoReplyLogs.id }).from(autoReplyLogs).where(and(eq(autoReplyLogs.userId, userId), eq(autoReplyLogs.replyId, row.reply_id), eq(autoReplyLogs.status, 'exhausted'))).limit(1);
    if (existingEscalation.length === 0) {
      await db.insert(autoReplyLogs).values({ userId, replyId: row.reply_id, contactId: 0, originalReplyContent: 'Retries exhausted', intentConfidence: 0, intentType: 'exhausted', autoReplyContent: null, status: 'exhausted', errorMessage: `Failed after ${MAX_RETRY_ATTEMPTS} attempts` });
      escalated++;
      console.log(`[AutoReplyScheduler] User ${userId}: Reply ${row.reply_id} escalated to 'exhausted' after ${MAX_RETRY_ATTEMPTS} attempts`);
    }
  }
  return escalated;
}
