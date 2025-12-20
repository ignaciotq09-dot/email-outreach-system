import crypto from "crypto";
import type { EmailPreferences } from "@shared/schema";
import type { WritingStyleId } from "@shared/writing-styles";
import type { EmailVariant } from "../openai-client";
import type { QualityScore, CacheEntry } from "./types";

const variantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

export function generateCacheKey(baseMessage: string, writingStyle: WritingStyleId, preferences?: EmailPreferences | null): string {
  const normalized = { msg: baseMessage.trim().toLowerCase().replace(/\s+/g, ' '), style: writingStyle, prefs: preferences ? { tone: (preferences.tonePreference || '').trim().toLowerCase(), length: (preferences.lengthPreference || '').trim().toLowerCase(), notes: (preferences.styleNotes || '').trim().toLowerCase(), sig: (preferences.defaultSignature || '').trim() } : null };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').substring(0, 32);
}

export function getCachedVariants(key: string): { variants: EmailVariant[]; scores: QualityScore[] } | null {
  const entry = variantCache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.createdAt;
  if (age > CACHE_TTL_MS) { variantCache.delete(key); return null; }
  entry.hits++;
  variantCache.delete(key);
  variantCache.set(key, entry);
  console.log(`[EmailUltimate] CACHE HIT (age: ${Math.round(age / 1000)}s, hits: ${entry.hits})`);
  return { variants: entry.variants.map(v => ({ ...v })), scores: entry.scores.map(s => ({ ...s })) };
}

export function setCachedVariants(key: string, variants: EmailVariant[], scores: QualityScore[]): void {
  if (variantCache.size >= MAX_CACHE_SIZE) { const firstKey = variantCache.keys().next().value; if (firstKey) variantCache.delete(firstKey); }
  variantCache.set(key, { variants: variants.map(v => ({ ...v })), scores: scores.map(s => ({ ...s })), createdAt: Date.now(), hits: 0 });
}

export function getCacheStats(): { size: number; entries: Array<{ key: string; age: number; hits: number; avgScore: number }> } {
  const now = Date.now();
  const entries: Array<{ key: string; age: number; hits: number; avgScore: number }> = [];
  variantCache.forEach((entry, key) => {
    const avgScore = entry.scores.reduce((sum, s) => sum + s.overall, 0) / entry.scores.length;
    entries.push({ key: key.substring(0, 8), age: Math.round((now - entry.createdAt) / 1000), hits: entry.hits, avgScore: Math.round(avgScore) });
  });
  return { size: variantCache.size, entries };
}

export function clearCache(): void { variantCache.clear(); console.log('[EmailUltimate] Cache cleared'); }
