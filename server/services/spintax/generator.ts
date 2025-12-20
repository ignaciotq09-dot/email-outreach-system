import { callOpenAIFast } from "../../ai/openai-client";
import { db } from "../../db";
import { emailVariations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import type { SpintaxVariation, GenerateVariationsOptions } from "./types";

export function generateHash(content: string): string { return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16); }

async function getUsedVariationHashes(userId: number, campaignId?: number): Promise<string[]> { const conditions = [eq(emailVariations.userId, userId)]; if (campaignId) conditions.push(eq(emailVariations.campaignId, campaignId)); const usedVariations = await db.select({ hash: emailVariations.variationHash }).from(emailVariations).where(and(...conditions)); return usedVariations.map(v => v.hash); }

export async function generateEmailVariations(options: GenerateVariationsOptions): Promise<SpintaxVariation[]> {
  const { userId, campaignId, originalSubject, originalBody, numVariations = 5, excludeHashes = [] } = options; const usedHashes = new Set([...excludeHashes, ...(await getUsedVariationHashes(userId, campaignId))]);
  const systemPrompt = `You are an expert email copywriter specializing in creating unique variations. Create ${numVariations} distinct variations.\n\nTECHNIQUES:\n1. SYNONYM SWAPPING\n2. SENTENCE RESTRUCTURING\n3. TONE SHIFTING\n4. OPENER VARIATIONS\n5. CTA VARIATIONS\n\nRULES:\n- Each variation MUST be meaningfully different\n- Preserve core message and intent\n- Keep approximately same length (±20%)\n- NO placeholder text or [brackets]\n- Use natural, human-like language\n\nReturn JSON array with exactly ${numVariations} variations: {"subject":"...", "body":"...", "technique":"..."}`;
  const userPrompt = `Create ${numVariations} unique variations of this email:\n\nORIGINAL SUBJECT: ${originalSubject}\n\nORIGINAL BODY:\n${originalBody}`;
  try { const response = await callOpenAIFast([{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], { responseFormat: { type: "json_object" }, maxTokens: 3000 }); const parsed = JSON.parse(response); const rawVariations = parsed.variations || parsed; if (!Array.isArray(rawVariations)) throw new Error("Invalid response format from AI");
  const uniqueVariations: SpintaxVariation[] = []; for (let i = 0; i < rawVariations.length; i++) { const v = rawVariations[i]; const hash = generateHash(`${v.subject}|${v.body}`); if (!usedHashes.has(hash)) { uniqueVariations.push({ subject: v.subject, body: v.body, variationHash: hash, variationIndex: i }); usedHashes.add(hash); } }
  console.log(`[SpintaxGenerator] Generated ${uniqueVariations.length} unique variations`); return uniqueVariations; } catch (error: any) { console.error("[SpintaxGenerator] Error generating variations:", error.message); return [{ subject: originalSubject, body: originalBody, variationHash: generateHash(`${originalSubject}|${originalBody}`), variationIndex: 0 }]; }
}
