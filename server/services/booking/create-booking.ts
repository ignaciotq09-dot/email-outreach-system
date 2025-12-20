import { db } from "../../db";
import { eq } from "drizzle-orm";
import { bookingPages, bookings } from "@shared/schema";
import { createCalendarEvent, isCalendarConnected } from "../../google-calendar";
import { sendBookingNotifications } from "../booking-notifications";
import { getAvailableSlots } from "./availability";

export async function createBooking(data: { bookingPageId: number; guestName: string; guestEmail: string; guestPhone?: string; guestNotes?: string; customAnswers?: { question: string; answer: string }[]; startTime: Date; endTime: Date; timezone?: string; }) {
  const [page] = await db.select().from(bookingPages).where(eq(bookingPages.id, data.bookingPageId)).limit(1); if (!page) throw new Error('Booking page not found');
  const slots = await getAvailableSlots(data.bookingPageId, data.startTime); const isSlotAvailable = slots.some(s => s.available && s.start.getTime() === data.startTime.getTime() && s.end.getTime() === data.endTime.getTime()); if (!isSlotAvailable) throw new Error('Selected time slot is not available');
  let googleEventId: string | null = null; let meetingLink: string | null = null;
  const calendarConnected = await isCalendarConnected(); if (calendarConnected) { try { const event = await createCalendarEvent({ summary: `Meeting with ${data.guestName}`, description: `Booked via scheduling link\n\nGuest: ${data.guestName}\nEmail: ${data.guestEmail}${data.guestNotes ? `\nNotes: ${data.guestNotes}` : ''}`, startTime: data.startTime, endTime: data.endTime, attendeeEmail: data.guestEmail, attendeeName: data.guestName }); googleEventId = event.eventId || null; meetingLink = event.htmlLink || null; } catch (error) { console.error('[Booking] Failed to create calendar event:', error); } }
  const [booking] = await db.insert(bookings).values({ userId: page.userId, bookingPageId: data.bookingPageId, guestName: data.guestName, guestEmail: data.guestEmail, guestPhone: data.guestPhone, guestNotes: data.guestNotes, customAnswers: data.customAnswers, startTime: data.startTime, endTime: data.endTime, timezone: data.timezone || page.timezone, status: 'confirmed', googleEventId, meetingLink }).returning();
  const bookingId = booking.id; setImmediate(async () => { try { const result = await sendBookingNotifications({ userId: page.userId, guestName: data.guestName, guestEmail: data.guestEmail, guestPhone: data.guestPhone, startTime: data.startTime, endTime: data.endTime, meetingLink, guestNotes: data.guestNotes }); console.log(`[Booking] Notifications sent for booking ${bookingId}`); } catch (error) { console.error(`[Booking] Failed to send notifications for booking ${bookingId}:`, error); } });
  return booking;
}
