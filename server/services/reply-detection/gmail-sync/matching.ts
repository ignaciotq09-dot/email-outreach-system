import { db } from "../../../db";
import { sentEmails, contacts, replyDetectionAuditLog } from "@shared/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";
import type { MessageAnalysis } from './types';

export async function logAudit(entry: { userId: number; sentEmailId?: number; contactId?: number; gmailMessageId?: string; gmailThreadId?: string; detectionLayer: string; detectionMethod?: string; resultFound: boolean; isAutoReply?: boolean; isBounce?: boolean; matchReason?: string; noMatchReason?: string; gmailQuery?: string; messagesScanned?: number; processingTimeMs?: number; apiCallsUsed?: number; errorMessage?: string; rawHeaders?: Record<string, string>; }): Promise<void> {
  await db.insert(replyDetectionAuditLog).values(entry);
}

export async function findMatchingSentEmailByHeaders(userId: number, analysis: MessageAnalysis): Promise<{ sentEmailId: number; contactId: number } | null> {
  if (analysis.inReplyTo) {
    const matchByInReplyTo = await db.select({ id: sentEmails.id, contactId: sentEmails.contactId, gmailMessageId: sentEmails.gmailMessageId }).from(sentEmails).where(and(eq(sentEmails.userId, userId), or(sql`${sentEmails.metadata}->>'messageIdHeader' = ${analysis.inReplyTo}`, eq(sentEmails.gmailMessageId, analysis.inReplyTo.replace(/[<>]/g, ''))))).limit(1);
    if (matchByInReplyTo.length > 0) return { sentEmailId: matchByInReplyTo[0].id, contactId: matchByInReplyTo[0].contactId! };
  }
  for (const ref of analysis.references) {
    const matchByRef = await db.select({ id: sentEmails.id, contactId: sentEmails.contactId }).from(sentEmails).where(and(eq(sentEmails.userId, userId), or(sql`${sentEmails.metadata}->>'messageIdHeader' = ${ref}`, eq(sentEmails.gmailMessageId, ref.replace(/[<>]/g, ''))))).limit(1);
    if (matchByRef.length > 0) return { sentEmailId: matchByRef[0].id, contactId: matchByRef[0].contactId! };
  }
  return null;
}

export async function findMatchingSentEmailBySender(userId: number, fromEmail: string, threadId?: string): Promise<{ sentEmailId: number; contactId: number } | null> {
  if (threadId) {
    const matchByThread = await db.select({ id: sentEmails.id, contactId: sentEmails.contactId }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.gmailThreadId, threadId))).limit(1);
    if (matchByThread.length > 0 && matchByThread[0].contactId) return { sentEmailId: matchByThread[0].id, contactId: matchByThread[0].contactId };
  }
  const domain = fromEmail.split('@')[1];
  const contactMatch = await db.select({ id: contacts.id, email: contacts.email }).from(contacts).where(and(eq(contacts.userId, userId), or(eq(contacts.email, fromEmail), sql`LOWER(${contacts.email}) LIKE ${'%@' + domain}`))).limit(1);
  if (contactMatch.length > 0) {
    const sentEmail = await db.select({ id: sentEmails.id }).from(sentEmails).where(and(eq(sentEmails.userId, userId), eq(sentEmails.contactId, contactMatch[0].id), eq(sentEmails.replyReceived, false))).orderBy(desc(sentEmails.sentAt)).limit(1);
    if (sentEmail.length > 0) return { sentEmailId: sentEmail[0].id, contactId: contactMatch[0].id };
  }
  return null;
}
