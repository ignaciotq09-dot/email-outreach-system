import { db } from "../db";
import { sentEmails, replies, followUps, campaigns, campaignContacts, type SentEmail, type InsertSentEmail, type Reply, type InsertReply, type FollowUp, type InsertFollowUp, type SentEmailWithContact } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export async function createSentEmail(userId: number, insertEmail: InsertSentEmail): Promise<SentEmail> {
  const [email] = await db.insert(sentEmails).values({ ...insertEmail, userId }).returning();
  return email;
}

export async function getSentEmails(userId: number, limit: number = 50, offset: number = 0): Promise<SentEmailWithContact[]> {
  const results = await db.query.sentEmails.findMany({
    where: eq(sentEmails.userId, userId),
    with: { contact: true, replies: true, followUps: true },
    orderBy: [desc(sentEmails.sentAt)],
    limit, offset,
  });
  return results as SentEmailWithContact[];
}

export async function getSentEmailById(userId: number, id: number): Promise<SentEmailWithContact | undefined> {
  const result = await db.query.sentEmails.findFirst({
    where: and(eq(sentEmails.userId, userId), eq(sentEmails.id, id)),
    with: { contact: true, replies: true, followUps: true },
  });
  return result as SentEmailWithContact | undefined;
}

export async function updateSentEmailReplyStatus(userId: number, id: number, replyReceived: boolean, lastReplyCheck: Date): Promise<void> {
  await db.update(sentEmails).set({ replyReceived, lastReplyCheck }).where(and(eq(sentEmails.userId, userId), eq(sentEmails.id, id)));
}

export async function getSentEmailsWithoutReplies(userId: number): Promise<SentEmailWithContact[]> {
  const results = await db.query.sentEmails.findMany({
    where: and(eq(sentEmails.userId, userId), eq(sentEmails.replyReceived, false)),
    with: { contact: true, replies: true, followUps: true },
  });
  return results as SentEmailWithContact[];
}

export async function getUserSentEmailContactIds(userId: number): Promise<number[]> {
  const results = await db.select({ contactId: sentEmails.contactId }).from(sentEmails).innerJoin(campaignContacts, eq(campaignContacts.sentEmailId, sentEmails.id)).innerJoin(campaigns, eq(campaigns.id, campaignContacts.campaignId)).where(eq(campaigns.userId, userId)).groupBy(sentEmails.contactId);
  return results.map(r => r.contactId);
}

export async function createReply(userId: number, insertReply: InsertReply): Promise<Reply> {
  const [reply] = await db.insert(replies).values({ ...insertReply, userId }).returning();
  return reply;
}

export async function getReplies(userId: number, limit: number = 50, offset: number = 0): Promise<Reply[]> {
  return await db.select().from(replies).where(eq(replies.userId, userId)).orderBy(desc(replies.replyReceivedAt)).limit(limit).offset(offset);
}

export async function getReplyById(userId: number, id: number): Promise<Reply | undefined> {
  const [reply] = await db.select().from(replies).where(and(eq(replies.userId, userId), eq(replies.id, id)));
  return reply;
}

export async function createFollowUp(userId: number, insertFollowUp: InsertFollowUp): Promise<FollowUp> {
  const [followUp] = await db.insert(followUps).values({ ...insertFollowUp, userId }).returning();
  return followUp;
}

export async function getFollowUps(userId: number, limit: number = 50, offset: number = 0): Promise<FollowUp[]> {
  return await db.select().from(followUps).where(eq(followUps.userId, userId)).orderBy(desc(followUps.sentAt)).limit(limit).offset(offset);
}

export async function getEmailsNeedingFollowUp(userId: number, getSentEmailsWithoutRepliesFn: (userId: number) => Promise<SentEmailWithContact[]>): Promise<SentEmailWithContact[]> {
  const emailsWithoutReplies = await getSentEmailsWithoutRepliesFn(userId);
  const now = new Date();
  const emailsNeedingFollowUp = [];
  
  for (const email of emailsWithoutReplies) {
    const followUpCount = email.followUps?.length || 0;
    if (!email.sentAt) continue;
    const daysSinceSent = Math.floor((now.getTime() - new Date(email.sentAt).getTime()) / (1000 * 60 * 60 * 24));
    
    let needsFollowUp = false;
    let followUpType = '';
    
    if (followUpCount === 0 && daysSinceSent >= 3) { needsFollowUp = true; followUpType = 'first'; }
    else if (followUpCount === 1) {
      const firstFollowUp = email.followUps[0];
      if (firstFollowUp.sentAt) {
        const daysSinceFirstFollowUp = Math.floor((now.getTime() - new Date(firstFollowUp.sentAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceFirstFollowUp >= 13) { needsFollowUp = true; followUpType = 'second'; }
      }
    } else if (followUpCount === 2) {
      const secondFollowUp = email.followUps[1];
      if (secondFollowUp.sentAt) {
        const daysSinceSecondFollowUp = Math.floor((now.getTime() - new Date(secondFollowUp.sentAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceSecondFollowUp >= 21) { needsFollowUp = true; followUpType = 'third'; }
      }
    }
    
    if (needsFollowUp) emailsNeedingFollowUp.push({ ...email, followUpType, followUpCount });
  }
  
  return emailsNeedingFollowUp;
}
