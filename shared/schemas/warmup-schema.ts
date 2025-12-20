import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const warmupSettings = pgTable("warmup_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).default("default").unique(),
  enabled: boolean("enabled").default(true),
  currentStage: integer("current_stage").default(1),
  startDate: timestamp("start_date"),
  lastProgressCheck: timestamp("last_progress_check"),
  manualOverride: boolean("manual_override").default(false),
  customDailyLimit: integer("custom_daily_limit"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWarmupSettingsSchema = createInsertSchema(warmupSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertWarmupSettings = z.infer<typeof insertWarmupSettingsSchema>;
export type WarmupSettings = typeof warmupSettings.$inferSelect;
