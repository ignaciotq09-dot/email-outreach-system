import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";

// Calendar events created through the system
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  googleEventId: varchar("google_event_id", { length: 500 }),
  summary: varchar("summary", { length: 500 }).notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timeZone: varchar("time_zone", { length: 100 }).default('America/New_York'),
  attendees: jsonb("attendees"),
  conferenceLink: text("conference_link"),
  status: varchar("status", { length: 50 }).default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("calendar_events_user_id_idx").on(table.userId),
  contactIdIdx: index("calendar_events_contact_id_idx").on(table.contactId),
  startTimeIdx: index("calendar_events_start_time_idx").on(table.startTime),
  googleEventIdIdx: index("calendar_events_google_event_id_idx").on(table.googleEventId),
}));

// User meeting preferences
export const meetingPreferences = pgTable("meeting_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  defaultDuration: integer("default_duration").default(30),
  defaultLocation: text("default_location"),
  defaultTimeZone: varchar("default_time_zone", { length: 100 }).default('America/New_York'),
  enableGoogleMeet: boolean("enable_google_meet").default(true),
  bufferBefore: integer("buffer_before").default(0),
  bufferAfter: integer("buffer_after").default(0),
  workingHours: jsonb("working_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("meeting_preferences_user_id_idx").on(table.userId),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [calendarEvents.contactId],
    references: [contacts.id],
  }),
}));

export const meetingPreferencesRelations = relations(meetingPreferences, ({ one }) => ({
  user: one(users, {
    fields: [meetingPreferences.userId],
    references: [users.id],
  }),
}));

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMeetingPreferenceSchema = createInsertSchema(meetingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertMeetingPreference = z.infer<typeof insertMeetingPreferenceSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type MeetingPreference = typeof meetingPreferences.$inferSelect;
