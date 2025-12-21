import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { users } from "./users-schema";

export const sentEmails = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: email belongs to a user
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  sentAt: timestamp("sent_at").defaultNow(),
  replyReceived: boolean("reply_received").default(false),
  lastReplyCheck: timestamp("last_reply_check"),
  writingStyle: varchar("writing_style", { length: 50 }),
  trackingPixelId: varchar("tracking_pixel_id", { length: 100 }),
  opened: boolean("opened").default(false),
  firstOpenedAt: timestamp("first_opened_at"),
  openCount: integer("open_count").default(0),
  lastOpenedAt: timestamp("last_opened_at"),
  clicked: boolean("clicked").default(false),
  clickCount: integer("click_count").default(0),
  lastClickedAt: timestamp("last_clicked_at"),
  replySentiment: varchar("reply_sentiment", { length: 50 }),
  replyConfidence: integer("reply_confidence"),
  trackingEnabled: boolean("tracking_enabled").default(true), // Whether tracking pixels/links were embedded
  // Archival system for efficient sent emails display
  archived: boolean("archived").default(false), // Mark older emails as archived
  archivedAt: timestamp("archived_at"), // When the email was archived
}, (table) => ({
  userIdIdx: index("sent_emails_user_id_idx").on(table.userId),
  replyReceivedFalseIdx: index("sent_emails_reply_received_false_idx")
    .on(table.replyReceived)
    .where(sql`${table.replyReceived} = false`),
  sentAtIdx: index("sent_emails_sent_at_idx").on(table.sentAt),
  contactIdIdx: index("sent_emails_contact_id_idx").on(table.contactId),
  gmailThreadIdIdx: index("sent_emails_gmail_thread_id_idx").on(table.gmailThreadId),
  // Composite indexes for common query patterns
  contactIdSentAtIdx: index("sent_emails_contact_id_sent_at_idx").on(table.contactId, table.sentAt),
  userIdSentAtIdx: index("sent_emails_user_id_sent_at_idx").on(table.userId, table.sentAt),
  // Archival index for fast filtering
  archivedIdx: index("sent_emails_archived_idx").on(table.archived),
  userIdArchivedIdx: index("sent_emails_user_id_archived_idx").on(table.userId, table.archived),
}));

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: reply belongs to a user
  sentEmailId: integer("sent_email_id").notNull().references(() => sentEmails.id),
  replyReceivedAt: timestamp("reply_received_at"),
  replyContent: text("reply_content"),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("new"), // 'new' | 'handled' - for Reply Command Center
}, (table) => ({
  userIdIdx: index("replies_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("replies_sent_email_id_idx").on(table.sentEmailId),
  sentEmailIdReceivedAtIdx: index("replies_sent_email_id_received_at_idx").on(table.sentEmailId, table.replyReceivedAt),
  gmailMessageIdIdx: index("replies_gmail_message_id_idx").on(table.gmailMessageId),
  userIdReceivedAtIdx: index("replies_user_id_received_at_idx").on(table.userId, table.replyReceivedAt),
}));

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: follow-up belongs to a user
  originalEmailId: integer("original_email_id").notNull().references(() => sentEmails.id),
  followUpBody: text("follow_up_body"),
  sentAt: timestamp("sent_at").defaultNow(),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }),
}, (table) => ({
  userIdIdx: index("follow_ups_user_id_idx").on(table.userId),
  originalEmailIdIdx: index("follow_ups_original_email_id_idx").on(table.originalEmailId),
}));

// Comprehensive audit log for reply detection attempts
export const replyDetectionAudit = pgTable("reply_detection_audit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: audit belongs to a user
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  contactId: integer("contact_id").references(() => contacts.id),
  detectionLayer: varchar("detection_layer", { length: 50 }).notNull(), // 'thread', 'message_id', 'inbox_sweep', 'history_api', 'alias'
  gmailQuery: text("gmail_query"), // Exact query sent to Gmail API
  queryTimestamp: timestamp("query_timestamp").defaultNow(),
  resultFound: boolean("result_found").default(false),
  gmailMessageId: varchar("gmail_message_id", { length: 255 }),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  senderEmail: varchar("sender_email", { length: 255 }),
  matchReason: text("match_reason"), // Why this was considered a match
  headers: jsonb("headers"), // Store relevant headers for debugging
  errorMessage: text("error_message"), // If detection failed
  processingTimeMs: integer("processing_time_ms"),
  metadata: jsonb("metadata"), // Additional debugging info
}, (table) => ({
  userIdIdx: index("reply_detection_audit_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("reply_detection_audit_sent_email_id_idx").on(table.sentEmailId),
  contactIdIdx: index("reply_detection_audit_contact_id_idx").on(table.contactId),
  timestampIdx: index("reply_detection_audit_timestamp_idx").on(table.queryTimestamp),
  layerIdx: index("reply_detection_audit_layer_idx").on(table.detectionLayer),
  gmailMessageIdIdx: index("reply_detection_audit_gmail_message_id_idx").on(table.gmailMessageId),
  gmailThreadIdIdx: index("reply_detection_audit_gmail_thread_id_idx").on(table.gmailThreadId),
  userIdTimestampIdx: index("reply_detection_audit_user_id_timestamp_idx").on(table.userId, table.queryTimestamp),
}));

export const sentEmailsRelations = relations(sentEmails, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [sentEmails.contactId],
    references: [contacts.id],
  }),
  replies: many(replies),
  followUps: many(followUps),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  sentEmail: one(sentEmails, {
    fields: [replies.sentEmailId],
    references: [sentEmails.id],
  }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  originalEmail: one(sentEmails, {
    fields: [followUps.originalEmailId],
    references: [sentEmails.id],
  }),
}));

export const replyDetectionAuditRelations = relations(replyDetectionAudit, ({ one }) => ({
  sentEmail: one(sentEmails, {
    fields: [replyDetectionAudit.sentEmailId],
    references: [sentEmails.id],
  }),
  contact: one(contacts, {
    fields: [replyDetectionAudit.contactId],
    references: [contacts.id],
  }),
}));

export const insertSentEmailSchema = createInsertSchema(sentEmails).omit({
  id: true,
  sentAt: true,
  replyReceived: true,
  lastReplyCheck: true,
});

export const insertReplySchema = createInsertSchema(replies).omit({
  id: true,
});

export const insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
  sentAt: true,
});

export const insertReplyDetectionAuditSchema = createInsertSchema(replyDetectionAudit).omit({
  id: true,
  queryTimestamp: true,
});

export type InsertSentEmail = z.infer<typeof insertSentEmailSchema>;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type InsertReplyDetectionAudit = z.infer<typeof insertReplyDetectionAuditSchema>;

export type SentEmail = typeof sentEmails.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type FollowUp = typeof followUps.$inferSelect;
export type ReplyDetectionAudit = typeof replyDetectionAudit.$inferSelect;

// Types with relations for API responses
export type SentEmailWithContact = SentEmail & {
  contact: typeof contacts.$inferSelect;
  replies: Reply[];
  followUps: FollowUp[];
};
