import { db } from "../../../db";
import { desc } from "drizzle-orm";
import { followUpReconciliation } from "@shared/schema";

export async function getReconciliationHistory(limit: number = 20) {
  return db.select().from(followUpReconciliation).orderBy(desc(followUpReconciliation.startedAt)).limit(limit);
}
