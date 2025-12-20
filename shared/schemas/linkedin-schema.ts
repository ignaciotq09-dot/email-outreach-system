import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { users } from "./users-schema";
import { campaigns } from "./campaigns-schema";

export type LinkedInMessageType = "connection_request" | "direct_message" | "inmail" | "follow_up";
export type LinkedInMessageStatus = "pending" | "sent" | "accepted" | "declined" | "replied" | "failed" | "withdrawn";

export const linkedinMessages = pgTable("linkedin_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  linkedinProfileUrl: varchar("linkedin_profile_url", { length: 500 }),
  messageType: varchar("message_type", { length: 30 }).default("connection_request"),
  message: text("message").notNull(),
  personalizedMessage: text("personalized_message"),
  status: varchar("status", { length: 20 }).default("pending"),
  linkedinMessageId: varchar("linkedin_message_id", { length: 255 }),
  connectionRequestId: varchar("connection_request_id", { length: 255 }),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  repliedAt: timestamp("replied_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("linkedin_messages_user_id_idx").on(table.userId),
  contactIdIdx: index("linkedin_messages_contact_id_idx").on(table.contactId),
  campaignIdIdx: index("linkedin_messages_campaign_id_idx").on(table.campaignId),
  statusIdx: index("linkedin_messages_status_idx").on(table.status),
  messageTypeIdx: index("linkedin_messages_message_type_idx").on(table.messageType),
  sentAtIdx: index("linkedin_messages_sent_at_idx").on(table.sentAt),
  linkedinMessageIdIdx: index("linkedin_messages_linkedin_message_id_idx").on(table.linkedinMessageId),
}));

export const linkedinSettings = pgTable("linkedin_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  linkedinProfileUrl: varchar("linkedin_profile_url", { length: 500 }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  linkedinUserId: varchar("linkedin_user_id", { length: 100 }),
  linkedinEmail: varchar("linkedin_email", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  connected: boolean("connected").default(false),
  dailyConnectionLimit: integer("daily_connection_limit").default(20),
  dailyMessageLimit: integer("daily_message_limit").default(50),
  connectionsSentToday: integer("connections_sent_today").default(0),
  messagesSentToday: integer("messages_sent_today").default(0),
  lastLimitReset: timestamp("last_limit_reset").defaultNow(),
  enabled: integer("enabled").default(1),
  extensionToken: varchar("extension_token", { length: 255 }),
  extensionTokenCreatedAt: timestamp("extension_token_created_at"),
  sessionCookies: jsonb("session_cookies"),
  sessionCookiesUpdatedAt: timestamp("session_cookies_updated_at"),
  extensionConnected: boolean("extension_connected").default(false),
  extensionLastVerified: timestamp("extension_last_verified"),
  phantombusterApiKey: text("phantombuster_api_key"),
  phantombusterAutoConnectAgentId: varchar("phantombuster_auto_connect_agent_id", { length: 100 }),
  phantombusterMessageSenderAgentId: varchar("phantombuster_message_sender_agent_id", { length: 100 }),
  phantombusterWebhookSecret: varchar("phantombuster_webhook_secret", { length: 255 }),
  phantombusterConnected: boolean("phantombuster_connected").default(false),
  phantombusterLastVerified: timestamp("phantombuster_last_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("linkedin_settings_user_id_idx").on(table.userId),
}));

export const linkedinReplies = pgTable("linkedin_replies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  linkedinMessageId: integer("linkedin_message_id").references(() => linkedinMessages.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  senderProfileUrl: varchar("sender_profile_url", { length: 500 }),
  message: text("message").notNull(),
  linkedinReplyId: varchar("linkedin_reply_id", { length: 255 }),
  isConnectionAcceptance: boolean("is_connection_acceptance").default(false),
  receivedAt: timestamp("received_at").defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => ({
  userIdIdx: index("linkedin_replies_user_id_idx").on(table.userId),
  contactIdIdx: index("linkedin_replies_contact_id_idx").on(table.contactId),
  linkedinMessageIdIdx: index("linkedin_replies_linkedin_message_id_idx").on(table.linkedinMessageId),
  receivedAtIdx: index("linkedin_replies_received_at_idx").on(table.receivedAt),
}));

export type LinkedInJobStatus = "pending" | "queued" | "processing" | "sent" | "failed" | "retry" | "dead_letter";
export type LinkedInJobType = "connection_request" | "direct_message" | "follow_up";

export const linkedinJobQueue = pgTable("linkedin_job_queue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  linkedinProfileUrl: varchar("linkedin_profile_url", { length: 500 }).notNull(),
  jobType: varchar("job_type", { length: 30 }).notNull().default("connection_request"),
  message: text("message").notNull(),
  personalizedMessage: text("personalized_message"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  phantombusterContainerId: varchar("phantombuster_container_id", { length: 255 }),
  phantombusterAgentId: varchar("phantombuster_agent_id", { length: 100 }),
  phantombusterLaunchId: varchar("phantombuster_launch_id", { length: 255 }),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  lastRetryAt: timestamp("last_retry_at"),
  nextRetryAt: timestamp("next_retry_at"),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  webhookReceived: boolean("webhook_received").default(false),
  preflightPassed: boolean("preflight_passed").default(false),
  sendVerified: boolean("send_verified").default(false),
  auditLog: jsonb("audit_log").default([]),
  priority: integer("priority").default(0),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("linkedin_job_queue_user_id_idx").on(table.userId),
  contactIdIdx: index("linkedin_job_queue_contact_id_idx").on(table.contactId),
  statusIdx: index("linkedin_job_queue_status_idx").on(table.status),
  jobTypeIdx: index("linkedin_job_queue_job_type_idx").on(table.jobType),
  scheduledForIdx: index("linkedin_job_queue_scheduled_for_idx").on(table.scheduledFor),
  nextRetryIdx: index("linkedin_job_queue_next_retry_idx").on(table.nextRetryAt),
  phantombusterContainerIdx: index("linkedin_job_queue_phantombuster_container_idx").on(table.phantombusterContainerId),
}));

