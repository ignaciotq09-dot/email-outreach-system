import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

interface CalendarEventDetails {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail: string;
  attendeeName: string;
}

/**
 * Create a calendar event with the appointment details
 */
export async function createCalendarEvent(details: CalendarEventDetails) {
  try {
    const calendar = await getUncachableGoogleCalendarClient();

    const event = {
      summary: details.summary,
      description: details.description,
      start: {
        dateTime: details.startTime.toISOString(),
        timeZone: 'America/New_York', // You can make this configurable
      },
      end: {
        dateTime: details.endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        {
          email: details.attendeeEmail,
          displayName: details.attendeeName,
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees
    });

    console.log('[Calendar] Event created:', response.data.id);
    return {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('[Calendar] Error creating event:', error);
    throw error;
  }
}

/**
 * Parse appointment text to extract date/time details
 * Uses simple pattern matching for common appointment phrases
 * Returns null if no clear time is found - caller should handle this
 */
export function parseAppointmentDateTime(appointmentText: string): {
  startTime: Date;
  endTime: Date;
  parsedSuccessfully: boolean;
} | null {
  const text = appointmentText.toLowerCase();

  // Try to extract time patterns like "2pm", "14:00", "2:30pm"
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  let hour: number | null = null;
  let minute: number = 0;

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3] ? match[3].toLowerCase() : '';

      // Convert to 24-hour format
      if (meridiem === 'pm' && hour !== 12) {
        hour += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour = 0;
      }
      break;
    }
  }

  // Try to extract day patterns
  const today = new Date();
  let appointmentDate = new Date();

  // Check for relative day keywords
  if (text.includes('tomorrow')) {
    appointmentDate.setDate(today.getDate() + 1);
  } else if (text.includes('next week')) {
    appointmentDate.setDate(today.getDate() + 7);
  } else if (text.includes('monday') || text.includes('mon')) {
    appointmentDate = getNextWeekday(1);
  } else if (text.includes('tuesday') || text.includes('tue')) {
    appointmentDate = getNextWeekday(2);
  } else if (text.includes('wednesday') || text.includes('wed')) {
    appointmentDate = getNextWeekday(3);
  } else if (text.includes('thursday') || text.includes('thu')) {
    appointmentDate = getNextWeekday(4);
  } else if (text.includes('friday') || text.includes('fri')) {
    appointmentDate = getNextWeekday(5);
  } else {
    // Default to next business day (tomorrow if weekday, Monday if weekend)
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 5) { // Friday
      appointmentDate.setDate(today.getDate() + 3); // Monday
    } else if (dayOfWeek === 6) { // Saturday
      appointmentDate.setDate(today.getDate() + 2); // Monday
    } else {
      appointmentDate.setDate(today.getDate() + 1); // Tomorrow
    }
  }

  // If we found a time, use it; otherwise default to 2 PM
  if (hour !== null) {
    appointmentDate.setHours(hour, minute, 0, 0);
  } else {
    appointmentDate.setHours(14, 0, 0, 0); // Default 2 PM
  }

  // Default duration: 1 hour
  const endTime = new Date(appointmentDate);
  endTime.setHours(endTime.getHours() + 1);

  return {
    startTime: appointmentDate,
    endTime: endTime,
    parsedSuccessfully: hour !== null, // True if we found actual time, false if using default
  };
}

/**
 * Get the next occurrence of a weekday (0 = Sunday, 6 = Saturday)
 */
function getNextWeekday(targetDay: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;

  // If target day is today or in the past, add a week
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const result = new Date(today);
  result.setDate(today.getDate() + daysToAdd);
  return result;
}

/**
 * Check if Google Calendar is connected
 */
export async function isCalendarConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}
