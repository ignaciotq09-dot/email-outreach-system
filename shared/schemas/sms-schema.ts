import { pgTable, text, varchar, integer, timestamp, serial, index, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { users } from "./users-schema";
import { campaigns } from "./campaigns-schema";

export type SmsStatus = "pending" | "queued" | "sent" | "delivered" | "failed" | "undelivered";

export const sentSms = pgTable("sent_sms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  toPhone: varchar("to_phone", { length: 20 }).notNull(),
  fromPhone: varchar("from_phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  personalizedMessage: text("personalized_message"),
  status: varchar("status", { length: 20 }).default("pending"),
  twilioSid: varchar("twilio_sid", { length: 100 }),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Archival system for efficient sent SMS display
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
}, (table) => ({
  userIdIdx: index("sent_sms_user_id_idx").on(table.userId),
  contactIdIdx: index("sent_sms_contact_id_idx").on(table.contactId),
  campaignIdIdx: index("sent_sms_campaign_id_idx").on(table.campaignId),
  statusIdx: index("sent_sms_status_idx").on(table.status),
  sentAtIdx: index("sent_sms_sent_at_idx").on(table.sentAt),
  twilioSidIdx: index("sent_sms_twilio_sid_idx").on(table.twilioSid),
  // Archival indexes
  archivedIdx: index("sent_sms_archived_idx").on(table.archived),
  userIdArchivedIdx: index("sent_sms_user_id_archived_idx").on(table.userId, table.archived),
}));

export const smsSettings = pgTable("sms_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  twilioPhoneNumber: varchar("twilio_phone_number", { length: 20 }),
  enabled: integer("enabled").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sms_settings_user_id_idx").on(table.userId),
}));

export const smsReplies = pgTable("sms_replies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sentSmsId: integer("sent_sms_id").references(() => sentSms.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  fromPhone: varchar("from_phone", { length: 20 }).notNull(),
  toPhone: varchar("to_phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  twilioSid: varchar("twilio_sid", { length: 100 }),
  isOptOut: integer("is_opt_out").default(0),
  receivedAt: timestamp("received_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sms_replies_user_id_idx").on(table.userId),
  contactIdIdx: index("sms_replies_contact_id_idx").on(table.contactId),
  sentSmsIdIdx: index("sms_replies_sent_sms_id_idx").on(table.sentSmsId),
  receivedAtIdx: index("sms_replies_received_at_idx").on(table.receivedAt),
}));

export type OptOutSource = "webhook" | "twilio_sync" | "manual" | "send_error";

export const smsOptOuts = pgTable("sms_opt_outs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phone: varchar("phone", { length: 20 }).notNull(),
  twilioPhone: varchar("twilio_phone", { length: 20 }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  source: varchar("source", { length: 20 }).default("webhook"),
  optedOutAt: timestamp("opted_out_at").defaultNow(),
  resubscribedAt: timestamp("resubscribed_at"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sms_opt_outs_user_id_idx").on(table.userId),
  phoneIdx: index("sms_opt_outs_phone_idx").on(table.phone),
  twilioPhoneIdx: index("sms_opt_outs_twilio_phone_idx").on(table.twilioPhone),
  userPhoneIdx: index("sms_opt_outs_user_phone_idx").on(table.userId, table.phone),
  activeIdx: index("sms_opt_outs_active_idx").on(table.isActive),
}));

export const sentSmsRelations = relations(sentSms, ({ one }) => ({
  contact: one(contacts, {
    fields: [sentSms.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [sentSms.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [sentSms.campaignId],
    references: [campaigns.id],
  }),
}));

export const smsSettingsRelations = relations(smsSettings, ({ one }) => ({
  user: one(users, {
    fields: [smsSettings.userId],
    references: [users.id],
  }),
}));

export const smsRepliesRelations = relations(smsReplies, ({ one }) => ({
  sentSms: one(sentSms, {
    fields: [smsReplies.sentSmsId],
    references: [sentSms.id],
  }),
  contact: one(contacts, {
    fields: [smsReplies.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [smsReplies.userId],
    references: [users.id],
  }),
}));

export const smsOptOutsRelations = relations(smsOptOuts, ({ one }) => ({
  user: one(users, {
    fields: [smsOptOuts.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [smsOptOuts.contactId],
    references: [contacts.id],
  }),
}));

export const insertSentSmsSchema = createInsertSchema(sentSms).omit({
  id: true,
  sentAt: true,
  updatedAt: true,
});

export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsReplySchema = createInsertSchema(smsReplies).omit({
  id: true,
  receivedAt: true,
});

export const insertSmsOptOutSchema = createInsertSchema(smsOptOuts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSentSms = z.infer<typeof insertSentSmsSchema>;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type InsertSmsReply = z.infer<typeof insertSmsReplySchema>;
export type InsertSmsOptOut = z.infer<typeof insertSmsOptOutSchema>;

export type SentSms = typeof sentSms.$inferSelect;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type SmsReply = typeof smsReplies.$inferSelect;
export type SmsOptOut = typeof smsOptOuts.$inferSelect;

export type SentSmsWithContact = SentSms & {
  contact: typeof contacts.$inferSelect;
};