export const linkedinSendTimeAnalytics = pgTable("linkedin_send_time_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  linkedinMessageId: integer("linkedin_message_id").references(() => linkedinMessages.id),
  messageType: varchar("message_type", { length: 30 }),
  dayOfWeek: integer("day_of_week"),
  hourOfDay: integer("hour_of_day"),
  timezone: varchar("timezone", { length: 100 }),
  industry: varchar("industry", { length: 255 }),
  sentAt: timestamp("sent_at").defaultNow(),
  wasAccepted: boolean("was_accepted").default(false),
  acceptedAt: timestamp("accepted_at"),
  wasReplied: boolean("was_replied").default(false),
  repliedAt: timestamp("replied_at"),
}, (table) => ({
  userIdIdx: index("linkedin_send_time_analytics_user_id_idx").on(table.userId),
  contactIdIdx: index("linkedin_send_time_analytics_contact_id_idx").on(table.contactId),
  dayHourIdx: index("linkedin_send_time_analytics_day_hour_idx").on(table.dayOfWeek, table.hourOfDay),
  sentAtIdx: index("linkedin_send_time_analytics_sent_at_idx").on(table.sentAt),
}));

export const linkedinMessagesRelations = relations(linkedinMessages, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [linkedinMessages.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [linkedinMessages.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [linkedinMessages.campaignId],
    references: [campaigns.id],
  }),
  replies: many(linkedinReplies),
}));

export const linkedinSettingsRelations = relations(linkedinSettings, ({ one }) => ({
  user: one(users, {
    fields: [linkedinSettings.userId],
    references: [users.id],
  }),
}));

export const linkedinRepliesRelations = relations(linkedinReplies, ({ one }) => ({
  linkedinMessage: one(linkedinMessages, {
    fields: [linkedinReplies.linkedinMessageId],
    references: [linkedinMessages.id],
  }),
  contact: one(contacts, {
    fields: [linkedinReplies.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [linkedinReplies.userId],
    references: [users.id],
  }),
}));

export const linkedinSendTimeAnalyticsRelations = relations(linkedinSendTimeAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [linkedinSendTimeAnalytics.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [linkedinSendTimeAnalytics.contactId],
    references: [contacts.id],
  }),
  linkedinMessage: one(linkedinMessages, {
    fields: [linkedinSendTimeAnalytics.linkedinMessageId],
    references: [linkedinMessages.id],
  }),
}));

export const linkedinJobQueueRelations = relations(linkedinJobQueue, ({ one }) => ({
  user: one(users, {
    fields: [linkedinJobQueue.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [linkedinJobQueue.contactId],
    references: [contacts.id],
  }),
  campaign: one(campaigns, {
    fields: [linkedinJobQueue.campaignId],
    references: [campaigns.id],
  }),
}));

export const insertLinkedinMessageSchema = createInsertSchema(linkedinMessages).omit({
  id: true,
  sentAt: true,
  updatedAt: true,
});

export const insertLinkedinSettingsSchema = createInsertSchema(linkedinSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLinkedinReplySchema = createInsertSchema(linkedinReplies).omit({
  id: true,
  receivedAt: true,
});

export const insertLinkedinSendTimeAnalyticsSchema = createInsertSchema(linkedinSendTimeAnalytics).omit({
  id: true,
  sentAt: true,
});

export const insertLinkedinJobQueueSchema = createInsertSchema(linkedinJobQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertLinkedinMessage = z.infer<typeof insertLinkedinMessageSchema>;
export type InsertLinkedinSettings = z.infer<typeof insertLinkedinSettingsSchema>;
export type InsertLinkedinReply = z.infer<typeof insertLinkedinReplySchema>;
export type InsertLinkedinSendTimeAnalytics = z.infer<typeof insertLinkedinSendTimeAnalyticsSchema>;
export type InsertLinkedinJobQueue = z.infer<typeof insertLinkedinJobQueueSchema>;

export type LinkedinMessage = typeof linkedinMessages.$inferSelect;
export type LinkedinSettings = typeof linkedinSettings.$inferSelect;
export type LinkedinReply = typeof linkedinReplies.$inferSelect;
export type LinkedinSendTimeAnalytics = typeof linkedinSendTimeAnalytics.$inferSelect;
export type LinkedinJobQueue = typeof linkedinJobQueue.$inferSelect;

export type LinkedinMessageWithContact = LinkedinMessage & {
  contact: typeof contacts.$inferSelect;
};

export type LinkedinJobQueueWithContact = LinkedinJobQueue & {
  contact: typeof contacts.$inferSelect;
};
