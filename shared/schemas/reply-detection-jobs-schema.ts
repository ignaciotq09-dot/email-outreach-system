/**
 * Reply Detection Jobs Schema v2.0
 * 
 * Persistent job queue for 100% reliable reply detection.
 * Tracks job lifecycle: pending → queued → executing → verified → failed → dead
 */

import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sentEmails, contacts, users } from "../schema";

export type ReplyDetectionJobStatus = 
  | "pending"      
  | "queued"       
  | "executing"    
  | "verified"     
  | "failed"       
  | "dead";        

export type ReplyDetectionJobType =
  | "on_send"      
  | "scheduled"    
  | "reconciliation"
  | "manual_recheck"
  | "history_sync";

export const replyDetectionJobs = pgTable("reply_detection_jobs", {
  id: serial("id").primaryKey(),
  
  userId: integer("user_id").notNull().references(() => users.id),
  sentEmailId: integer("sent_email_id").notNull().references(() => sentEmails.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  
  jobType: varchar("job_type", { length: 50 }).notNull().$type<ReplyDetectionJobType>(),
  status: varchar("status", { length: 20 }).notNull().default("pending").$type<ReplyDetectionJobStatus>(),
  priority: integer("priority").notNull().default(5),
  
  provider: varchar("provider", { length: 20 }).notNull(),
  
  scheduledFor: timestamp("scheduled_for").notNull(),
  
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at"),
  
  layersExecuted: integer("layers_executed").default(0),
  layersHealthy: integer("layers_healthy").default(0),
  quorumMet: boolean("quorum_met"),
  replyFound: boolean("reply_found"),
  
  lastError: text("last_error"),
  errorCount: integer("error_count").notNull().default(0),
  
  metadata: jsonb("metadata").$type<{
    gmailThreadId?: string;
    gmailMessageId?: string;
    contactEmail?: string;
    contactName?: string;
    subject?: string;
    sentAt?: string;
    triggeredBy?: string;
  }>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("reply_detection_jobs_status_idx").on(table.status),
  scheduledForIdx: index("reply_detection_jobs_scheduled_for_idx").on(table.scheduledFor),
  sentEmailIdIdx: index("reply_detection_jobs_sent_email_id_idx").on(table.sentEmailId),
  userIdStatusIdx: index("reply_detection_jobs_user_status_idx").on(table.userId, table.status),
  priorityIdx: index("reply_detection_jobs_priority_idx").on(table.priority),
}));

export const replyDetectionRuns = pgTable("reply_detection_runs", {
  id: serial("id").primaryKey(),
  
  jobId: integer("job_id").notNull().references(() => replyDetectionJobs.id),
  runNumber: integer("run_number").notNull().default(1),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  
  healthCheckPassed: boolean("health_check_passed"),
  healthCheckDetails: jsonb("health_check_details").$type<{
    tokenValid?: boolean;
    providerHealthy?: boolean;
    layersReady?: string[];
    errorMessage?: string;
  }>(),
  
  layerResults: jsonb("layer_results").$type<Array<{
    layer: string;
    healthy: boolean;
    found: boolean;
    messagesScanned: number;
    queriesRun: string[];
    durationMs: number;
    error?: string;
  }>>(),
  
  quorumResult: jsonb("quorum_result").$type<{
    quorumMet: boolean;
    healthyLayers: string[];
    foundLayers: string[];
    failedLayers: string[];
  }>(),
  
  replyFound: boolean("reply_found"),
  replyMessageId: varchar("reply_message_id", { length: 255 }),
  replySavedToDb: boolean("reply_saved_to_db"),
  
  verificationPassed: boolean("verification_passed"),
  verificationDetails: jsonb("verification_details").$type<{
    allLayersRan?: boolean;
    quorumSatisfied?: boolean;
    dbWriteConfirmed?: boolean;
    historyBaselineAdvanced?: boolean;
    errors?: string[];
  }>(),
  
  outcome: varchar("outcome", { length: 20 }).$type<"success" | "partial" | "failed" | "retrying">(),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index("reply_detection_runs_job_id_idx").on(table.jobId),
  outcomeIdx: index("reply_detection_runs_outcome_idx").on(table.outcome),
}));

