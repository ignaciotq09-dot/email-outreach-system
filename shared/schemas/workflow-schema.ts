import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";
import { contacts } from "./contacts-schema";
import { campaigns } from "./campaigns-schema";

export type WorkflowStatus = "draft" | "active" | "paused" | "completed" | "failed";
export type WorkflowNodeType = "trigger" | "action" | "condition" | "delay" | "end";
export type WorkflowActionType = 
  | "find_leads" 
  | "send_email" 
  | "send_sms" 
  | "send_linkedin_connection" 
  | "send_linkedin_message"
  | "wait"
  | "check_reply"
  | "check_open"
  | "check_click"
  | "add_to_campaign"
  | "remove_from_campaign"
  | "update_contact"
  | "webhook"
  | "ai_personalize";

export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed" | "paused" | "cancelled";
export type WorkflowStepStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "waiting";

export type WorkflowChannels = {
  email: boolean;
  sms: boolean;
  linkedin: boolean;
};

export type WorkflowAIDirectives = {
  researchCriteria?: string;
  emailTemplate?: string;
  smsTemplate?: string;
  linkedinTemplate?: string;
  personalizationLevel?: 'minimal' | 'moderate' | 'high';
  targetAudience?: string;
};

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("draft"),
  version: integer("version").default(1),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  viewport: jsonb("viewport").default({ x: 0, y: 0, zoom: 1 }),
  aiConversationHistory: jsonb("ai_conversation_history").default([]),
  channels: jsonb("channels").default({ email: true, sms: false, linkedin: false }),
  aiDirectives: jsonb("ai_directives").default({}),
  scheduleEnabled: boolean("schedule_enabled").default(false),
  scheduleType: varchar("schedule_type", { length: 20 }),
  scheduleInterval: integer("schedule_interval").default(1),
  scheduleCron: varchar("schedule_cron", { length: 100 }),
  scheduleTimezone: varchar("schedule_timezone", { length: 50 }).default("America/New_York"),
  scheduleDays: jsonb("schedule_days").default([]),
  scheduleTime: varchar("schedule_time", { length: 10 }),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  totalRuns: integer("total_runs").default(0),
  successfulRuns: integer("successful_runs").default(0),
  failedRuns: integer("failed_runs").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("workflows_user_id_idx").on(table.userId),
  statusIdx: index("workflows_status_idx").on(table.status),
  nextRunAtIdx: index("workflows_next_run_at_idx").on(table.nextRunAt),
  scheduleEnabledIdx: index("workflows_schedule_enabled_idx").on(table.scheduleEnabled),
}));

export const workflowRuns = pgTable("workflow_runs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending"),
  triggeredBy: varchar("triggered_by", { length: 50 }).default("schedule"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  currentNodeId: varchar("current_node_id", { length: 100 }),
  totalSteps: integer("total_steps").default(0),
  completedSteps: integer("completed_steps").default(0),
  failedSteps: integer("failed_steps").default(0),
  contactsProcessed: integer("contacts_processed").default(0),
  emailsSent: integer("emails_sent").default(0),
  smsSent: integer("sms_sent").default(0),
  linkedinSent: integer("linkedin_sent").default(0),
  leadsFound: integer("leads_found").default(0),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  executionLog: jsonb("execution_log").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("workflow_runs_workflow_id_idx").on(table.workflowId),
  userIdIdx: index("workflow_runs_user_id_idx").on(table.userId),
  statusIdx: index("workflow_runs_status_idx").on(table.status),
  startedAtIdx: index("workflow_runs_started_at_idx").on(table.startedAt),
}));

export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => workflowRuns.id),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  userId: integer("user_id").notNull().references(() => users.id),
  nodeId: varchar("node_id", { length: 100 }).notNull(),
  nodeType: varchar("node_type", { length: 30 }),
  actionType: varchar("action_type", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  contactId: integer("contact_id").references(() => contacts.id),
  inputData: jsonb("input_data").default({}),
  outputData: jsonb("output_data").default({}),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  waitUntil: timestamp("wait_until"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  runIdIdx: index("workflow_steps_run_id_idx").on(table.runId),
  workflowIdIdx: index("workflow_steps_workflow_id_idx").on(table.workflowId),
  userIdIdx: index("workflow_steps_user_id_idx").on(table.userId),
  nodeIdIdx: index("workflow_steps_node_id_idx").on(table.nodeId),
  statusIdx: index("workflow_steps_status_idx").on(table.status),
  waitUntilIdx: index("workflow_steps_wait_until_idx").on(table.waitUntil),
}));

export const workflowContacts = pgTable("workflow_contacts", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflows.id),
  runId: integer("run_id").references(() => workflowRuns.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending"),
  currentNodeId: varchar("current_node_id", { length: 100 }),
  enteredAt: timestamp("entered_at").defaultNow(),
  exitedAt: timestamp("exited_at"),
  exitReason: varchar("exit_reason", { length: 50 }),
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  workflowIdIdx: index("workflow_contacts_workflow_id_idx").on(table.workflowId),
  runIdIdx: index("workflow_contacts_run_id_idx").on(table.runId),
  contactIdIdx: index("workflow_contacts_contact_id_idx").on(table.contactId),
  userIdIdx: index("workflow_contacts_user_id_idx").on(table.userId),
  statusIdx: index("workflow_contacts_status_idx").on(table.status),
}));

export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  isPublic: boolean("is_public").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  runs: many(workflowRuns),
  contacts: many(workflowContacts),
}));

export const workflowRunsRelations = relations(workflowRuns, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowRuns.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [workflowRuns.userId],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  contacts: many(workflowContacts),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  run: one(workflowRuns, {
    fields: [workflowSteps.runId],
    references: [workflowRuns.id],
  }),
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  user: one(users, {
    fields: [workflowSteps.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [workflowSteps.contactId],
    references: [contacts.id],
  }),
}));

export const workflowContactsRelations = relations(workflowContacts, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowContacts.workflowId],
    references: [workflows.id],
  }),
  run: one(workflowRuns, {
    fields: [workflowContacts.runId],
    references: [workflowRuns.id],
  }),
  contact: one(contacts, {
    fields: [workflowContacts.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [workflowContacts.userId],
    references: [users.id],
  }),
}));

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowContactSchema = createInsertSchema(workflowContacts).omit({
  id: true,
  enteredAt: true,
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type InsertWorkflowContact = z.infer<typeof insertWorkflowContactSchema>;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type WorkflowContact = typeof workflowContacts.$inferSelect;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  actionType?: WorkflowActionType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    icon?: string;
    color?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: {
    type: "reply" | "open" | "click" | "bounce" | "always" | "no_reply";
    value?: any;
  };
}

export interface WorkflowConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  workflowChanges?: {
    nodesAdded?: string[];
    nodesRemoved?: string[];
    edgesAdded?: string[];
    edgesRemoved?: string[];
  };
}
