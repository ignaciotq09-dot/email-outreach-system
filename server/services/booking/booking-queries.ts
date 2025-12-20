import { db } from "../../db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { bookings } from "@shared/schema";

export async function getUserBookings(userId: number, status?: string, limit = 50) {
  const conditions = [eq(bookings.userId, userId)]; if (status) conditions.push(eq(bookings.status, status));
  return db.select({ id: bookings.id, guestName: bookings.guestName, guestEmail: bookings.guestEmail, guestPhone: bookings.guestPhone, guestNotes: bookings.guestNotes, startTime: bookings.startTime, endTime: bookings.endTime, timezone: bookings.timezone, status: bookings.status, meetingLink: bookings.meetingLink, createdAt: bookings.createdAt }).from(bookings).where(and(...conditions)).orderBy(desc(bookings.startTime)).limit(limit);
}

export async function getUpcomingBookings(userId: number, limit = 10) {
  const now = new Date(); return db.select({ id: bookings.id, guestName: bookings.guestName, guestEmail: bookings.guestEmail, startTime: bookings.startTime, endTime: bookings.endTime, status: bookings.status, meetingLink: bookings.meetingLink }).from(bookings).where(and(eq(bookings.userId, userId), eq(bookings.status, 'confirmed'), gte(bookings.startTime, now))).orderBy(bookings.startTime).limit(limit);
}

export async function cancelBooking(bookingId: number, userId: number, reason?: string) {
  const [booking] = await db.update(bookings).set({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason, updatedAt: new Date() }).where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId))).returning(); return booking;
}

export async function getBookingStats(userId: number) {
  const now = new Date(); const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [stats] = await db.select({ total: sql<number>`COUNT(*)::int`, confirmed: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed')::int`, cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')::int`, upcoming: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed' AND start_time > ${now})::int` }).from(bookings).where(and(eq(bookings.userId, userId), gte(bookings.createdAt, thirtyDaysAgo))); return stats;
}
