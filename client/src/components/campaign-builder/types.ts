// Types and schema definitions for campaign builder

import { z } from "zod";
import type { CampaignContactWithContact } from "@shared/schema";

export const contactFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    company: z.string().min(1, "Company is required"),
    pronoun: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export interface CampaignBuilderProps {
    campaignId: number;
    emailSubject: string;
    emailBody: string;
    onBack: () => void;
    onNavigateToLeadFinder?: () => void;
}

// Re-export for convenience
export type { CampaignContactWithContact };
