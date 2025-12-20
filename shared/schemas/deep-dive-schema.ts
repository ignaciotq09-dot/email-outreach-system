import { pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";

export const contactDeepDive = pgTable("contact_deep_dive", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  apolloData: jsonb("apollo_data"),
  linkedinData: jsonb("linkedin_data"),
  twitterData: jsonb("twitter_data"),
  companyData: jsonb("company_data"),
  webSearchData: jsonb("web_search_data"),
  aiInsights: jsonb("ai_insights"),
  workHistory: jsonb("work_history"),
  education: jsonb("education"),
  skills: jsonb("skills"),
  triggerEvents: jsonb("trigger_events"),
  socialProfiles: jsonb("social_profiles"),
  recentActivity: jsonb("recent_activity"),
  confidenceScores: jsonb("confidence_scores"),
  lastEnriched: timestamp("last_enriched").defaultNow(),
  enrichmentStatus: varchar("enrichment_status", { length: 50 }).default("pending"),
  enrichmentError: text("enrichment_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("contact_deep_dive_user_id_idx").on(table.userId),
  contactIdIdx: index("contact_deep_dive_contact_id_idx").on(table.contactId),
}));

export const insertContactDeepDiveSchema = createInsertSchema(contactDeepDive).omit({
  id: true, createdAt: true, updatedAt: true, lastEnriched: true,
});

export type InsertContactDeepDive = z.infer<typeof insertContactDeepDiveSchema>;
export type ContactDeepDive = typeof contactDeepDive.$inferSelect;

export interface WorkHistoryEntry { company: string; title: string; startDate?: string; endDate?: string; duration?: string; description?: string; location?: string; isCurrent?: boolean; }
export interface EducationEntry { school: string; degree?: string; field?: string; startYear?: number; endYear?: number; }
export interface SocialProfile { platform: string; url: string; username?: string; followers?: number; }
export interface TriggerEvent { type: string; description: string; date?: string; source: string; relevance: string; }
export interface AIInsight { category: string; insight: string; confidence: number; actionable: boolean; source: string; }

export interface DeepDiveResult {
  contact: { id: number; name: string; email: string; company?: string; position?: string; };
  profile: { photoUrl?: string; headline?: string; summary?: string; location?: string; };
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  skills: string[];
  socialProfiles: SocialProfile[];
  companyIntel: { name?: string; industry?: string; size?: string; funding?: string; techStack?: string[]; recentNews?: string[]; competitors?: string[]; };
  triggerEvents: TriggerEvent[];
  recentActivity: { platform: string; content: string; date?: string; engagement?: string; }[];
  insights: AIInsight[];
  confidenceScores: { overall: number; apollo: number; linkedin: number; twitter: number; webSearch: number; };
  enrichedAt: string;
}
