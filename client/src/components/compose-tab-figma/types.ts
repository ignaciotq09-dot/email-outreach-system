// Types for compose tab figma

import type { Contact } from "@shared/schema";

export interface EmailVariant {
    subject: string;
    body: string;
    approach: string;
}

export interface NewContactForm {
    name: string;
    email: string;
    company: string;
    position: string;
    phone: string;
    notes: string;
    pronoun: string;
}

export type WritingStyle = 'professional-adult' | 'professional-humble';

// Re-export for convenience
export type { Contact };
