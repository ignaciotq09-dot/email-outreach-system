import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

export const emailPreferences = pgTable("email_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(), // Multi-tenant: preferences belong to a user
  tonePreference: varchar("tone_preference", { length: 100 }),
  lengthPreference: varchar("length_preference", { length: 50 }),
  styleNotes: text("style_notes"),
  defaultSignature: text("default_signature"),
  senderName: varchar("sender_name", { length: 255 }),
  senderPhone: varchar("sender_phone", { length: 50 }),
  bookingLink: varchar("booking_link", { length: 500 }),
  autoReplyEnabled: boolean("auto_reply_enabled").default(false),
  autoReplyMessage: text("auto_reply_message"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("email_preferences_user_id_idx").on(table.userId),
}));

export const autoReplyLogs = pgTable("auto_reply_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  replyId: integer("reply_id").notNull(),
  contactId: integer("contact_id").notNull(),
  originalReplyContent: text("original_reply_content"),
  intentConfidence: integer("intent_confidence"),
  intentType: varchar("intent_type", { length: 50 }),
  autoReplyContent: text("auto_reply_content"),
  sentAt: timestamp("sent_at").defaultNow(),
  status: varchar("status", { length: 30 }).default("sent"),
  pass1Result: text("pass1_result"),
  pass2Result: text("pass2_result"),
  patternValidation: text("pattern_validation"),
  auditTrail: text("audit_trail"),
  errorMessage: text("error_message"),
}, (table) => ({
  userIdIdx: index("auto_reply_logs_user_id_idx").on(table.userId),
  replyIdIdx: index("auto_reply_logs_reply_id_idx").on(table.replyId),
  sentAtIdx: index("auto_reply_logs_sent_at_idx").on(table.sentAt),
  statusIdx: index("auto_reply_logs_status_idx").on(table.status),
}));

export const monitoringSettings = pgTable("monitoring_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(), // Multi-tenant: settings belong to a user
  enabled: boolean("enabled").default(true),
  smsPhoneNumber: varchar("sms_phone_number", { length: 20 }),
  lastScanTime: timestamp("last_scan_time"),
  scanIntervalMinutes: integer("scan_interval_minutes").default(30),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("monitoring_settings_user_id_idx").on(table.userId),
}));

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertMonitoringSettingsSchema = createInsertSchema(monitoringSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertAutoReplyLogSchema = createInsertSchema(autoReplyLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type InsertMonitoringSettings = z.infer<typeof insertMonitoringSettingsSchema>;
export type InsertAutoReplyLog = z.infer<typeof insertAutoReplyLogSchema>;

export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type MonitoringSettings = typeof monitoringSettings.$inferSelect;
export type AutoReplyLog = typeof autoReplyLogs.$inferSelect;
