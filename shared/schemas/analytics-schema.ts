import { pgTable, varchar, integer, jsonb, timestamp, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";
import { campaigns } from "./campaigns-schema";
import { users } from "./users-schema";

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: event belongs to a user
  eventType: varchar("event_type", { length: 50 }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  metadata: jsonb("metadata"),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 100 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("analytics_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("analytics_events_event_type_idx").on(table.eventType),
  contactIdIdx: index("analytics_events_contact_id_idx").on(table.contactId),
  sentEmailIdIdx: index("analytics_events_sent_email_id_idx").on(table.sentEmailId),
  campaignIdIdx: index("analytics_events_campaign_id_idx").on(table.campaignId),
  timestampIdx: index("analytics_events_timestamp_idx").on(table.timestamp),
  userIdTimestampIdx: index("analytics_events_user_id_timestamp_idx").on(table.userId, table.timestamp),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  contact: one(contacts, {
    fields: [analyticsEvents.contactId],
    references: [contacts.id],
  }),
  sentEmail: one(sentEmails, {
    fields: [analyticsEvents.sentEmailId],
    references: [sentEmails.id],
  }),
  campaign: one(campaigns, {
    fields: [analyticsEvents.campaignId],
    references: [campaigns.id],
  }),
}));

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Email optimization tracking
export const optimizationRuns = pgTable("optimization_runs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: optimization run belongs to a user
  emailId: integer("email_id"),
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  variantId: varchar("variant_id", { length: 100 }),
  rulesApplied: jsonb("rules_applied"),
  scores: jsonb("scores"), // {subject: 85, body: 75, personalization: 90, etc}
  predictions: jsonb("predictions"), // {openRate: 35.5, responseRate: 12.5, etc}
  suggestions: jsonb("suggestions"),
  intent: varchar("intent", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  seniorityLevel: varchar("seniority_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("optimization_runs_user_id_idx").on(table.userId),
  sentEmailIdIdx: index("optimization_runs_sent_email_id_idx").on(table.sentEmailId),
  intentIdx: index("optimization_runs_intent_idx").on(table.intent),
  industryIdx: index("optimization_runs_industry_idx").on(table.industry),
  createdAtIdx: index("optimization_runs_created_at_idx").on(table.createdAt),
}));

// A/B test configuration
export const abTests = pgTable("ab_tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: A/B test belongs to a user
  experimentId: varchar("experiment_id", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  intentScope: varchar("intent_scope", { length: 50 }),
  industryScope: varchar("industry_scope", { length: 100 }),
  testDimension: varchar("test_dimension", { length: 50 }), // subject, psychology, length, cta
  trafficSplit: jsonb("traffic_split"), // {control: 50, variant: 50}
  status: varchar("status", { length: 20 }).default('active'), // active, paused, completed
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ab_tests_user_id_idx").on(table.userId),
  statusIdx: index("ab_tests_status_idx").on(table.status),
  intentScopeIdx: index("ab_tests_intent_scope_idx").on(table.intentScope),
}));

// A/B test results
export const abTestResults = pgTable("ab_test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: result belongs to a user
  experimentId: varchar("experiment_id", { length: 100 }).notNull().references(() => abTests.experimentId),
  variantKey: varchar("variant_key", { length: 50 }).notNull(), // control, variant_a, variant_b
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  replies: integer("replies").default(0),
  conversions: integer("conversions").default(0),
  totalSent: integer("total_sent").default(0),
  statisticalSignificance: jsonb("statistical_significance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ab_test_results_user_id_idx").on(table.userId),
  experimentIdIdx: index("ab_test_results_experiment_id_idx").on(table.experimentId),
  variantKeyIdx: index("ab_test_results_variant_key_idx").on(table.variantKey),
  sentEmailIdIdx: index("ab_test_results_sent_email_id_idx").on(table.sentEmailId),
}));

// Relations
export const optimizationRunsRelations = relations(optimizationRuns, ({ one }) => ({
  sentEmail: one(sentEmails, {
    fields: [optimizationRuns.sentEmailId],
    references: [sentEmails.id],
  }),
}));

export const abTestsRelations = relations(abTests, ({ many }) => ({
  results: many(abTestResults),
}));

export const abTestResultsRelations = relations(abTestResults, ({ one }) => ({
  test: one(abTests, {
    fields: [abTestResults.experimentId],
    references: [abTests.experimentId],
  }),
  sentEmail: one(sentEmails, {
    fields: [abTestResults.sentEmailId],
    references: [sentEmails.id],
  }),
}));

// Insert schemas
export const insertOptimizationRunSchema = createInsertSchema(optimizationRuns).omit({
  id: true,
  createdAt: true,
});

export const insertAbTestSchema = createInsertSchema(abTests).omit({
  id: true,
  createdAt: true,
});

export const insertAbTestResultSchema = createInsertSchema(abTestResults).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertOptimizationRun = z.infer<typeof insertOptimizationRunSchema>;
export type OptimizationRun = typeof optimizationRuns.$inferSelect;

export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTest = typeof abTests.$inferSelect;

export type InsertAbTestResult = z.infer<typeof insertAbTestResultSchema>;
export type AbTestResult = typeof abTestResults.$inferSelect;
