import { db } from "../../../db";
import { eq, desc } from "drizzle-orm";
import { replyDetectionReconciliationRuns } from "@shared/schema";

export async function getReconciliationHistory(userId: number, limit: number = 20): Promise<Array<typeof replyDetectionReconciliationRuns.$inferSelect>> {
  return db.select().from(replyDetectionReconciliationRuns).where(eq(replyDetectionReconciliationRuns.userId, userId)).orderBy(desc(replyDetectionReconciliationRuns.createdAt)).limit(limit);
}
