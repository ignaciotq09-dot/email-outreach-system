import { pgTable, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

export const apolloQuotas = pgTable("apollo_quotas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  monthlyEnrichmentLimit: integer("monthly_enrichment_limit").notNull().default(50),
  usedEnrichments: integer("used_enrichments").notNull().default(0),
  
  resetDate: timestamp("reset_date").notNull().default(sql`DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("apollo_quotas_user_id_idx").on(table.userId),
}));

export const apolloQuotasRelations = relations(apolloQuotas, ({ one }) => ({
  user: one(users, {
    fields: [apolloQuotas.userId],
    references: [users.id],
  }),
}));

export const insertApolloQuotaSchema = createInsertSchema(apolloQuotas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApolloQuota = z.infer<typeof insertApolloQuotaSchema>;
export type ApolloQuota = typeof apolloQuotas.$inferSelect;
