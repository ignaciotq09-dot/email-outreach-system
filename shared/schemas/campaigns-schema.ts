import { pgTable, text, varchar, integer, timestamp, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";
import { users } from "./users-schema";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: campaign belongs to a user
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  writingStyle: varchar("writing_style", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 50 }).default("draft"),
  scheduledFor: timestamp("scheduled_for"),
  sendTimePolicy: varchar("send_time_policy", { length: 50 }),
  batchSize: integer("batch_size").default(30),
  templateId: integer("template_id"),
  followUpSequenceId: integer("follow_up_sequence_id"),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalReplied: integer("total_replied").default(0),
  openRate: integer("open_rate").default(0),
  clickRate: integer("click_rate").default(0),
  replyRate: integer("reply_rate").default(0),
}, (table) => ({
  statusIdx: index("campaigns_status_idx").on(table.status),
  createdAtIdx: index("campaigns_created_at_idx").on(table.createdAt),
  scheduledForIdx: index("campaigns_scheduled_for_idx").on(table.scheduledFor),
  userIdIdx: index("campaigns_user_id_idx").on(table.userId),
  // Composite index for filtering by status and time
  statusCreatedAtIdx: index("campaigns_status_created_at_idx").on(table.status, table.createdAt),
}));

export const campaignContacts = pgTable("campaign_contacts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  addedAt: timestamp("added_at").defaultNow(),
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
}, (table) => ({
  campaignIdIdx: index("campaign_contacts_campaign_id_idx").on(table.campaignId),
  contactIdIdx: index("campaign_contacts_contact_id_idx").on(table.contactId),
  uniqueCampaignContact: index("campaign_contacts_unique_idx").on(table.campaignId, table.contactId),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  campaignContacts: many(campaignContacts),
}));

export const campaignContactsRelations = relations(campaignContacts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignContacts.campaignId],
    references: [campaigns.id],
  }),
  contact: one(contacts, {
    fields: [campaignContacts.contactId],
    references: [contacts.id],
  }),
  sentEmail: one(sentEmails, {
    fields: [campaignContacts.sentEmailId],
    references: [sentEmails.id],
  }),
}));

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignContactSchema = createInsertSchema(campaignContacts).omit({
  id: true,
  addedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertCampaignContact = z.infer<typeof insertCampaignContactSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type CampaignContact = typeof campaignContacts.$inferSelect;
