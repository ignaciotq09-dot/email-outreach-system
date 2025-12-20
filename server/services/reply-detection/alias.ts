/**
 * Email alias management for contact tracking
 */

import { db } from "../../db";
import { contactEmailAliases } from "../../../shared/schemas";
import { eq, and } from "drizzle-orm";
import { extractEmailFromString } from "./utils";

/**
 * Get all known email aliases for a contact
 */
export async function getContactAliases(contactId: number): Promise<string[]> {
  const aliases = await db
    .select()
    .from(contactEmailAliases)
    .where(eq(contactEmailAliases.contactId, contactId));
  
  return aliases.map(a => a.emailAddress);
}

/**
 * Store a new email alias for a contact (for tracking reply variations)
 */
export async function storeEmailAlias(
  contactId: number,
  emailAddress: string,
  aliasType: string = 'auto_detected',
  source: string = 'reply'
): Promise<void> {
  try {
    const normalizedEmail = extractEmailFromString(emailAddress);
    
    // Check if alias already exists
    const existing = await db
      .select()
      .from(contactEmailAliases)
      .where(
        and(
          eq(contactEmailAliases.contactId, contactId),
          eq(contactEmailAliases.emailAddress, normalizedEmail)
        )
      );

    if (existing.length === 0) {
      await db.insert(contactEmailAliases).values({
        contactId,
        emailAddress: normalizedEmail,
        aliasType,
        source,
        verified: true,
        metadata: { originalFormat: emailAddress },
      });
      
      console.log(`[AliasIntelligence] Stored new alias ${normalizedEmail} for contact ${contactId}`);
    } else {
      // Update last seen
      await db
        .update(contactEmailAliases)
        .set({ lastSeen: new Date() })
        .where(
          and(
            eq(contactEmailAliases.contactId, contactId),
            eq(contactEmailAliases.emailAddress, normalizedEmail)
          )
        );
    }
  } catch (error) {
    console.error('[AliasIntelligence] Failed to store alias:', error);
  }
}