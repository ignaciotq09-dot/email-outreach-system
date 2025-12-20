import { db } from "../../db";
import { emailVariations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Contact } from "@shared/schema";
import type { SpintaxVariation, GenerateUniqueVariationOptions } from "./types";
import { generateEmailVariations, generateHash } from "./generator";
import { personalizeVariation } from "./personalization";

export async function generateUniqueVariationForContact(options: GenerateUniqueVariationOptions): Promise<SpintaxVariation> {
  const { userId, campaignId, originalSubject, originalBody, contactId, contact } = options; const existingForContact = await db.select({ hash: emailVariations.variationHash }).from(emailVariations).where(and(eq(emailVariations.userId, userId), eq(emailVariations.contactId, contactId))); const contactHashes = new Set(existingForContact.map(v => v.hash));
  const allVariations = await generateEmailVariations({ userId, campaignId, originalSubject, originalBody, numVariations: 5, excludeHashes: Array.from(contactHashes) });
  if (allVariations.length === 0) { console.log("[SpintaxGenerator] No unique variations available, generating fresh batch"); const freshVariations = await generateEmailVariations({ userId, campaignId, originalSubject, originalBody, numVariations: 3, excludeHashes: [] }); if (freshVariations.length === 0) return { subject: originalSubject, body: originalBody, variationHash: generateHash(`${originalSubject}|${originalBody}`), variationIndex: 0 }; return freshVariations[0]; }
  const selectedVariation = allVariations[0]; if (contact) { selectedVariation.body = personalizeVariation(selectedVariation.body, contact); selectedVariation.subject = personalizeVariation(selectedVariation.subject, contact); } return selectedVariation;
}
