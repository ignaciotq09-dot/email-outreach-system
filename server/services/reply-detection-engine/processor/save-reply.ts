import { db } from "../../../db";
import { sentEmails, replies, campaignContacts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { AnalyticsService } from "../../../analytics";
import { broadcastNewReply } from "../../inbox-websocket";
import type { ReplyDetectionJob } from "@shared/schema";

export async function saveReplyToDatabase(job: ReplyDetectionJob, reply: { gmailMessageId?: string; receivedAt?: Date; content?: string }, confidenceScore: number): Promise<{ insertedReply: any; dbWriteConfirmed: boolean }> {
  const existingReply = await db.select().from(replies).where(eq(replies.gmailMessageId, reply.gmailMessageId || "")).limit(1); if (existingReply.length > 0) { console.log(`[ReplyDetectionProcessor] Reply ${reply.gmailMessageId} already exists`); return { insertedReply: null, dbWriteConfirmed: true }; }
  const [insertedReply] = await db.insert(replies).values({ sentEmailId: job.sentEmailId, userId: job.userId, replyReceivedAt: reply.receivedAt || new Date(), replyContent: reply.content || "", gmailMessageId: reply.gmailMessageId }).returning();
  await db.update(sentEmails).set({ replyReceived: true, lastReplyCheck: new Date(), replyConfidence: confidenceScore }).where(eq(sentEmails.id, job.sentEmailId));
  const campaignContactResult = await db.select({ campaignId: campaignContacts.campaignId }).from(campaignContacts).where(eq(campaignContacts.sentEmailId, job.sentEmailId)).limit(1); const campaignId = campaignContactResult[0]?.campaignId;
  await AnalyticsService.logReplyEvent({ sentEmailId: job.sentEmailId, contactId: job.contactId, campaignId: campaignId || undefined, metadata: { detectedAt: new Date().toISOString(), gmailMessageId: reply.gmailMessageId } }); console.log(`[ReplyDetectionProcessor] Reply analytics logged for sentEmail ${job.sentEmailId}`);
  if (insertedReply) broadcastNewReply(job.userId, { id: insertedReply.id, type: 'invalidate' });
  return { insertedReply, dbWriteConfirmed: true };
}

export async function updateLastCheckOnly(sentEmailId: number): Promise<boolean> {
  await db.update(sentEmails).set({ lastReplyCheck: new Date() }).where(eq(sentEmails.id, sentEmailId)); return true;
}
