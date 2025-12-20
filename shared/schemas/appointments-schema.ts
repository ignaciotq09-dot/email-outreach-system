import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails, replies } from "./emails-schema";
import { users } from "./users-schema";

export const replyNotifications = pgTable("reply_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: notification belongs to a user
  replyId: integer("reply_id").notNull().references(() => replies.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  smsSent: boolean("sms_sent").default(false),
  smsDelivered: boolean("sms_delivered").default(false),
  smsError: text("sms_error"),
  sentAt: timestamp("sent_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("reply_notifications_user_id_idx").on(table.userId),
  replyIdIdx: index("reply_notifications_reply_id_idx").on(table.replyId),
  contactIdIdx: index("reply_notifications_contact_id_idx").on(table.contactId),
}));

export const appointmentRequests = pgTable("appointment_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: appointment belongs to a user
  replyId: integer("reply_id").notNull().references(() => replies.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  detectedAt: timestamp("detected_at").defaultNow(),
  appointmentType: varchar("appointment_type", { length: 50 }),
  suggestedDate: timestamp("suggested_date"),
  suggestedTime: varchar("suggested_time", { length: 50 }),
  duration: integer("duration"),
  location: text("location"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("pending"),
  googleCalendarEventId: varchar("google_calendar_event_id", { length: 500 }),
  aiConfidence: integer("ai_confidence"),
  rawEmailText: text("raw_email_text"),
  platform: varchar("platform", { length: 100 }),
  detectionReason: text("detection_reason"),
  redFlags: jsonb("red_flags"),
}, (table) => ({
  userIdIdx: index("appointment_requests_user_id_idx").on(table.userId),
  replyIdIdx: index("appointment_requests_reply_id_idx").on(table.replyId),
  statusIdx: index("appointment_requests_status_idx").on(table.status),
}));

export const replyNotificationsRelations = relations(replyNotifications, ({ one }) => ({
  reply: one(replies, {
    fields: [replyNotifications.replyId],
    references: [replies.id],
  }),
  contact: one(contacts, {
    fields: [replyNotifications.contactId],
    references: [contacts.id],
  }),
}));

export const appointmentRequestsRelations = relations(appointmentRequests, ({ one }) => ({
  reply: one(replies, {
    fields: [appointmentRequests.replyId],
    references: [replies.id],
  }),
  contact: one(contacts, {
    fields: [appointmentRequests.contactId],
    references: [contacts.id],
  }),
}));

export const insertReplyNotificationSchema = createInsertSchema(replyNotifications).omit({
  id: true,
  sentAt: true,
});

export const insertAppointmentRequestSchema = createInsertSchema(appointmentRequests).omit({
  id: true,
  detectedAt: true,
});

export type InsertReplyNotification = z.infer<typeof insertReplyNotificationSchema>;
export type InsertAppointmentRequest = z.infer<typeof insertAppointmentRequestSchema>;

export type ReplyNotification = typeof replyNotifications.$inferSelect;
export type AppointmentRequest = typeof appointmentRequests.$inferSelect;
