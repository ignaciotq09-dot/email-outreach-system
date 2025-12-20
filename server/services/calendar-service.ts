import { google } from 'googleapis';
import { db } from '../db';
import { authProviders } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken } from '../auth/token-encryption';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * Creates an authenticated Google Calendar client for a user
 */
async function getCalendarClient(userId: number) {
  // Get Gmail OAuth tokens (includes calendar scopes)
  const [provider] = await db
    .select()
    .from(authProviders)
    .where(
      and(
        eq(authProviders.userId, userId),
        eq(authProviders.provider, 'gmail')
      )
    );

  if (!provider) {
    throw new Error('Gmail not connected. Please connect Gmail first.');
  }

  // Decrypt tokens (they're stored encrypted in accessToken/refreshToken fields)
  const accessToken = decryptToken(provider.accessToken);
  const refreshToken = provider.refreshToken 
    ? decryptToken(provider.refreshToken)
    : null;

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      try {
        // Update access token and optionally refresh token in database
        const { encryptToken } = await import('../auth/token-encryption');
        const updateData: any = {
          accessToken: encryptToken(tokens.access_token),
          updatedAt: new Date(),
        };

        // If new refresh token provided, update it (important for token rotation)
        if (tokens.refresh_token) {
          updateData.refreshToken = encryptToken(tokens.refresh_token);
        }

        // Update expiration if provided
        if (tokens.expiry_date) {
          updateData.expiresAt = new Date(tokens.expiry_date);
        }

        await db
          .update(authProviders)
          .set(updateData)
          .where(
            and(
              eq(authProviders.userId, userId),
              eq(authProviders.provider, 'gmail')
            )
          );

        console.log('[Calendar Service] Token refreshed successfully');
      } catch (error) {
        console.error('[Calendar Service] Error updating tokens:', error);
        // Don't throw - let the calendar operation continue
      }
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Creates a new calendar event
 */
export async function createCalendarEvent(
  userId: number,
  event: CalendarEvent
): Promise<any> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: event.conferenceData ? 1 : undefined,
    requestBody: event,
  });

  return response.data;
}

/**
 * Lists calendar events within a date range
 */
export async function listCalendarEvents(
  userId: number,
  timeMin: string,
  timeMax: string
): Promise<any[]> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

/**
 * Checks availability for a user
 */
export async function checkAvailability(
  userId: number,
  timeMin: string,
  timeMax: string
): Promise<TimeSlot[]> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: 'primary' }],
    },
  });

  const busySlots = response.data.calendars?.primary?.busy || [];
  return busySlots.map(slot => ({
    start: slot.start || '',
    end: slot.end || '',
  }));
}

/**
 * Lists all calendars for a user
 */
export async function listCalendars(userId: number): Promise<any[]> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.calendarList.list();

  return response.data.items || [];
}

/**
 * Deletes a calendar event
 */
export async function deleteCalendarEvent(
  userId: number,
  eventId: string
): Promise<void> {
  const calendar = await getCalendarClient(userId);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

/**
 * Updates an existing calendar event
 */
export async function updateCalendarEvent(
  userId: number,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<any> {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
  });

  return response.data;
}
