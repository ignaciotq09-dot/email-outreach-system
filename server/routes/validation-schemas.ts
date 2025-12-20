import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  emailTemplates,
  monitoringSettings,
  emailPreferences,
} from "@shared/schema";
import { WRITING_STYLES, type WritingStyleId } from "@shared/writing-styles";

// Input validation schemas for API endpoints

// All valid writing style IDs from the shared definition
const writingStyleIds = Object.keys(WRITING_STYLES) as [WritingStyleId, ...WritingStyleId[]];

export const generateEmailSchema = z.object({
  baseMessage: z.string().min(1, "Base message is required").max(10000, "Message too long"),
  writingStyle: z.enum(writingStyleIds).optional(),
  personaId: z.number().int().positive().optional(),
  variantDiversity: z.number().int().min(1).max(10).optional().default(5),
});

export const regenerateEmailSchema = z.object({
  baseMessage: z.string().min(1).max(10000),
  feedback: z.string().min(1).max(5000),
  writingStyle: z.enum(writingStyleIds).optional(),
  personaId: z.number().int().positive().optional(),
  variantDiversity: z.number().int().min(1).max(10).optional().default(5),
  currentVariants: z.array(z.object({
    approach: z.string(),
    subject: z.string(),
    body: z.string(),
  })).min(1).max(10),
});

export const sendToSelectedSchema = z.object({
  selectedVariant: z.object({
    approach: z.string(),
    subject: z.string().max(500),
    body: z.string().max(50000),
  }),
  contactIds: z.array(z.number().int().positive()).min(1).max(100),
});

export const sendBulkSchema = z.object({
  emails: z.array(z.object({
    contactId: z.number().int().positive(),
    subject: z.string().max(500),
    body: z.string().max(50000),
    writingStyle: z.string().optional(),
    contact: z.object({
      email: z.string().email(),
      name: z.string(),
    }),
  })).min(1).max(100),
});

export const followUpSchema = z.object({
  sentEmailId: z.number().int().positive(),
  followUpBody: z.string().min(1).max(50000),
});

export const senderInfoSchema = z.object({
  senderName: z.string().min(1).max(255),
  senderPhone: z.string().min(1).max(50),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true });

export const insertMonitoringSettingsSchema = createInsertSchema(monitoringSettings).omit({ id: true, createdAt: true, updatedAt: true });

export const updatePreferencesSchema = createInsertSchema(emailPreferences).omit({ userId: true }).partial();