export const replyDetectionDeadLetter = pgTable("reply_detection_dead_letter", {
  id: serial("id").primaryKey(),
  
  jobId: integer("job_id").notNull().references(() => replyDetectionJobs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  sentEmailId: integer("sent_email_id").notNull().references(() => sentEmails.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  
  movedToDeadLetterAt: timestamp("moved_to_dead_letter_at").notNull().defaultNow(),
  
  totalAttempts: integer("total_attempts").notNull(),
  lastAttemptAt: timestamp("last_attempt_at"),
  
  failureHistory: jsonb("failure_history").$type<Array<{
    attemptNumber: number;
    timestamp: string;
    error: string;
    layersHealthy: number;
    quorumMet: boolean;
  }>>(),
  
  jobContext: jsonb("job_context").$type<{
    provider: string;
    contactEmail: string;
    contactName?: string;
    subject: string;
    sentAt: string;
    gmailThreadId?: string;
    gmailMessageId?: string;
    lastRunDetails?: any;
  }>(),
  
  status: varchar("status", { length: 20 }).notNull().default("pending_review").$type<
    "pending_review" | "manually_checked" | "retry_scheduled" | "skipped" | "resolved"
  >(),
  
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"),
  reviewAction: varchar("review_action", { length: 30 }).$type<
    "retry" | "manual_check" | "skip" | "mark_no_reply" | "mark_has_reply"
  >(),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("reply_detection_dead_letter_status_idx").on(table.status),
  userIdIdx: index("reply_detection_dead_letter_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("reply_detection_dead_letter_sent_email_id_idx").on(table.sentEmailId),
}));

export const replyDetectionAnomalies = pgTable("reply_detection_anomalies", {
  id: serial("id").primaryKey(),
  
  userId: integer("user_id").notNull().references(() => users.id),
  sentEmailId: integer("sent_email_id").notNull().references(() => sentEmails.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  jobId: integer("job_id").references(() => replyDetectionJobs.id),
  
  anomalyType: varchar("anomaly_type", { length: 50 }).notNull().$type<
    "quorum_failure" | "missed_reply" | "stale_detection" | "layer_timeout" | 
    "verification_failed" | "history_gap" | "duplicate_detection"
  >(),
  
  severity: varchar("severity", { length: 20 }).notNull().default("medium").$type<
    "low" | "medium" | "high" | "critical"
  >(),
  
  provider: varchar("provider", { length: 20 }).notNull(),
  
  details: jsonb("details").$type<{
    description: string;
    layersHealthy?: number;
    layersTotal?: number;
    expectedBehavior?: string;
    actualBehavior?: string;
    additionalContext?: any;
  }>(),
  
  requiresManualReview: boolean("requires_manual_review").notNull().default(false),
  
  status: varchar("status", { length: 20 }).notNull().default("open").$type<
    "open" | "investigating" | "resolved" | "wont_fix"
  >(),
  
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("reply_detection_anomalies_status_idx").on(table.status),
  anomalyTypeIdx: index("reply_detection_anomalies_type_idx").on(table.anomalyType),
  userIdIdx: index("reply_detection_anomalies_user_id_idx").on(table.userId),
  severityIdx: index("reply_detection_anomalies_severity_idx").on(table.severity),
}));

export const replyDetectionMetrics = pgTable("reply_detection_metrics", {
  id: serial("id").primaryKey(),
  
  userId: integer("user_id").notNull().references(() => users.id),
  
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull().$type<"hourly" | "daily" | "weekly">(),
  
  totalJobsProcessed: integer("total_jobs_processed").notNull().default(0),
  successfulJobs: integer("successful_jobs").notNull().default(0),
  failedJobs: integer("failed_jobs").notNull().default(0),
  retriedJobs: integer("retried_jobs").notNull().default(0),
  deadLetteredJobs: integer("dead_lettered_jobs").notNull().default(0),
  
  repliesFound: integer("replies_found").notNull().default(0),
  missedRepliesCaught: integer("missed_replies_caught").notNull().default(0),
  
  avgLayersHealthy: integer("avg_layers_healthy"),
  quorumFailureCount: integer("quorum_failure_count").notNull().default(0),
  
  layerHealthStats: jsonb("layer_health_stats").$type<{
    [layer: string]: {
      runsTotal: number;
      runsHealthy: number;
      avgDurationMs: number;
      errorCount: number;
    };
  }>(),
  
  avgProcessingTimeMs: integer("avg_processing_time_ms"),
  p95ProcessingTimeMs: integer("p95_processing_time_ms"),
  
  anomalyCount: integer("anomaly_count").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  periodIdx: index("reply_detection_metrics_period_idx").on(table.periodStart, table.periodEnd),
  userPeriodIdx: index("reply_detection_metrics_user_period_idx").on(table.userId, table.periodType),
}));

export const replyDetectionReconciliationRuns = pgTable("reply_detection_reconciliation_runs", {
  id: serial("id").primaryKey(),
  
  userId: integer("user_id").notNull().references(() => users.id),
  
  runType: varchar("run_type", { length: 20 }).notNull().$type<"hourly" | "nightly" | "manual">(),
  
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  
  emailsChecked: integer("emails_checked").notNull().default(0),
  newRepliesFound: integer("new_replies_found").notNull().default(0),
  anomaliesLogged: integer("anomalies_logged").notNull().default(0),
  jobsCreated: integer("jobs_created").notNull().default(0),
  
  historyBaselineBefore: varchar("history_baseline_before", { length: 100 }),
  historyBaselineAfter: varchar("history_baseline_after", { length: 100 }),
  
  errors: jsonb("errors").$type<string[]>(),
  
  outcome: varchar("outcome", { length: 20 }).$type<"success" | "partial" | "failed">(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  runTypeIdx: index("reply_detection_reconciliation_run_type_idx").on(table.runType),
  userIdIdx: index("reply_detection_reconciliation_user_id_idx").on(table.userId),
}));


export const detectionAlertsSent = pgTable("detection_alerts_sent", {
  id: serial("id").primaryKey(),
  
  userId: integer("user_id").notNull().references(() => users.id),
  
  alertType: varchar("alert_type", { length: 50 }).notNull().$type<"token_expired" | "sync_stale" | "consecutive_failures" | "token_expiring_soon">(),
  severity: varchar("severity", { length: 20 }).notNull().$type<"warning" | "critical">(),
  subject: varchar("subject", { length: 255 }).notNull(),
  
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("detection_alerts_sent_user_id_idx").on(table.userId),
  alertTypeIdx: index("detection_alerts_sent_alert_type_idx").on(table.alertType),
}));

