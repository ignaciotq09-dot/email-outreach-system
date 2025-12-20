import { pgTable, text, varchar, integer, timestamp, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: template belongs to a user
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  writingStyle: varchar("writing_style", { length: 50 }),
  description: text("description"),
  timesUsed: integer("times_used").default(0),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalReplied: integer("total_replied").default(0),
  avgOpenRate: integer("avg_open_rate").default(0),
  avgReplyRate: integer("avg_reply_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("email_templates_user_id_idx").on(table.userId),
  categoryIdx: index("email_templates_category_idx").on(table.category),
  userIdCategoryIdx: index("email_templates_user_id_category_idx").on(table.userId, table.category),
}));

// Note: Cross-module relations (campaigns) are defined in the campaigns schema file
// to avoid circular dependencies

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
