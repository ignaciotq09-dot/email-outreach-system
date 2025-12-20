import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";
import { campaigns } from "./campaigns-schema";
import { users } from "./users-schema";

// Gmail History checkpoint tracking (per user for sync state)
export const gmailHistoryCheckpoint = pgTable("gmail_history_checkpoint", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  lastHistoryId: varchar("last_history_id", { length: 100 }).notNull(),
  lastCheckedAt: timestamp("last_checked_at").notNull().defaultNow(),
  lastFullSyncAt: timestamp("last_full_sync_at"),
  syncStatus: varchar("sync_status", { length: 20 }).default("active").$type<
    "active" | "paused" | "error" | "token_expired"
  >(),
  errorMessage: text("error_message"),
  consecutiveErrors: integer("consecutive_errors").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("gmail_history_checkpoint_user_id_idx").on(table.userId),
  userEmailIdx: index("gmail_history_checkpoint_user_email_idx").on(table.userEmail),
  syncStatusIdx: index("gmail_history_checkpoint_sync_status_idx").on(table.syncStatus),
}));

// Processed messages deduplication - ensures we never process the same message twice
export const processedGmailMessages = pgTable("processed_gmail_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }).notNull(),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  messageIdHeader: varchar("message_id_header", { length: 500 }),
  inReplyToHeader: varchar("in_reply_to_header", { length: 500 }),
  referencesHeader: text("references_header"),
  fromEmail: varchar("from_email", { length: 255 }),
  subject: varchar("subject", { length: 1000 }),
  receivedAt: timestamp("received_at"),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  isReply: boolean("is_reply").default(false),
  isAutoReply: boolean("is_auto_reply").default(false),
  isBounce: boolean("is_bounce").default(false),
  matchedSentEmailId: integer("matched_sent_email_id"),
  matchedContactId: integer("matched_contact_id"),
  detectionLayer: varchar("detection_layer", { length: 50 }),
  processingNotes: text("processing_notes"),
}, (table) => ({
  // Unique constraint to prevent race conditions in parallel processing
  userMessageUnique: index("processed_gmail_messages_user_message_unique_idx")
    .on(table.userId, table.gmailMessageId),
  messageIdHeaderIdx: index("processed_gmail_messages_message_id_header_idx").on(table.messageIdHeader),
  inReplyToIdx: index("processed_gmail_messages_in_reply_to_idx").on(table.inReplyToHeader),
  processedAtIdx: index("processed_gmail_messages_processed_at_idx").on(table.processedAt),
}));

// Reply detection audit log - complete trail of every detection decision
export const replyDetectionAuditLog = pgTable("reply_detection_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sentEmailId: integer("sent_email_id"),
  contactId: integer("contact_id"),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  detectionLayer: varchar("detection_layer", { length: 50 }).notNull(),
  detectionMethod: varchar("detection_method", { length: 100 }),
  resultFound: boolean("result_found").notNull(),
  isAutoReply: boolean("is_auto_reply").default(false),
  isBounce: boolean("is_bounce").default(false),
  matchReason: text("match_reason"),
  noMatchReason: text("no_match_reason"),
  gmailQuery: varchar("gmail_query", { length: 1000 }),
  messagesScanned: integer("messages_scanned").default(0),
  processingTimeMs: integer("processing_time_ms"),
  apiCallsUsed: integer("api_calls_used").default(1),
  errorMessage: text("error_message"),
  rawHeaders: jsonb("raw_headers").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("reply_detection_audit_log_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("reply_detection_audit_log_sent_email_id_idx").on(table.sentEmailId),
  detectionLayerIdx: index("reply_detection_audit_log_layer_idx").on(table.detectionLayer),
  createdAtIdx: index("reply_detection_audit_log_created_at_idx").on(table.createdAt),
}));

// Token health monitoring - track OAuth token status proactively
export const oauthTokenHealth = pgTable("oauth_token_health", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: varchar("provider", { length: 20 }).notNull(),
  lastHealthCheck: timestamp("last_health_check").notNull().defaultNow(),
  isHealthy: boolean("is_healthy").notNull().default(true),
  lastSuccessfulApiCall: timestamp("last_successful_api_call"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  lastFailureReason: text("last_failure_reason"),
  expiresAt: timestamp("expires_at"),
  needsReconnect: boolean("needs_reconnect").default(false),
  alertSentAt: timestamp("alert_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userProviderIdx: index("oauth_token_health_user_provider_idx").on(table.userId, table.provider),
  healthyIdx: index("oauth_token_health_healthy_idx").on(table.isHealthy),
  needsReconnectIdx: index("oauth_token_health_needs_reconnect_idx").on(table.needsReconnect),
}));

export const scheduledJobs = pgTable("scheduled_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: job belongs to a user
  jobType: varchar("job_type", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastAttempt: timestamp("last_attempt"),
  error: text("error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("scheduled_jobs_user_id_idx").on(table.userId),
  jobTypeIdx: index("scheduled_jobs_job_type_idx").on(table.jobType),
  statusIdx: index("scheduled_jobs_status_idx").on(table.status),
  scheduledForIdx: index("scheduled_jobs_scheduled_for_idx").on(table.scheduledFor),
}));

