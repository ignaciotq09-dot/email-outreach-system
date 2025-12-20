import { pgTable, serial, varchar, timestamp, boolean, integer, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

export const unsubscribes = pgTable("unsubscribes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: unsubscribe belongs to a user's list
  email: varchar("email", { length: 255 }).notNull(),
  reason: varchar("reason", { length: 500 }),
  unsubscribedAt: timestamp("unsubscribed_at").defaultNow(),
  active: boolean("active").default(true),
}, (table) => ({
  userIdIdx: index("unsubscribes_user_id_idx").on(table.userId),
  emailIdx: index("unsubscribes_email_idx").on(table.email),
  userIdEmailIdx: unique("unsubscribes_user_id_email_idx").on(table.userId, table.email), // Email unique per user
}));

export const insertUnsubscribeSchema = createInsertSchema(unsubscribes).omit({
  id: true,
  unsubscribedAt: true,
});

export type InsertUnsubscribe = z.infer<typeof insertUnsubscribeSchema>;
export type Unsubscribe = typeof unsubscribes.$inferSelect;
