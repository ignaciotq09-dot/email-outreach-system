import { z } from "zod";

export const MAX_CONTACTS = 25;

export const searchLeadsSchema = z.object({
  jobTitles: z.array(z.string()).optional().default([]),
  locations: z.array(z.string()).optional().default([]),
  companySizes: z.array(z.string()).optional().default([]),
  industries: z.array(z.string()).optional().default([]),
  emailStatuses: z.array(z.enum(["verified", "unverified"])).optional().default([]),
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(25),
});

export const importLeadsSchema = z.object({
  leads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    companySize: z.string().nullable().optional(),
    linkedinUrl: z.string().nullable().optional(),
  })),
});

export const aiParseSchema = z.object({
  query: z.string().min(1).max(500),
});

export const addToQueueSchema = z.object({
  leads: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    name: z.string(),
    email: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    companySize: z.string().nullable().optional(),
    linkedinUrl: z.string().nullable().optional(),
  })),
});

export const enrichSchema = z.object({
  leads: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    company: z.string().nullable().optional(),
    linkedinUrl: z.string().nullable().optional(),
  })),
});

export type LeadOutcome = {
  leadId: string;
  contactId: number | null;
  status: 'imported' | 'linked_existing' | 'duplicate_already_linked' | 'failed' | 'quota_exceeded';
  email: string | null;
  reason?: string;
};
