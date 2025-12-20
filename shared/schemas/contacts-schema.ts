import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

// Contact source types for tracking origin
export type ContactSource = "lead_finder" | "manual" | "ai_import" | "csv_import" | "unknown";

// Email verification status - simplified two-tier system
// "verified" = Apollo confirmed the email is valid
// "unverified" = All other statuses (guessed, accept_all, invalid, unavailable, etc.)
export type EmailStatus = "verified" | "unverified";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: contact belongs to a user
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  pronoun: varchar("pronoun", { length: 10 }).default(""),
  timezone: varchar("timezone", { length: 100 }),
  optimalSendTime: varchar("optimal_send_time", { length: 50 }),
  industry: varchar("industry", { length: 255 }),
  companySize: varchar("company_size", { length: 50 }),
  companyRevenue: varchar("company_revenue", { length: 100 }),
  recentNews: text("recent_news"),
  lastEnriched: timestamp("last_enriched"),
  enrichmentSource: varchar("enrichment_source", { length: 100 }),
  location: varchar("location", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  linkedinConnectionStatus: varchar("linkedin_connection_status", { length: 30 }),
  totalLinkedinReplies: integer("total_linkedin_replies").default(0),
  lastLinkedinEngagement: timestamp("last_linkedin_engagement"),
  engagementScore: integer("engagement_score").default(0),
  totalOpens: integer("total_opens").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalReplies: integer("total_replies").default(0),
  totalSmsReplies: integer("total_sms_replies").default(0),
  smsOptedOut: integer("sms_opted_out").default(0),
  smsOptedOutAt: timestamp("sms_opted_out_at"),
  lastEngagement: timestamp("last_engagement"),
  createdAt: timestamp("created_at").defaultNow(),
  // Source tracking: where this contact came from
  source: varchar("source", { length: 50 }).default("unknown"), // lead_finder, manual, ai_import, csv_import, unknown
  // Email verification status from Apollo: "verified" or "unverified"
  emailStatus: varchar("email_status", { length: 20 }).default("unverified"),
}, (table) => ({
  // EXISTING INDEXES
  userIdIdx: index("contacts_user_id_idx").on(table.userId),
  userIdEmailIdx: unique("contacts_user_id_email_idx").on(table.userId, table.email),
  sourceIdx: index("contacts_source_idx").on(table.source), // Index for fast filtering by source
  // Composite index for pagination queries (userId + createdAt)
  userIdCreatedAtIdx: index("contacts_user_id_created_at_idx").on(table.userId, table.createdAt),

  // OPTIMIZED INDEXES FOR AI SEARCH PERFORMANCE
  // Composite index for title + location searches (common pattern: "Marketing Managers in NYC")
  titleLocationIdx: index("contacts_title_location_idx").on(table.position, table.location),

  // Composite index for industry + company size (demographic filtering)
  industryCompanySizeIdx: index("contacts_industry_size_idx").on(table.industry, table.companySize),

  // Email status index for verified email filtering (high-deliverability contacts)
  emailStatusIdx: index("contacts_email_status_idx").on(table.emailStatus),

  // Company index for grouping/filtering by company name
  companyIdx: index("contacts_company_idx").on(table.company),

  // Location index for geographic searches and filtering
  locationIdx: index("contacts_location_idx").on(table.location),

  // Position/title index for job title searches and filtering
  positionIdx: index("contacts_position_idx").on(table.position),

  // Industry index for industry-based filtering
  industryIdx: index("contacts_industry_idx").on(table.industry),

  // Engagement score index for ICP scoring and result ranking
  engagementScoreIdx: index("contacts_engagement_score_idx").on(table.engagementScore),

  // Source + userId composite for filtering imported vs manual contacts
  userIdSourceIdx: index("contacts_user_id_source_idx").on(table.userId, table.source),
}));

export const contactTags = pgTable("contact_tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: tag belongs to a user
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("contact_tags_user_id_idx").on(table.userId),
  nameIdx: index("contact_tags_name_idx").on(table.name),
  userIdNameIdx: index("contact_tags_user_id_name_idx").on(table.userId, table.name),
}));

export const contactTagMapping = pgTable("contact_tag_mapping", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  tagId: integer("tag_id").notNull().references(() => contactTags.id),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  contactIdIdx: index("contact_tag_mapping_contact_id_idx").on(table.contactId),
  tagIdIdx: index("contact_tag_mapping_tag_id_idx").on(table.tagId),
}));

// Track all email aliases ever used by a contact
export const contactEmailAliases = pgTable("contact_email_aliases", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  aliasType: varchar("alias_type", { length: 50 }), // 'primary', 'secondary', 'plus_tag', 'domain_alias', 'forward'
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  verified: boolean("verified").default(false),
  source: varchar("source", { length: 100 }), // 'reply', 'manual', 'auto_detected', 'header'
  metadata: jsonb("metadata"), // Store additional info like headers, confidence scores
}, (table) => ({
  contactIdIdx: index("contact_email_aliases_contact_id_idx").on(table.contactId),
  emailIdx: index("contact_email_aliases_email_idx").on(table.emailAddress),
  uniqueContactEmail: unique("unique_contact_email").on(table.contactId, table.emailAddress), // Prevent duplicate aliases
}));


// Note: Cross-module relations (sentEmails, campaignContacts)
// are defined in their respective schema files to avoid circular dependencies

export const contactTagsRelations = relations(contactTags, ({ many }) => ({
  contactTagMapping: many(contactTagMapping),
}));

export const contactTagMappingRelations = relations(contactTagMapping, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactTagMapping.contactId],
    references: [contacts.id],
  }),
  tag: one(contactTags, {
    fields: [contactTagMapping.tagId],
    references: [contactTags.id],
  }),
}));

export const contactEmailAliasesRelations = relations(contactEmailAliases, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmailAliases.contactId],
    references: [contacts.id],
  }),
}));

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertContactTagSchema = createInsertSchema(contactTags).omit({
  id: true,
  createdAt: true,
});

export const insertContactTagMappingSchema = createInsertSchema(contactTagMapping).omit({
  id: true,
  addedAt: true,
});

export const insertContactEmailAliasSchema = createInsertSchema(contactEmailAliases).omit({
  id: true,
  firstSeen: true,
  lastSeen: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertContactTag = z.infer<typeof insertContactTagSchema>;
export type InsertContactTagMapping = z.infer<typeof insertContactTagMappingSchema>;
export type InsertContactEmailAlias = z.infer<typeof insertContactEmailAliasSchema>;

export type Contact = typeof contacts.$inferSelect;
export type ContactTag = typeof contactTags.$inferSelect;
export type ContactTagMapping = typeof contactTagMapping.$inferSelect;
export type ContactEmailAlias = typeof contactEmailAliases.$inferSelect;