export const enrichmentJobs = pgTable("enrichment_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: job belongs to a user
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  status: varchar("status", { length: 50 }).default("pending"),
  enrichmentType: varchar("enrichment_type", { length: 100 }),
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("enrichment_jobs_user_id_idx").on(table.userId),
  contactIdIdx: index("enrichment_jobs_contact_id_idx").on(table.contactId),
  statusIdx: index("enrichment_jobs_status_idx").on(table.status),
}));

export const warmUpActivity = pgTable("warm_up_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: activity belongs to a user
  emailsSentToday: integer("emails_sent_today").default(0),
  targetPerDay: integer("target_per_day").default(10),
  lastEmailSent: timestamp("last_email_sent"),
  date: timestamp("date").defaultNow().notNull(),
  bounceRate: integer("bounce_rate").default(0),
  spamComplaints: integer("spam_complaints").default(0),
  deliveryRate: integer("delivery_rate").default(100),
}, (table) => ({
  userIdIdx: index("warm_up_activity_user_id_idx").on(table.userId),
  dateIdx: index("warm_up_activity_date_idx").on(table.date),
  userIdDateIdx: index("warm_up_activity_user_id_date_idx").on(table.userId, table.date),
}));

export const spamScores = pgTable("spam_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: score belongs to a user
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  score: integer("score").notNull(),
  assessment: varchar("assessment", { length: 50 }),
  details: jsonb("details"),
  checkedAt: timestamp("checked_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("spam_scores_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("spam_scores_sent_email_id_idx").on(table.sentEmailId),
  campaignIdIdx: index("spam_scores_campaign_id_idx").on(table.campaignId),
}));

export const emailBounces = pgTable("email_bounces", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: bounce belongs to a user
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  bounceType: varchar("bounce_type", { length: 50 }),
  bounceReason: text("bounce_reason"),
  bouncedAt: timestamp("bounced_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("email_bounces_user_id_idx").on(table.userId),
  contactIdIdx: index("email_bounces_contact_id_idx").on(table.contactId),
  bounceTypeIdx: index("email_bounces_bounce_type_idx").on(table.bounceType),
}));

export const enrichmentJobsRelations = relations(enrichmentJobs, ({ one }) => ({
  contact: one(contacts, {
    fields: [enrichmentJobs.contactId],
    references: [contacts.id],
  }),
}));

export const spamScoresRelations = relations(spamScores, ({ one }) => ({
  sentEmail: one(sentEmails, {
    fields: [spamScores.sentEmailId],
    references: [sentEmails.id],
  }),
  campaign: one(campaigns, {
    fields: [spamScores.campaignId],
    references: [campaigns.id],
  }),
}));

export const emailBouncesRelations = relations(emailBounces, ({ one }) => ({
  contact: one(contacts, {
    fields: [emailBounces.contactId],
    references: [contacts.id],
  }),
  sentEmail: one(sentEmails, {
    fields: [emailBounces.sentEmailId],
    references: [sentEmails.id],
  }),
}));

export const insertScheduledJobSchema = createInsertSchema(scheduledJobs).omit({
  id: true,
  createdAt: true,
});

export const insertEnrichmentJobSchema = createInsertSchema(enrichmentJobs).omit({
  id: true,
  createdAt: true,
});

export const insertWarmUpActivitySchema = createInsertSchema(warmUpActivity).omit({
  id: true,
  date: true,
});

export const insertSpamScoreSchema = createInsertSchema(spamScores).omit({
  id: true,
  checkedAt: true,
});

export const insertEmailBounceSchema = createInsertSchema(emailBounces).omit({
  id: true,
  bouncedAt: true,
});

export const insertGmailHistoryCheckpointSchema = createInsertSchema(gmailHistoryCheckpoint).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcessedGmailMessageSchema = createInsertSchema(processedGmailMessages).omit({
  id: true,
  processedAt: true,
});

export const insertReplyDetectionAuditLogSchema = createInsertSchema(replyDetectionAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertOAuthTokenHealthSchema = createInsertSchema(oauthTokenHealth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScheduledJob = z.infer<typeof insertScheduledJobSchema>;
export type InsertEnrichmentJob = z.infer<typeof insertEnrichmentJobSchema>;
export type InsertWarmUpActivity = z.infer<typeof insertWarmUpActivitySchema>;
export type InsertSpamScore = z.infer<typeof insertSpamScoreSchema>;
export type InsertEmailBounce = z.infer<typeof insertEmailBounceSchema>;
export type InsertGmailHistoryCheckpoint = z.infer<typeof insertGmailHistoryCheckpointSchema>;
export type InsertProcessedGmailMessage = z.infer<typeof insertProcessedGmailMessageSchema>;
export type InsertReplyDetectionAuditLog = z.infer<typeof insertReplyDetectionAuditLogSchema>;
export type InsertOAuthTokenHealth = z.infer<typeof insertOAuthTokenHealthSchema>;

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type EnrichmentJob = typeof enrichmentJobs.$inferSelect;
export type WarmUpActivity = typeof warmUpActivity.$inferSelect;
export type SpamScore = typeof spamScores.$inferSelect;
export type EmailBounce = typeof emailBounces.$inferSelect;
export type GmailHistoryCheckpoint = typeof gmailHistoryCheckpoint.$inferSelect;
export type ProcessedGmailMessage = typeof processedGmailMessages.$inferSelect;
export type ReplyDetectionAuditLogEntry = typeof replyDetectionAuditLog.$inferSelect;
export type OAuthTokenHealth = typeof oauthTokenHealth.$inferSelect;
