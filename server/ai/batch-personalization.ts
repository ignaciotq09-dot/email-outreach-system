/**
 * Batch Email Personalization
 * 
 * Processes multiple contacts in parallel batches for faster bulk operations.
 * Uses configurable concurrency limit to prevent API rate limiting.
 */

import type { EmailPreferences } from "@shared/schema";
import { personalizeVariantForContact } from "./email-personalization";
import type { EmailVariant } from "./openai-client";

interface ContactInfo {
    name: string;
    company: string | null;
    pronoun: string;
    notes?: string;
}

interface PersonalizedResult {
    subject: string;
    body: string;
    contactName: string;
    success: boolean;
    error?: string;
}

/**
 * Personalize an email variant for multiple contacts in parallel batches.
 * 
 * @param variant - Base email variant to personalize
 * @param contacts - Array of contact information
 * @param preferences - User's email preferences (sender info, etc.)
 * @param concurrencyLimit - Max parallel AI calls (default: 5 to avoid rate limits)
 * @returns Array of personalized results with success/failure status
 */
export async function personalizeVariantsBatch(
    variant: EmailVariant,
    contacts: ContactInfo[],
    preferences?: EmailPreferences | null,
    concurrencyLimit: number = 5
): Promise<PersonalizedResult[]> {
    console.log(`[BatchPersonalization] Processing ${contacts.length} contacts with concurrency ${concurrencyLimit}`);
    const startTime = Date.now();
    const results: PersonalizedResult[] = [];

    // Process in parallel batches
    for (let i = 0; i < contacts.length; i += concurrencyLimit) {
        const batch = contacts.slice(i, i + concurrencyLimit);
        const batchStartTime = Date.now();

        const batchResults = await Promise.allSettled(
            batch.map(async (contact) => {
                const result = await personalizeVariantForContact(
                    variant,
                    contact.name,
                    contact.company,
                    contact.pronoun,
                    contact.notes,
                    preferences
                );
                return { ...result, contactName: contact.name };
            })
        );

        // Process batch results
        for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            const contact = batch[j];

            if (result.status === 'fulfilled') {
                results.push({
                    subject: result.value.subject,
                    body: result.value.body,
                    contactName: result.value.contactName,
                    success: true,
                });
            } else {
                console.error(`[BatchPersonalization] Failed for ${contact.name}:`, result.reason);
                results.push({
                    subject: '',
                    body: '',
                    contactName: contact.name,
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                });
            }
        }

        console.log(`[BatchPersonalization] Batch ${Math.floor(i / concurrencyLimit) + 1} completed in ${Date.now() - batchStartTime}ms`);
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    console.log(`[BatchPersonalization] Completed ${successCount}/${contacts.length} in ${totalTime}ms (avg ${Math.round(totalTime / contacts.length)}ms/contact)`);

    return results;
}

/**
 * Get the successful results only from a batch personalization.
 * Useful when you want to skip failed personalizations.
 */
export function getSuccessfulResults(results: PersonalizedResult[]): PersonalizedResult[] {
    return results.filter(r => r.success);
}
