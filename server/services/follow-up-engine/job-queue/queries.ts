import { db } from "../../../db";
import { eq, and, lte, or, asc, desc, sql } from "drizzle-orm";
import { followUpJobs, followUpJobAudit, contacts, sentEmails } from "@shared/schema";
import type { FollowUpJobWithContext } from "../types";

const JOB_SELECT = { job: followUpJobs, contact: { id: contacts.id, email: contacts.email, name: contacts.name, company: contacts.company, pronoun: contacts.pronoun }, originalEmail: { id: sentEmails.id, subject: sentEmails.subject, gmailThreadId: sentEmails.gmailThreadId, gmailMessageId: sentEmails.gmailMessageId } };

function mapToContext(row: any): FollowUpJobWithContext { return { ...row.job, contact: row.contact, originalEmail: row.originalEmail }; }

export async function getDueJobs(limit: number = 50): Promise<FollowUpJobWithContext[]> {
  const now = new Date();
  const jobs = await db.select(JOB_SELECT).from(followUpJobs).innerJoin(contacts, eq(followUpJobs.contactId, contacts.id)).innerJoin(sentEmails, eq(followUpJobs.originalEmailId, sentEmails.id)).where(and(or(eq(followUpJobs.status, 'pending'), eq(followUpJobs.status, 'queued')), lte(followUpJobs.dueAt, now))).orderBy(asc(followUpJobs.dueAt)).limit(limit);
  return jobs.map(mapToContext);
}

export async function getRetryableJobs(limit: number = 20): Promise<FollowUpJobWithContext[]> {
  const now = new Date();
  const jobs = await db.select(JOB_SELECT).from(followUpJobs).innerJoin(contacts, eq(followUpJobs.contactId, contacts.id)).innerJoin(sentEmails, eq(followUpJobs.originalEmailId, sentEmails.id)).where(and(eq(followUpJobs.status, 'failed'), lte(followUpJobs.nextRetryAt, now))).orderBy(asc(followUpJobs.nextRetryAt)).limit(limit);
  return jobs.map(mapToContext);
}

export async function getJobById(jobId: number): Promise<FollowUpJobWithContext | null> {
  const [row] = await db.select(JOB_SELECT).from(followUpJobs).innerJoin(contacts, eq(followUpJobs.contactId, contacts.id)).innerJoin(sentEmails, eq(followUpJobs.originalEmailId, sentEmails.id)).where(eq(followUpJobs.id, jobId));
  return row ? mapToContext(row) : null;
}

export async function getJobsForContact(contactId: number): Promise<FollowUpJobWithContext[]> {
  const jobs = await db.select(JOB_SELECT).from(followUpJobs).innerJoin(contacts, eq(followUpJobs.contactId, contacts.id)).innerJoin(sentEmails, eq(followUpJobs.originalEmailId, sentEmails.id)).where(eq(followUpJobs.contactId, contactId)).orderBy(desc(followUpJobs.createdAt));
  return jobs.map(mapToContext);
}

export async function getJobAuditLog(jobId: number): Promise<typeof followUpJobAudit.$inferSelect[]> { return db.select().from(followUpJobAudit).where(eq(followUpJobAudit.jobId, jobId)).orderBy(desc(followUpJobAudit.createdAt)); }
