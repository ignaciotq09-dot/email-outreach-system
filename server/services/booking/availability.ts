import { db } from "../../db";
import { eq, and, gte, lte } from "drizzle-orm";
import { bookingPages, bookings } from "@shared/schema";

interface AvailabilitySlot { start: Date; end: Date; available: boolean; }

export async function getAvailableSlots(bookingPageId: number, date: Date): Promise<AvailabilitySlot[]> {
  const [page] = await db.select().from(bookingPages).where(eq(bookingPages.id, bookingPageId)).limit(1);
  if (!page) return [];
  const schedule = page.availabilitySchedule as any; const dayOfWeek = date.getDay(); const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']; const dayName = dayNames[dayOfWeek]; if (!schedule?.[dayName]?.enabled) return [];
  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0); const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
  const existingBookings = await db.select().from(bookings).where(and(eq(bookings.bookingPageId, bookingPageId), eq(bookings.status, 'confirmed'), gte(bookings.startTime, startOfDay), lte(bookings.startTime, endOfDay)));
  const slots: AvailabilitySlot[] = []; const duration = page.duration || 30; const bufferBefore = page.bufferBefore || 0; const bufferAfter = page.bufferAfter || 0; const minNotice = page.minNotice || 60; const now = new Date();
  for (const block of schedule[dayName].blocks || []) { const [startHour, startMin] = block.start.split(':').map(Number); const [endHour, endMin] = block.end.split(':').map(Number); const blockStart = new Date(date); blockStart.setHours(startHour, startMin, 0, 0); const blockEnd = new Date(date); blockEnd.setHours(endHour, endMin, 0, 0); let slotStart = new Date(blockStart);
  while (slotStart.getTime() + duration * 60000 <= blockEnd.getTime()) { const slotEnd = new Date(slotStart.getTime() + duration * 60000); const isBooked = existingBookings.some(b => { const bookingStart = new Date(b.startTime).getTime() - bufferBefore * 60000; const bookingEnd = new Date(b.endTime).getTime() + bufferAfter * 60000; return slotStart.getTime() < bookingEnd && slotEnd.getTime() > bookingStart; }); const isPast = slotStart.getTime() < now.getTime() + minNotice * 60000; slots.push({ start: new Date(slotStart), end: slotEnd, available: !isBooked && !isPast }); slotStart = new Date(slotStart.getTime() + duration * 60000); } }
  return slots;
}
