import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { bookingPages, users } from "@shared/schema";

export async function getBookingPageBySlug(slug: string) {
  const [page] = await db.select({ id: bookingPages.id, userId: bookingPages.userId, slug: bookingPages.slug, title: bookingPages.title, description: bookingPages.description, duration: bookingPages.duration, timezone: bookingPages.timezone, bufferBefore: bookingPages.bufferBefore, bufferAfter: bookingPages.bufferAfter, minNotice: bookingPages.minNotice, maxDaysInAdvance: bookingPages.maxDaysInAdvance, availabilitySchedule: bookingPages.availabilitySchedule, isActive: bookingPages.isActive, enableGoogleMeet: bookingPages.enableGoogleMeet, customQuestions: bookingPages.customQuestions, userName: users.name, userEmail: users.email, userFirstName: users.firstName, userProfileImage: users.profileImageUrl }).from(bookingPages).innerJoin(users, eq(bookingPages.userId, users.id)).where(eq(bookingPages.slug, slug)).limit(1); return page;
}

export async function getBookingPageByUserId(userId: number) {
  const [page] = await db.select().from(bookingPages).where(eq(bookingPages.userId, userId)).limit(1); return page;
}

export async function createBookingPage(userId: number, slug: string) {
  const [page] = await db.insert(bookingPages).values({ userId, slug, title: "Book a Meeting", duration: 30 }).returning(); return page;
}

export async function updateBookingPage(userId: number, updates: Partial<{ slug: string; title: string; description: string; duration: number; timezone: string; bufferBefore: number; bufferAfter: number; minNotice: number; maxDaysInAdvance: number; availabilitySchedule: any; isActive: boolean; enableGoogleMeet: boolean; customQuestions: any; }>) {
  const [page] = await db.update(bookingPages).set({ ...updates, updatedAt: new Date() }).where(eq(bookingPages.userId, userId)).returning(); return page;
}

export async function generateUniqueSlug(baseName: string): Promise<string> {
  const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = await db.select({ slug: bookingPages.slug }).from(bookingPages).where(sql`${bookingPages.slug} LIKE ${slug + '%'}`);
  if (existing.length === 0) return slug;
  let counter = 1; while (existing.some(e => e.slug === `${slug}-${counter}`)) counter++; return `${slug}-${counter}`;
}
