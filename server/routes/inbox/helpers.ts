import { db } from "../../db";
import { appointmentRequests, replies, sentEmails, contacts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type { InboxStats, ReplyWithAppointment } from "./types";

export function emailsMatch(email1: string, email2: string): boolean { return email1.toLowerCase().trim() === email2.toLowerCase().trim(); }

export async function getRepliesWithAppointments(userId: number): Promise<ReplyWithAppointment[]> {
  // Use manual LEFT JOIN to fetch all data in a single query - eliminates N+1 issue
  // This ensures 100% accurate data by fetching everything atomically
  const results = await db
    .select({
      reply: replies,
      sentEmail: sentEmails,
      contact: contacts,
      appointment: appointmentRequests,
    })
    .from(replies)
    .leftJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id))
    .leftJoin(contacts, eq(sentEmails.contactId, contacts.id))
    .leftJoin(appointmentRequests, eq(appointmentRequests.replyId, replies.id))
    .where(eq(replies.userId, userId))
    .orderBy(desc(replies.replyReceivedAt));

  return results.map((row) => ({
    id: row.reply.id,
    sentEmailId: row.reply.sentEmailId,
    replyReceivedAt: row.reply.replyReceivedAt,
    replyContent: row.reply.replyContent,
    gmailMessageId: row.reply.gmailMessageId,
    status: row.reply.status || 'new',
    contact: row.contact,
    sentEmail: row.sentEmail ? {
      id: row.sentEmail.id,
      subject: row.sentEmail.subject,
      body: row.sentEmail.body,
      sentAt: row.sentEmail.sentAt
    } : null,
    appointment: row.appointment || null
  }));
}

export function calculateStats(repliesWithAppointments: ReplyWithAppointment[]): InboxStats {
  const pendingAppointments = repliesWithAppointments.filter(r => r.appointment?.status === 'pending');
  const newRepliesOnly = repliesWithAppointments.filter(r => (r.status === 'new' || !r.status) && r.appointment?.status !== 'pending');
  const handledRepliesOnly = repliesWithAppointments.filter(r => r.status === 'handled' || r.appointment?.status === 'accepted' || r.appointment?.status === 'declined');
  const meetingReplies = repliesWithAppointments.filter(r => r.appointment);
  return { total: repliesWithAppointments.length, needsAction: pendingAppointments.length + newRepliesOnly.length, pendingMeetings: pendingAppointments.length, newReplies: newRepliesOnly.length, meetings: meetingReplies.length, handled: handledRepliesOnly.length };
}

export function filterReplies(repliesWithAppointments: ReplyWithAppointment[], filter: string): ReplyWithAppointment[] {
  const pendingAppointments = repliesWithAppointments.filter(r => r.appointment?.status === 'pending');
  const newRepliesOnly = repliesWithAppointments.filter(r => (r.status === 'new' || !r.status) && r.appointment?.status !== 'pending');
  const handledRepliesOnly = repliesWithAppointments.filter(r => r.status === 'handled' || r.appointment?.status === 'accepted' || r.appointment?.status === 'declined');
  const meetingReplies = repliesWithAppointments.filter(r => r.appointment);
  switch (filter) { case 'needs-action': return [...pendingAppointments, ...newRepliesOnly]; case 'meetings': return meetingReplies; case 'handled': return handledRepliesOnly; case 'pending-meetings': return pendingAppointments; default: return repliesWithAppointments; }
}