export const insertReplyDetectionJobSchema = createInsertSchema(replyDetectionJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReplyDetectionRunSchema = createInsertSchema(replyDetectionRuns).omit({
  id: true,
  createdAt: true,
});

export const insertReplyDetectionDeadLetterSchema = createInsertSchema(replyDetectionDeadLetter).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReplyDetectionAnomalySchema = createInsertSchema(replyDetectionAnomalies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReplyDetectionMetricsSchema = createInsertSchema(replyDetectionMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertReplyDetectionReconciliationRunSchema = createInsertSchema(replyDetectionReconciliationRuns).omit({
  id: true,
  createdAt: true,
});


export type ReplyDetectionJob = typeof replyDetectionJobs.$inferSelect;
export type InsertReplyDetectionJob = z.infer<typeof insertReplyDetectionJobSchema>;

export type ReplyDetectionRun = typeof replyDetectionRuns.$inferSelect;
export type InsertReplyDetectionRun = z.infer<typeof insertReplyDetectionRunSchema>;

export type ReplyDetectionDeadLetterEntry = typeof replyDetectionDeadLetter.$inferSelect;
export type InsertReplyDetectionDeadLetterEntry = z.infer<typeof insertReplyDetectionDeadLetterSchema>;

export type ReplyDetectionAnomaly = typeof replyDetectionAnomalies.$inferSelect;
export type InsertReplyDetectionAnomaly = z.infer<typeof insertReplyDetectionAnomalySchema>;

export type ReplyDetectionMetricsEntry = typeof replyDetectionMetrics.$inferSelect;
export type InsertReplyDetectionMetrics = z.infer<typeof insertReplyDetectionMetricsSchema>;

export type ReplyDetectionReconciliationRun = typeof replyDetectionReconciliationRuns.$inferSelect;
export type InsertReplyDetectionReconciliationRun = z.infer<typeof insertReplyDetectionReconciliationRunSchema>;
