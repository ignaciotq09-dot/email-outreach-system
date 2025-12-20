import { db } from '../db';
import { appointmentRequests, replies, contacts, meetingPreferences } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { detectAppointment } from '../ai/appointment-detection';
import * as calendarService from './calendar-service';

/**
 * Processes a reply to detect meeting requests and optionally creates calendar events
 */
export async function processMeetingRequest(
  replyId: number,
  userId: number,
  autoCreateEvent: boolean = false
): Promise<{ 
  hasAppointment: boolean; 
  appointmentRequestId?: number; 
  calendarEventId?: string;
}> {
  // Get the reply
  const [reply] = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId));

  if (!reply) {
    throw new Error('Reply not found');
  }

  // Get the contact
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, reply.contactId));

  if (!contact) {
    throw new Error('Contact not found');
  }

  // Detect appointment in reply
  const detection = await detectAppointment(
    reply.bodyText || reply.bodyHtml || '',
    contact.firstName || contact.email
  );

  if (!detection.hasAppointment) {
    return { hasAppointment: false };
  }

  // Create appointment request record
  const [appointmentRequest] = await db.insert(appointmentRequests).values({
    replyId: reply.id,
    contactId: reply.contactId,
    appointmentType: detection.type || 'meeting',
    suggestedDate: detection.suggestedDate,
    suggestedTime: detection.suggestedTime || undefined,
    duration: detection.duration,
    location: detection.location || undefined,
    notes: detection.notes || undefined,
    status: autoCreateEvent ? 'scheduled' : 'pending',
    platform: detection.platform || undefined,
    aiConfidence: detection.confidence,
    rawEmailText: reply.bodyText || undefined,
    detectionReason: detection.detectionReason,
    redFlags: detection.redFlags.length > 0 ? detection.redFlags : null,
  }).returning();

  // If auto-create is enabled and we have enough info, create the calendar event
  if (autoCreateEvent && detection.suggestedDate && detection.suggestedTime) {
    try {
      // Get user's meeting preferences for timezone
      const [preferences] = await db
        .select()
        .from(meetingPreferences)
        .where(eq(meetingPreferences.userId, userId));

      const timeZone = preferences?.defaultTimeZone || 'America/New_York';
      const duration = detection.duration || preferences?.defaultDuration || 30;

      // Parse time to create full datetime
      const startDateTime = combineDateTime(
        detection.suggestedDate,
        detection.suggestedTime
      );

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      // Determine if Google Meet should be enabled
      const enableGoogleMeet = preferences?.enableGoogleMeet !== false;

      // Create calendar event
      const googleEvent = await calendarService.createCalendarEvent(userId, {
        summary: `Meeting with ${contact.firstName || contact.email}`,
        description: detection.notes || `Meeting requested via email`,
        location: detection.location || undefined,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone,
        },
        attendees: [
          {
            email: contact.email,
            displayName: contact.firstName || undefined,
          },
        ],
        conferenceData: (enableGoogleMeet || detection.platform?.toLowerCase().includes('meet')) ? {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        } : undefined,
      });

      // Update appointment request with calendar event ID
      await db
        .update(appointmentRequests)
        .set({
          googleCalendarEventId: googleEvent.id,
          status: 'scheduled',
        })
        .where(eq(appointmentRequests.id, appointmentRequest.id));

      return {
        hasAppointment: true,
        appointmentRequestId: appointmentRequest.id,
        calendarEventId: googleEvent.id || undefined,
      };
    } catch (error) {
      console.error('[processMeetingRequest] Error creating calendar event:', error);
      // Still return the appointment request even if calendar creation fails
      return {
        hasAppointment: true,
        appointmentRequestId: appointmentRequest.id,
      };
    }
  }

  return {
    hasAppointment: true,
    appointmentRequestId: appointmentRequest.id,
  };
}

/**
 * Combines a date and time string into a full DateTime
 */
function combineDateTime(date: Date, time: string): Date {
  const result = new Date(date);

  // Handle various time formats
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    // Format: HH:MM or H:MM
    const [hours, minutes] = time.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  } else if (time.toLowerCase().includes('morning')) {
    result.setHours(9, 0, 0, 0); // Default to 9 AM
  } else if (time.toLowerCase().includes('afternoon')) {
    result.setHours(14, 0, 0, 0); // Default to 2 PM
  } else if (time.toLowerCase().includes('evening')) {
    result.setHours(18, 0, 0, 0); // Default to 6 PM
  } else {
    // Default to 10 AM if we can't parse
    result.setHours(10, 0, 0, 0);
  }

  return result;
}

/**
 * Creates a calendar event from an existing appointment request
 */
export async function createCalendarEventFromAppointment(
  appointmentRequestId: number,
  userId: number,
  customDateTime?: { startDateTime: string; duration?: number }
): Promise<string> {
  // Get the appointment request
  const [appointmentRequest] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, appointmentRequestId));

  if (!appointmentRequest) {
    throw new Error('Appointment request not found');
  }

  // Get the contact
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, appointmentRequest.contactId));

  if (!contact) {
    throw new Error('Contact not found');
  }

  // Get user's meeting preferences for timezone
  const [preferences] = await db
    .select()
    .from(meetingPreferences)
    .where(eq(meetingPreferences.userId, userId));

  const timeZone = preferences?.defaultTimeZone || 'America/New_York';

  // Use custom datetime or detected datetime
  let startDateTime: Date;
  let duration: number;

  if (customDateTime) {
    startDateTime = new Date(customDateTime.startDateTime);
    duration = customDateTime.duration || appointmentRequest.duration || preferences?.defaultDuration || 30;
  } else if (appointmentRequest.suggestedDate && appointmentRequest.suggestedTime) {
    startDateTime = combineDateTime(
      appointmentRequest.suggestedDate,
      appointmentRequest.suggestedTime
    );
    duration = appointmentRequest.duration || preferences?.defaultDuration || 30;
  } else {
    throw new Error('No date/time information available. Please provide custom datetime.');
  }

  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  // Determine if Google Meet should be enabled
  const enableGoogleMeet = preferences?.enableGoogleMeet !== false;

  // Create calendar event
  const googleEvent = await calendarService.createCalendarEvent(userId, {
    summary: `Meeting with ${contact.firstName || contact.email}`,
    description: appointmentRequest.notes || `Meeting requested via email`,
    location: appointmentRequest.location || undefined,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone,
    },
    attendees: [
      {
        email: contact.email,
        displayName: contact.firstName || undefined,
      },
    ],
    conferenceData: (enableGoogleMeet || appointmentRequest.platform?.toLowerCase().includes('meet')) ? {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    } : undefined,
  });

  // Update appointment request
  await db
    .update(appointmentRequests)
    .set({
      googleCalendarEventId: googleEvent.id,
      status: 'scheduled',
    })
    .where(eq(appointmentRequests.id, appointmentRequestId));

  return googleEvent.id || '';
}
