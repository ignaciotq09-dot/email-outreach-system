import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";
import { campaigns } from "./campaigns-schema";

export const emailVariations = pgTable("email_variations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  contactId: integer("contact_id").references(() => contacts.id),
  originalSubject: text("original_subject").notNull(),
  originalBody: text("original_body").notNull(),
  variationSubject: text("variation_subject").notNull(),
  variationBody: text("variation_body").notNull(),
  variationHash: varchar("variation_hash", { length: 64 }).notNull(),
  variationIndex: integer("variation_index").default(0),
  usedAt: timestamp("used_at").defaultNow(),
  sentEmailId: integer("sent_email_id"),
  opened: boolean("opened").default(false),
  replied: boolean("replied").default(false),
}, (table) => ({
  userIdIdx: index("email_variations_user_id_idx").on(table.userId),
  campaignIdIdx: index("email_variations_campaign_id_idx").on(table.campaignId),
  variationHashIdx: index("email_variations_variation_hash_idx").on(table.variationHash),
  userCampaignHashIdx: index("email_variations_user_campaign_hash_idx").on(table.userId, table.campaignId, table.variationHash),
}));

export const scheduledSends = pgTable("scheduled_sends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  channel: varchar("channel", { length: 20 }).default("email"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  timezone: varchar("timezone", { length: 100 }),
  optimizationReason: text("optimization_reason"),
  confidenceScore: real("confidence_score"),
  status: varchar("status", { length: 20 }).default("pending"),
  attempts: integer("attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  sentAt: timestamp("sent_at"),
  sentEmailId: integer("sent_email_id"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("scheduled_sends_user_id_idx").on(table.userId),
  statusIdx: index("scheduled_sends_status_idx").on(table.status),
  scheduledForIdx: index("scheduled_sends_scheduled_for_idx").on(table.scheduledFor),
  statusScheduledForIdx: index("scheduled_sends_status_scheduled_for_idx").on(table.status, table.scheduledFor),
  campaignIdIdx: index("scheduled_sends_campaign_id_idx").on(table.campaignId),
}));

export const sendTimeAnalytics = pgTable("send_time_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").references(() => contacts.id),
  sentEmailId: integer("sent_email_id"),
  channel: varchar("channel", { length: 20 }).default("email").notNull(),
  dayOfWeek: integer("day_of_week"),
  hourOfDay: integer("hour_of_day"),
  timezone: varchar("timezone", { length: 100 }),
  industry: varchar("industry", { length: 255 }),
  sentAt: timestamp("sent_at").notNull(),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
  responseTimeMinutes: integer("response_time_minutes"),
  wasOpened: boolean("was_opened").default(false),
  wasReplied: boolean("was_replied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("send_time_analytics_user_id_idx").on(table.userId),
  channelIdx: index("send_time_analytics_channel_idx").on(table.channel),
  dayHourIdx: index("send_time_analytics_day_hour_idx").on(table.dayOfWeek, table.hourOfDay),
  industryIdx: index("send_time_analytics_industry_idx").on(table.industry),
  userChannelDayHourIdx: index("send_time_analytics_user_channel_day_hour_idx").on(table.userId, table.channel, table.dayOfWeek, table.hourOfDay),
  userIndustryDayHourIdx: index("send_time_analytics_user_industry_day_hour_idx").on(table.userId, table.industry, table.dayOfWeek, table.hourOfDay),
}));

export const spintaxTemplates = pgTable("spintax_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }),
  subjectVariants: jsonb("subject_variants").notNull().$type<string[]>(),
  openingVariants: jsonb("opening_variants").notNull().$type<string[]>(),
  closingVariants: jsonb("closing_variants").notNull().$type<string[]>(),
  ctaVariants: jsonb("cta_variants").$type<string[]>(),
  usageCount: integer("usage_count").default(0),
  avgOpenRate: real("avg_open_rate"),
  avgReplyRate: real("avg_reply_rate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("spintax_templates_user_id_idx").on(table.userId),
  categoryIdx: index("spintax_templates_category_idx").on(table.category),
}));

export const emailVariationsRelations = relations(emailVariations, ({ one }) => ({
  user: one(users, {
    fields: [emailVariations.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [emailVariations.contactId],
    references: [contacts.id],
  }),
  campaign: one(campaigns, {
    fields: [emailVariations.campaignId],
    references: [campaigns.id],
  }),
}));

export const scheduledSendsRelations = relations(scheduledSends, ({ one }) => ({
  user: one(users, {
    fields: [scheduledSends.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [scheduledSends.contactId],
    references: [contacts.id],
  }),
  campaign: one(campaigns, {
    fields: [scheduledSends.campaignId],
    references: [campaigns.id],
  }),
}));

export const sendTimeAnalyticsRelations = relations(sendTimeAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [sendTimeAnalytics.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [sendTimeAnalytics.contactId],
    references: [contacts.id],
  }),
}));

export const spintaxTemplatesRelations = relations(spintaxTemplates, ({ one }) => ({
  user: one(users, {
    fields: [spintaxTemplates.userId],
    references: [users.id],
  }),
}));

export const insertEmailVariationSchema = createInsertSchema(emailVariations).omit({
  id: true,
  usedAt: true,
});

export const insertScheduledSendSchema = createInsertSchema(scheduledSends).omit({
  id: true,
  createdAt: true,
  attempts: true,
  lastAttemptAt: true,
  sentAt: true,
  sentEmailId: true,
  errorMessage: true,
});

export const insertSendTimeAnalyticsSchema = createInsertSchema(sendTimeAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertSpintaxTemplateSchema = createInsertSchema(spintaxTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  avgOpenRate: true,
  avgReplyRate: true,
});

export type InsertEmailVariation = z.infer<typeof insertEmailVariationSchema>;
export type InsertScheduledSend = z.infer<typeof insertScheduledSendSchema>;
export type InsertSendTimeAnalytics = z.infer<typeof insertSendTimeAnalyticsSchema>;
export type InsertSpintaxTemplate = z.infer<typeof insertSpintaxTemplateSchema>;

export type EmailVariation = typeof emailVariations.$inferSelect;
export type ScheduledSend = typeof scheduledSends.$inferSelect;
export type SendTimeAnalytics = typeof sendTimeAnalytics.$inferSelect;
export type SpintaxTemplate = typeof spintaxTemplates.$inferSelect;
