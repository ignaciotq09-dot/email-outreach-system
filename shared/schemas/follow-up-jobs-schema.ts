import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";
import { sequenceSteps, followUpSequences } from "./sequences-schema";
import { campaigns } from "./campaigns-schema";
import { users } from "./users-schema";

export const followUpJobStatusEnum = ['pending', 'queued', 'sending', 'sent', 'failed', 'dead', 'cancelled'] as const;
export type FollowUpJobStatus = typeof followUpJobStatusEnum[number];

export const followUpJobs = pgTable("follow_up_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: job belongs to a user
  
  campaignId: integer("campaign_id").references(() => campaigns.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  originalEmailId: integer("original_email_id").notNull().references(() => sentEmails.id),
  sequenceId: integer("sequence_id").references(() => followUpSequences.id),
  stepId: integer("step_id").references(() => sequenceSteps.id),
  stepNumber: integer("step_number").notNull(),
  
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  
  scheduledFor: timestamp("scheduled_for").notNull(),
  dueAt: timestamp("due_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  personalizedSubject: varchar("personalized_subject", { length: 500 }),
  personalizedBody: text("personalized_body"),
  
  attemptCount: integer("attempt_count").default(0),
  maxAttempts: integer("max_attempts").default(5),
  lastAttemptAt: timestamp("last_attempt_at"),
  nextRetryAt: timestamp("next_retry_at"),
  
  lastError: text("last_error"),
  errorHistory: jsonb("error_history").$type<Array<{
    attempt: number;
    error: string;
    timestamp: string;
    errorCode?: string;
  }>>(),
  
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  providerThreadId: varchar("provider_thread_id", { length: 255 }),
  verified: integer("verified").default(0),
  
  healthCheckPassed: integer("health_check_passed").default(0),
  healthCheckError: text("health_check_error"),
  
  processingTimeMs: integer("processing_time_ms"),
  
  metadata: jsonb("metadata").$type<{
    variantName?: string;
    provider?: string;
    userId?: number;
    stoppedReason?: string;
    deadLetterReason?: string;
    manualReviewId?: number;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("follow_up_jobs_user_id_idx").on(table.userId),
  statusIdx: index("follow_up_jobs_status_idx").on(table.status),
  scheduledForIdx: index("follow_up_jobs_scheduled_for_idx").on(table.scheduledFor),
  dueAtIdx: index("follow_up_jobs_due_at_idx").on(table.dueAt),
  nextRetryAtIdx: index("follow_up_jobs_next_retry_at_idx").on(table.nextRetryAt),
  originalEmailIdIdx: index("follow_up_jobs_original_email_id_idx").on(table.originalEmailId),
  contactIdIdx: index("follow_up_jobs_contact_id_idx").on(table.contactId),
  campaignIdIdx: index("follow_up_jobs_campaign_id_idx").on(table.campaignId),
  statusScheduledIdx: index("follow_up_jobs_status_scheduled_idx").on(table.status, table.scheduledFor),
  pendingDueIdx: index("follow_up_jobs_pending_due_idx")
    .on(table.status, table.dueAt)
    .where(sql`${table.status} IN ('pending', 'queued')`),
  userIdStatusIdx: index("follow_up_jobs_user_id_status_idx").on(table.userId, table.status),
}));

export const followUpJobAudit = pgTable("follow_up_job_audit", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => followUpJobs.id),
  
  action: varchar("action", { length: 50 }).notNull(),
  
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  
  message: text("message"),
  errorDetails: text("error_details"),
  
  healthCheckResult: jsonb("health_check_result").$type<{
    passed: boolean;
    providerHealthy: boolean;
    tokenValid: boolean;
    errorMessage?: string;
  }>(),
  
  sendResult: jsonb("send_result").$type<{
    success: boolean;
    messageId?: string;
    threadId?: string;
    errorCode?: string;
    errorMessage?: string;
    responseTime?: number;
  }>(),
  
  verificationResult: jsonb("verification_result").$type<{
    verified: boolean;
    foundInSent: boolean;
    checkCount: number;
    errorMessage?: string;
  }>(),
  
  processingTimeMs: integer("processing_time_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  jobIdIdx: index("follow_up_job_audit_job_id_idx").on(table.jobId),
  actionIdx: index("follow_up_job_audit_action_idx").on(table.action),
  createdAtIdx: index("follow_up_job_audit_created_at_idx").on(table.createdAt),
}));

