import { db } from "../../db";
import { eq, and, lte, sql, asc } from "drizzle-orm";
import { scheduledSends, contacts } from "@shared/schema";
import type { ScheduledSendWithContext, ScheduledSendQueueStats } from "./types";
import { MAX_ATTEMPTS, RETRY_DELAYS } from "./types";

export async function createScheduledSend(params: {
  userId: number;
  contactId: number;
  campaignId?: number;
  subject: string;
  body: string;
  channel?: string;
  scheduledFor: Date;
  timezone?: string;
  optimizationReason?: string;
  confidenceScore?: number;
  metadata?: any;
}): Promise<number> {
  const [send] = await db.insert(scheduledSends).values({
    userId: params.userId,
    contactId: params.contactId,
    campaignId: params.campaignId,
    subject: params.subject,
    body: params.body,
    channel: params.channel || 'email',
    scheduledFor: params.scheduledFor,
    timezone: params.timezone,
    optimizationReason: params.optimizationReason,
    confidenceScore: params.confidenceScore,
    status: 'pending',
    metadata: params.metadata,
  }).returning({ id: scheduledSends.id });

  console.log(`[ScheduledSendQueue] Created job ${send.id} for ${params.scheduledFor.toISOString()}`);
  return send.id;
}

export async function getDueSends(limit: number = 50): Promise<ScheduledSendWithContext[]> {
  const now = new Date();

  const sends = await db
    .select({
      send: scheduledSends,
      contact: {
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        company: contacts.company,
        phone: contacts.phone,
      },
    })
    .from(scheduledSends)
    .innerJoin(contacts, eq(scheduledSends.contactId, contacts.id))
    .where(
      and(
        eq(scheduledSends.status, 'pending'),
        lte(scheduledSends.scheduledFor, now)
      )
    )
    .orderBy(asc(scheduledSends.scheduledFor))
    .limit(limit);

  return sends.map(row => ({
    ...row.send,
    contact: row.contact,
  }));
}

export async function getRetryableSends(limit: number = 20): Promise<ScheduledSendWithContext[]> {
  const now = new Date();

  const sends = await db
    .select({
      send: scheduledSends,
      contact: {
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        company: contacts.company,
        phone: contacts.phone,
      },
    })
    .from(scheduledSends)
    .innerJoin(contacts, eq(scheduledSends.contactId, contacts.id))
    .where(
      and(
        eq(scheduledSends.status, 'failed'),
        sql`${scheduledSends.attempts} < ${MAX_ATTEMPTS}`,
        lte(scheduledSends.lastAttemptAt, new Date(now.getTime() - RETRY_DELAYS[0]))
      )
    )
    .orderBy(asc(scheduledSends.lastAttemptAt))
    .limit(limit);

  return sends.map(row => ({
    ...row.send,
    contact: row.contact,
  }));
}

export async function markProcessing(id: number): Promise<void> {
  await db
    .update(scheduledSends)
    .set({ 
      status: 'processing',
      lastAttemptAt: new Date(),
      attempts: sql`${scheduledSends.attempts} + 1`,
    })
    .where(eq(scheduledSends.id, id));
}

export async function markSent(id: number, sentEmailId: number): Promise<void> {
  await db
    .update(scheduledSends)
    .set({ 
      status: 'sent',
      sentAt: new Date(),
      sentEmailId,
    })
    .where(eq(scheduledSends.id, id));
}

export async function markFailed(id: number, error: string): Promise<void> {
  const [current] = await db
    .select({ attempts: scheduledSends.attempts })
    .from(scheduledSends)
    .where(eq(scheduledSends.id, id));

  const attempts = (current?.attempts || 0) + 1;
  
  await db
    .update(scheduledSends)
    .set({ 
      status: attempts >= MAX_ATTEMPTS ? 'cancelled' : 'failed',
      errorMessage: error,
    })
    .where(eq(scheduledSends.id, id));

  if (attempts >= MAX_ATTEMPTS) {
    console.log(`[ScheduledSendQueue] Job ${id} exhausted after ${attempts} attempts`);
  }
}

export async function cancelScheduledSend(id: number): Promise<void> {
  await db
    .update(scheduledSends)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(scheduledSends.id, id),
        eq(scheduledSends.status, 'pending')
      )
    );
}

export async function getQueueStats(userId: number): Promise<ScheduledSendQueueStats> {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const stats = await db
    .select({
      status: scheduledSends.status,
      count: sql<number>`count(*)`,
    })
    .from(scheduledSends)
    .where(eq(scheduledSends.userId, userId))
    .groupBy(scheduledSends.status);

  const dueInHour = await db
    .select({ count: sql<number>`count(*)` })
    .from(scheduledSends)
    .where(
      and(
        eq(scheduledSends.userId, userId),
        eq(scheduledSends.status, 'pending'),
        lte(scheduledSends.scheduledFor, oneHourFromNow)
      )
    );

  const result: ScheduledSendQueueStats = {
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
    dueInNextHour: Number(dueInHour[0]?.count) || 0,
  };

  for (const stat of stats) {
    const status = stat.status as keyof ScheduledSendQueueStats;
    if (status in result) {
      result[status] = Number(stat.count);
    }
  }

  return result;
}

export async function getUserScheduledSends(
  userId: number,
  status?: string,
  limit: number = 50
): Promise<ScheduledSendWithContext[]> {
  const conditions = [eq(scheduledSends.userId, userId)];
  if (status) {
    conditions.push(eq(scheduledSends.status, status));
  }

  const sends = await db
    .select({
      send: scheduledSends,
      contact: {
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        company: contacts.company,
        phone: contacts.phone,
      },
    })
    .from(scheduledSends)
    .innerJoin(contacts, eq(scheduledSends.contactId, contacts.id))
    .where(and(...conditions))
    .orderBy(asc(scheduledSends.scheduledFor))
    .limit(limit);

  return sends.map(row => ({
    ...row.send,
    contact: row.contact,
  }));
}
