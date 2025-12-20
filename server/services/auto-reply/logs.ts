import { db } from "../../db";
import { eq, desc, and } from "drizzle-orm";
import { autoReplyLogs } from "@shared/schema";
import { detectIntentBulletproof } from "../../ai/bulletproof-intent-detection";
import type { TwoPassIntentResult } from "./types";

export async function getAutoReplyLogs(userId: number, limit: number = 50) { return db.select().from(autoReplyLogs).where(eq(autoReplyLogs.userId, userId)).orderBy(desc(autoReplyLogs.sentAt)).limit(limit); }

export async function getPendingReviewReplies(userId: number) { return db.select().from(autoReplyLogs).where(and(eq(autoReplyLogs.userId, userId), eq(autoReplyLogs.status, 'flagged_for_review'))).orderBy(desc(autoReplyLogs.sentAt)); }

export async function analyzeReplyIntentOnly(replyContent: string): Promise<TwoPassIntentResult> { return detectIntentBulletproof(replyContent); }
