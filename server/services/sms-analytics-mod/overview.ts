import { db } from "../../db";
import { sentSms, smsReplies, contacts } from "@shared/schema";
import { eq, and, sql, count } from "drizzle-orm";
import type { SmsOverviewMetrics } from "./types";

export async function getOverviewMetrics(userId: number): Promise<SmsOverviewMetrics> {
  const smsResult = await db.select({ totalSent: count(), totalDelivered: sql<number>`count(*) filter (where ${sentSms.status} = 'delivered')`, totalRejected: sql<number>`count(*) filter (where ${sentSms.status} in ('failed', 'undelivered'))` }).from(sentSms).where(eq(sentSms.userId, userId));
  const replyResult = await db.select({ totalReplies: count(), totalOptOuts: sql<number>`count(*) filter (where ${smsReplies.isOptOut} = 1)` }).from(smsReplies).where(eq(smsReplies.userId, userId));
  const optOutContacts = await db.select({ count: count() }).from(contacts).where(and(eq(contacts.userId, userId), sql`${contacts.smsOptedOut} = 1`));
  const totalContactsWithSms = await db.select({ count: sql<number>`count(distinct ${sentSms.contactId})` }).from(sentSms).where(eq(sentSms.userId, userId));
  const metrics = smsResult[0] || { totalSent: 0, totalDelivered: 0, totalRejected: 0 }; const replyMetrics = replyResult[0] || { totalReplies: 0, totalOptOuts: 0 };
  const total = Number(metrics.totalSent) || 0; const delivered = Number(metrics.totalDelivered) || 0; const replies = Number(replyMetrics.totalReplies) || 0; const optOuts = Number(optOutContacts[0]?.count) || 0; const totalContacts = Number(totalContactsWithSms[0]?.count) || 0;
  return { totalSent: total, totalDelivered: delivered, responseRate: total > 0 ? (replies / total) * 100 : 0, optOutRate: totalContacts > 0 ? (optOuts / totalContacts) * 100 : 0, totalOptOuts: optOuts, totalReplies: replies };
}
