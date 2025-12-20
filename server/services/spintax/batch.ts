import type { Contact } from "@shared/schema";
import type { SpintaxVariation } from "./types";
import { generateEmailVariations } from "./generator";
import { personalizeVariation } from "./personalization";

export async function generateBatchVariations(userId: number, campaignId: number, contacts: Contact[], originalSubject: string, originalBody: string): Promise<Map<number, SpintaxVariation>> {
  const variationsMap = new Map<number, SpintaxVariation>(); const batchSize = 10; const batches: Contact[][] = []; for (let i = 0; i < contacts.length; i += batchSize) batches.push(contacts.slice(i, i + batchSize));
  for (const batch of batches) { const variations = await generateEmailVariations({ userId, campaignId, originalSubject, originalBody, numVariations: Math.min(batch.length + 2, 10) }); for (let i = 0; i < batch.length; i++) { const contact = batch[i]; const variation = variations[i % variations.length]; const personalizedVariation: SpintaxVariation = { ...variation, subject: personalizeVariation(variation.subject, contact), body: personalizeVariation(variation.body, contact) }; variationsMap.set(contact.id, personalizedVariation); } }
  console.log(`[SpintaxGenerator] Generated batch variations for ${contacts.length} contacts`); return variationsMap;
}
