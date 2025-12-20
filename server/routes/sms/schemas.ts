import { z } from "zod";

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Authentication required" });
  next();
};

export const smsSettingsSchema = z.object({ twilioPhoneNumber: z.string().min(10).max(20) });

export const sendSmsSchema = z.object({
  contactId: z.number(),
  message: z.string().min(1).max(1600),
  campaignId: z.number().optional(),
});

export const sendBulkSmsSchema = z.object({
  contactIds: z.array(z.number()).min(1),
  message: z.string().min(1).max(1600),
  campaignId: z.number().optional(),
  writingStyle: z.string().optional(),
});

export const personalizePreviewSchema = z.object({
  baseMessage: z.string().min(1).max(500),
  contacts: z.array(z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    phone: z.string().optional(),
  })).min(1).max(10),
  writingStyleId: z.string().optional(),
  toneSliders: z.object({
    friendliness: z.number().min(0).max(100).optional(),
    urgency: z.number().min(0).max(100).optional(),
    wordiness: z.number().min(0).max(100).optional(),
    creativity: z.number().min(0).max(100).optional(),
  }).optional(),
});
