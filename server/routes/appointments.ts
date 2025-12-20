import type { Express, Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { appointmentRequests, contacts, replies, sentEmails } from "@shared/schema";
import { createCalendarEvent, isCalendarConnected } from "../google-calendar";
import { requireAuth } from "../auth/middleware";

export function registerAppointmentRoutes(app: Express) {
  // GET /api/appointments - Get all appointment requests for authenticated user
  app.get("/api/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log(`[Appointments] User ${userId}: Fetching appointment requests`);
      
      // Multi-tenant: Get appointments for sent emails belonging to this user
      // Filter by sentEmails.userId as the authoritative tenant identifier
      const appointments = await db
        .select({
          appointment: appointmentRequests,
          contact: contacts,
          reply: replies,
        })
        .from(appointmentRequests)
        .innerJoin(replies, eq(appointmentRequests.replyId, replies.id))
        .innerJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id))
        .innerJoin(contacts, eq(sentEmails.contactId, contacts.id))
        .where(eq(sentEmails.userId, userId))
        .orderBy(desc(appointmentRequests.detectedAt));

      const result = appointments.map(row => ({
        ...row.appointment,
        contact: row.contact,
        reply: row.reply,
      }));

      console.log(`[Appointments] User ${userId}: Retrieved ${result.length} appointments`);
      res.json(result);
    } catch (error) {
      console.error('[Appointments] Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // POST /api/appointments/:id/accept - Accept an appointment request
  app.post("/api/appointments/:id/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const appointmentId = parseInt(req.params.id, 10);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: 'Invalid appointment ID' });
      }

      console.log(`[AppointmentAccept] User ${userId}: Accepting appointment ${appointmentId}`);

      // Multi-tenant: Verify appointment belongs to this user via sentEmails.userId
      const [appointmentData] = await db
        .select({
          appointment: appointmentRequests,
          contact: contacts,
          reply: replies,
          sentEmail: sentEmails,
        })
        .from(appointmentRequests)
        .innerJoin(replies, eq(appointmentRequests.replyId, replies.id))
        .innerJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id))
        .innerJoin(contacts, eq(sentEmails.contactId, contacts.id))
        .where(and(
          eq(appointmentRequests.id, appointmentId),
          eq(sentEmails.userId, userId)
        ))
        .limit(1);

      if (!appointmentData) {
        console.log(`[AppointmentAccept] User ${userId}: Appointment not found`);
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const { appointment, contact, reply } = appointmentData;

      let calendarEventId: string | null = null;
      let calendarEventLink: string | null = null;
      let calendarError: string | null = null;

      try {
        const calendarConnected = await isCalendarConnected();
        
        if (calendarConnected) {
          console.log(`[AppointmentAccept] User ${userId}: Google Calendar is connected, creating event`);
          
          const eventTitle = appointment.proposedSubject || 
            `Meeting with ${contact.name}${contact.company ? ` from ${contact.company}` : ''}`;
          
          const eventDescription = `
Meeting Details:
- Contact: ${contact.name}${contact.email ? ` (${contact.email})` : ''}
${contact.company ? `- Company: ${contact.company}` : ''}
${contact.position ? `- Position: ${contact.position}` : ''}
${appointment.proposedLocation ? `- Location: ${appointment.proposedLocation}` : ''}

Reply Content:
${reply.replyContent}
          `.trim();

          const attendees = contact.email ? [contact.email] : [];

          const calendarEvent = await createCalendarEvent(
            eventTitle,
            eventDescription,
            new Date(appointment.proposedDateTime),
            new Date(appointment.proposedDateTime),
            attendees,
            appointment.proposedLocation || undefined
          );

          calendarEventId = calendarEvent.id || null;
          calendarEventLink = calendarEvent.htmlLink || null;
          
          console.log(`[AppointmentAccept] User ${userId}: Calendar event created:`, {
            eventId: calendarEventId,
            link: calendarEventLink,
          });
        } else {
          console.log(`[AppointmentAccept] User ${userId}: Google Calendar not connected`);
          calendarError = 'Google Calendar not connected';
        }
      } catch (error: any) {
        console.error(`[AppointmentAccept] User ${userId}: Failed to create calendar event:`, error);
        calendarError = error.message || 'Failed to create calendar event';
      }

      const [updatedAppointment] = await db
        .update(appointmentRequests)
        .set({
          status: 'accepted',
          calendarEventId,
          calendarEventLink,
        })
        .where(eq(appointmentRequests.id, appointmentId))
        .returning();

      res.json({
        success: true,
        appointment: updatedAppointment,
        calendarEventCreated: !!calendarEventId,
        calendarEventLink,
        calendarError,
      });
    } catch (error) {
      console.error('[AppointmentAccept] Error accepting appointment:', error);
      res.status(500).json({ error: 'Failed to accept appointment' });
    }
  });

  // POST /api/appointments/:id/decline - Decline an appointment request
  app.post("/api/appointments/:id/decline", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const appointmentId = parseInt(req.params.id, 10);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: 'Invalid appointment ID' });
      }

      console.log(`[AppointmentDecline] User ${userId}: Declining appointment ${appointmentId}`);

      // Multi-tenant: Verify appointment belongs to this user via sentEmails.userId
      const [existing] = await db
        .select({ id: appointmentRequests.id })
        .from(appointmentRequests)
        .innerJoin(replies, eq(appointmentRequests.replyId, replies.id))
        .innerJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id))
        .where(and(
          eq(appointmentRequests.id, appointmentId),
          eq(sentEmails.userId, userId)
        ))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const [updatedAppointment] = await db
        .update(appointmentRequests)
        .set({ status: 'declined' })
        .where(eq(appointmentRequests.id, appointmentId))
        .returning();

      console.log(`[AppointmentDecline] User ${userId}: Appointment declined successfully`);
      
      res.json({
        success: true,
        appointment: updatedAppointment,
      });
    } catch (error) {
      console.error('[AppointmentDecline] Error declining appointment:', error);
      res.status(500).json({ error: 'Failed to decline appointment' });
    }
  });
}
