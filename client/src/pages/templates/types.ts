// Type definitions for Templates page

import { z } from "zod";
import { insertEmailTemplateSchema } from "@shared/schema";

export interface EmailTemplate {
    id: number;
    name: string;
    category: string | null;
    subject: string;
    body: string;
    writingStyle: string | null;
    description: string | null;
    timesUsed: number;
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    avgOpenRate: number;
    avgReplyRate: number;
    createdAt: string;
    updatedAt: string;
}

// Form validation schema
export const templateFormSchema = insertEmailTemplateSchema.extend({
    category: z.string().min(1, "Category is required"),
    writingStyle: z.string().optional(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
