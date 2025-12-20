import { db } from "../../../db";
import { sentEmails, contacts } from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type { EmailToCheck } from "./types";

export async function getEmailsNeedingCheck(hoursAgo: number = 24, lastCheckHoursAgo: number = 1): Promise<EmailToCheck[]> {
  const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const lastCheckCutoff = new Date(Date.now() - lastCheckHoursAgo * 60 * 60 * 1000);
  const results = await db.select({ sentEmail: sentEmails, contact: { id: contacts.id, email: contacts.email, name: contacts.name, company: contacts.company } }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(and(gte(sentEmails.sentAt, cutoffDate), eq(sentEmails.replyReceived, false), sql`(${sentEmails.lastReplyCheck} IS NULL OR ${sentEmails.lastReplyCheck} < ${lastCheckCutoff})`)).orderBy(desc(sentEmails.sentAt)).limit(100);
  return results;
}

export async function getAllEmailsWithoutReplies(): Promise<EmailToCheck[]> {
  const results = await db.select({ sentEmail: sentEmails, contact: { id: contacts.id, email: contacts.email, name: contacts.name, company: contacts.company } }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(eq(sentEmails.replyReceived, false)).orderBy(desc(sentEmails.sentAt)).limit(500);
  return results;
}