export const followUpDeadLetter = pgTable("follow_up_dead_letter", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: dead letter belongs to a user
  jobId: integer("job_id").notNull().references(() => followUpJobs.id),
  
  originalEmailId: integer("original_email_id").notNull().references(() => sentEmails.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  
  reason: text("reason").notNull(),
  
  totalAttempts: integer("total_attempts").notNull(),
  errorSummary: text("error_summary"),
  
  fullContext: jsonb("full_context").$type<{
    subject?: string;
    body?: string;
    contactEmail?: string;
    contactName?: string;
    campaignId?: number;
    sequenceId?: number;
    stepNumber?: number;
    errorHistory?: Array<{ attempt: number; error: string; timestamp: string }>;
  }>(),
  
  reviewStatus: varchar("review_status", { length: 20 }).default('pending'),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewAction: varchar("review_action", { length: 20 }),
  reviewNotes: text("review_notes"),
  
  retriedJobId: integer("retried_job_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("follow_up_dead_letter_user_id_idx").on(table.userId),
  jobIdIdx: index("follow_up_dead_letter_job_id_idx").on(table.jobId),
  reviewStatusIdx: index("follow_up_dead_letter_review_status_idx").on(table.reviewStatus),
  createdAtIdx: index("follow_up_dead_letter_created_at_idx").on(table.createdAt),
  userIdReviewStatusIdx: index("follow_up_dead_letter_user_id_review_status_idx").on(table.userId, table.reviewStatus),
}));

export const followUpReconciliation = pgTable("follow_up_reconciliation", {
  id: serial("id").primaryKey(),
  
  runType: varchar("run_type", { length: 20 }).notNull(),
  
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  
  emailsChecked: integer("emails_checked").default(0),
  missedFollowUpsFound: integer("missed_follow_ups_found").default(0),
  jobsCreated: integer("jobs_created").default(0),
  jobsRetried: integer("jobs_retried").default(0),
  anomaliesLogged: integer("anomalies_logged").default(0),
  
  errors: jsonb("errors").$type<Array<{
    type: string;
    message: string;
    context?: any;
  }>>(),
  
  summary: text("summary"),
  
  metadata: jsonb("metadata"),
}, (table) => ({
  runTypeIdx: index("follow_up_reconciliation_run_type_idx").on(table.runType),
  startedAtIdx: index("follow_up_reconciliation_started_at_idx").on(table.startedAt),
}));

export const followUpJobsRelations = relations(followUpJobs, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [followUpJobs.campaignId],
    references: [campaigns.id],
  }),
  contact: one(contacts, {
    fields: [followUpJobs.contactId],
    references: [contacts.id],
  }),
  originalEmail: one(sentEmails, {
    fields: [followUpJobs.originalEmailId],
    references: [sentEmails.id],
  }),
  sequence: one(followUpSequences, {
    fields: [followUpJobs.sequenceId],
    references: [followUpSequences.id],
  }),
  step: one(sequenceSteps, {
    fields: [followUpJobs.stepId],
    references: [sequenceSteps.id],
  }),
  auditLogs: many(followUpJobAudit),
}));

export const followUpJobAuditRelations = relations(followUpJobAudit, ({ one }) => ({
  job: one(followUpJobs, {
    fields: [followUpJobAudit.jobId],
    references: [followUpJobs.id],
  }),
}));

export const followUpDeadLetterRelations = relations(followUpDeadLetter, ({ one }) => ({
  job: one(followUpJobs, {
    fields: [followUpDeadLetter.jobId],
    references: [followUpJobs.id],
  }),
  originalEmail: one(sentEmails, {
    fields: [followUpDeadLetter.originalEmailId],
    references: [sentEmails.id],
  }),
  contact: one(contacts, {
    fields: [followUpDeadLetter.contactId],
    references: [contacts.id],
  }),
}));

export const insertFollowUpJobSchema = createInsertSchema(followUpJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowUpJobAuditSchema = createInsertSchema(followUpJobAudit).omit({
  id: true,
  createdAt: true,
});

export const insertFollowUpDeadLetterSchema = createInsertSchema(followUpDeadLetter).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowUpReconciliationSchema = createInsertSchema(followUpReconciliation).omit({
  id: true,
  startedAt: true,
});

export type InsertFollowUpJob = z.infer<typeof insertFollowUpJobSchema>;
export type InsertFollowUpJobAudit = z.infer<typeof insertFollowUpJobAuditSchema>;
export type InsertFollowUpDeadLetter = z.infer<typeof insertFollowUpDeadLetterSchema>;
export type InsertFollowUpReconciliation = z.infer<typeof insertFollowUpReconciliationSchema>;

export type FollowUpJob = typeof followUpJobs.$inferSelect;
export type FollowUpJobAudit = typeof followUpJobAudit.$inferSelect;
export type FollowUpDeadLetter = typeof followUpDeadLetter.$inferSelect;
export type FollowUpReconciliation = typeof followUpReconciliation.$inferSelect;
