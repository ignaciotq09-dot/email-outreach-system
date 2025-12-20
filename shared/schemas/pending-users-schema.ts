import { pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pendingUsers = pgTable("pending_users", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPendingUserSchema = createInsertSchema(pendingUsers).omit({
  id: true,
  createdAt: true,
});

export const pendingUserInfoSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  companyName: z.string().min(1, "Company name is required").max(255),
  position: z.string().max(255).optional(),
});

export type InsertPendingUser = z.infer<typeof insertPendingUserSchema>;
export type PendingUserInfo = z.infer<typeof pendingUserInfoSchema>;
export type PendingUser = typeof pendingUsers.$inferSelect;
