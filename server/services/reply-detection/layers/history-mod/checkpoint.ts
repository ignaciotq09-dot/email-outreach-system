import { db } from "../../../../db";
import { gmailHistoryCheckpoint } from "../../../../../shared/schemas/index";
import { eq } from "drizzle-orm";

export async function getHistoryCheckpoint(userEmail: string): Promise<string | null> { const checkpoint = await db.query.gmailHistoryCheckpoint.findFirst({ where: eq(gmailHistoryCheckpoint.userEmail, userEmail) }); return checkpoint?.lastHistoryId || null; }

export async function updateHistoryCheckpoint(userEmail: string, historyId: string): Promise<void> { await db.insert(gmailHistoryCheckpoint).values({ userEmail, lastHistoryId: historyId, lastCheckedAt: new Date() }).onConflictDoUpdate({ target: gmailHistoryCheckpoint.userEmail, set: { lastHistoryId: historyId, lastCheckedAt: new Date() } }); }
