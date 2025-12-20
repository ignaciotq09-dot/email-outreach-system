import { pgTable, text, varchar, integer, boolean, timestamp, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { contacts } from "./contacts-schema";
import { sentEmails } from "./emails-schema";
import { users } from "./users-schema";

export const followUpSequences = pgTable("follow_up_sequences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: sequence belongs to a user
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  stopOnReply: boolean("stop_on_reply").default(true),
  stopOnOpen: boolean("stop_on_open").default(false),
  stopOnClick: boolean("stop_on_click").default(false),
  stopOnMeeting: boolean("stop_on_meeting").default(true),
  totalEnrolled: integer("total_enrolled").default(0),
  totalCompleted: integer("total_completed").default(0),
  totalReplies: integer("total_replies").default(0),
  avgReplyRate: integer("avg_reply_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("follow_up_sequences_user_id_idx").on(table.userId),
  activeIdx: index("follow_up_sequences_active_idx").on(table.active),
  userIdActiveIdx: index("follow_up_sequences_user_id_active_idx").on(table.userId, table.active),
}));

export const sequenceSteps = pgTable("sequence_steps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: step belongs to a user
  sequenceId: integer("sequence_id").notNull().references(() => followUpSequences.id),
  stepNumber: integer("step_number").notNull(),
  delayDays: integer("delay_days").notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  variantName: varchar("variant_name", { length: 100 }),
  variantPercentage: integer("variant_percentage").default(100),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalReplied: integer("total_replied").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sequence_steps_user_id_idx").on(table.userId),
  sequenceIdIdx: index("sequence_steps_sequence_id_idx").on(table.sequenceId),
  stepNumberIdx: index("sequence_steps_step_number_idx").on(table.stepNumber),
}));

export const sequenceEnrollments = pgTable("sequence_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Multi-tenant: enrollment belongs to a user
  sequenceId: integer("sequence_id").notNull().references(() => followUpSequences.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  sentEmailId: integer("sent_email_id").references(() => sentEmails.id),
  currentStep: integer("current_step").default(0),
  status: varchar("status", { length: 50 }).default("active"),
  stoppedReason: varchar("stopped_reason", { length: 100 }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  lastStepSent: timestamp("last_step_sent"),
}, (table) => ({
  userIdIdx: index("sequence_enrollments_user_id_idx").on(table.userId),
  sequenceIdIdx: index("sequence_enrollments_sequence_id_idx").on(table.sequenceId),
  contactIdIdx: index("sequence_enrollments_contact_id_idx").on(table.contactId),
  statusIdx: index("sequence_enrollments_status_idx").on(table.status),
}));

export const followUpSequencesRelations = relations(followUpSequences, ({ many }) => ({
  sequenceSteps: many(sequenceSteps),
  sequenceEnrollments: many(sequenceEnrollments),
  // Note: Cross-module relations (campaigns) are defined in the campaigns schema file
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  sequence: one(followUpSequences, {
    fields: [sequenceSteps.sequenceId],
    references: [followUpSequences.id],
  }),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one }) => ({
  sequence: one(followUpSequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [followUpSequences.id],
  }),
  contact: one(contacts, {
    fields: [sequenceEnrollments.contactId],
    references: [contacts.id],
  }),
  sentEmail: one(sentEmails, {
    fields: [sequenceEnrollments.sentEmailId],
    references: [sentEmails.id],
  }),
}));

export const insertFollowUpSequenceSchema = createInsertSchema(followUpSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSequenceStepSchema = createInsertSchema(sequenceSteps).omit({
  id: true,
  createdAt: true,
});

export const insertSequenceEnrollmentSchema = createInsertSchema(sequenceEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export type InsertFollowUpSequence = z.infer<typeof insertFollowUpSequenceSchema>;
export type InsertSequenceStep = z.infer<typeof insertSequenceStepSchema>;
export type InsertSequenceEnrollment = z.infer<typeof insertSequenceEnrollmentSchema>;

export type FollowUpSequence = typeof followUpSequences.$inferSelect;
export type SequenceStep = typeof sequenceSteps.$inferSelect;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
