import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";

export const bookingPages = pgTable("booking_pages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).default("Book a Meeting"),
  description: text("description"),
  duration: integer("duration").default(30),
  timezone: varchar("timezone", { length: 100 }).default("America/New_York"),
  bufferBefore: integer("buffer_before").default(0),
  bufferAfter: integer("buffer_after").default(15),
  minNotice: integer("min_notice").default(60),
  maxDaysInAdvance: integer("max_days_in_advance").default(30),
  availabilitySchedule: jsonb("availability_schedule").$type<{
    monday: { enabled: boolean; start: string; end: string }[];
    tuesday: { enabled: boolean; start: string; end: string }[];
    wednesday: { enabled: boolean; start: string; end: string }[];
    thursday: { enabled: boolean; start: string; end: string }[];
    friday: { enabled: boolean; start: string; end: string }[];
    saturday: { enabled: boolean; start: string; end: string }[];
    sunday: { enabled: boolean; start: string; end: string }[];
  }>().default({
    monday: [{ enabled: true, start: "09:00", end: "17:00" }],
    tuesday: [{ enabled: true, start: "09:00", end: "17:00" }],
    wednesday: [{ enabled: true, start: "09:00", end: "17:00" }],
    thursday: [{ enabled: true, start: "09:00", end: "17:00" }],
    friday: [{ enabled: true, start: "09:00", end: "17:00" }],
    saturday: [{ enabled: false, start: "09:00", end: "17:00" }],
    sunday: [{ enabled: false, start: "09:00", end: "17:00" }],
  }),
  isActive: boolean("is_active").default(true),
  requireConfirmation: boolean("require_confirmation").default(false),
  enableGoogleMeet: boolean("enable_google_meet").default(true),
  customQuestions: jsonb("custom_questions").$type<{ question: string; required: boolean }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("booking_pages_user_id_idx").on(table.userId),
  slugIdx: index("booking_pages_slug_idx").on(table.slug),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookingPageId: integer("booking_page_id").notNull().references(() => bookingPages.id),
  contactId: integer("contact_id").references(() => contacts.id),
  guestName: varchar("guest_name", { length: 255 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }).notNull(),
  guestPhone: varchar("guest_phone", { length: 50 }),
  guestNotes: text("guest_notes"),
  customAnswers: jsonb("custom_answers").$type<{ question: string; answer: string }[]>(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: varchar("timezone", { length: 100 }).default("America/New_York"),
  status: varchar("status", { length: 50 }).default("confirmed"),
  googleEventId: varchar("google_event_id", { length: 500 }),
  outlookEventId: varchar("outlook_event_id", { length: 500 }),
  meetingLink: text("meeting_link"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("bookings_user_id_idx").on(table.userId),
  bookingPageIdIdx: index("bookings_booking_page_id_idx").on(table.bookingPageId),
  contactIdIdx: index("bookings_contact_id_idx").on(table.contactId),
  startTimeIdx: index("bookings_start_time_idx").on(table.startTime),
  statusIdx: index("bookings_status_idx").on(table.status),
  guestEmailIdx: index("bookings_guest_email_idx").on(table.guestEmail),
}));

export const bookingPagesRelations = relations(bookingPages, ({ one, many }) => ({
  user: one(users, {
    fields: [bookingPages.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  bookingPage: one(bookingPages, {
    fields: [bookings.bookingPageId],
    references: [bookingPages.id],
  }),
  contact: one(contacts, {
    fields: [bookings.contactId],
    references: [contacts.id],
  }),
}));

export const insertBookingPageSchema = createInsertSchema(bookingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBookingPage = z.infer<typeof insertBookingPageSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type BookingPage = typeof bookingPages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
