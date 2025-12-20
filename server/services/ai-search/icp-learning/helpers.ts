import { FEEDBACK_WEIGHTS } from "@shared/schema";
import type { PreferenceWeight } from "./types";

export function normalizeValue(value: string): string { return value.trim().toLowerCase().replace(/\s+/g, ' '); }

export function findPreferenceWeight(weights: PreferenceWeight[], value: string): PreferenceWeight | undefined { const normalized = normalizeValue(value); return weights.find(w => w.value === normalized || w.value.includes(normalized) || normalized.includes(w.value)); }

export function calculateIcpConfidence(totalDataPoints: number): number { if (totalDataPoints === 0) return 0; return Math.min(1, Math.log10(totalDataPoints + 1) / 2); }

export function calculateEngagementScore(wasOpened: boolean | null, wasReplied: boolean | null, wasConverted: boolean): number { let score = 0; if (wasOpened) score += FEEDBACK_WEIGHTS.opened; if (wasReplied) score += FEEDBACK_WEIGHTS.replied; if (wasConverted) score += FEEDBACK_WEIGHTS.converted; return score; }

export function calculatePreferenceWeights<T>(data: T[], valueExtractor: (item: T) => string | null, scoreCalculator: (item: T) => number): PreferenceWeight[] {
  const weightMap = new Map<string, { totalScore: number; count: number }>();
  for (const item of data) { const value = valueExtractor(item); if (!value) continue; const normalized = normalizeValue(value); const score = scoreCalculator(item); const existing = weightMap.get(normalized) || { totalScore: 0, count: 0 }; existing.totalScore += score; existing.count += 1; weightMap.set(normalized, existing); }
  const weights: PreferenceWeight[] = []; const now = new Date().toISOString();
  for (const [value, stats] of weightMap) { const avgScore = stats.totalScore / stats.count; const normalizedWeight = Math.max(-1, Math.min(1, avgScore / 1.5)); weights.push({ value, weight: normalizedWeight, sampleSize: stats.count, lastUpdated: now }); }
  weights.sort((a, b) => b.weight - a.weight); return weights;
}

export function incorporateFeedback(weights: PreferenceWeight[], feedbackEvents: any[], attributeKey: 'title' | 'industry' | 'companySize' | 'location'): void {
  const now = new Date().toISOString();
  for (const event of feedbackEvents) {
    const attrs = event.leadAttributes as any; if (!attrs) continue;
    let value: string | null = null;
    switch (attributeKey) { case 'title': value = attrs.title; break; case 'industry': value = attrs.industry; break; case 'companySize': value = attrs.companySize; break; case 'location': value = attrs.location; break; }
    if (!value) continue;
    const normalized = normalizeValue(value); const existing = weights.find(w => w.value === normalized);
    if (existing) { const newWeight = (existing.weight * existing.sampleSize + event.weightedScore) / (existing.sampleSize + 1); existing.weight = Math.max(-1, Math.min(1, newWeight)); existing.sampleSize += 1; existing.lastUpdated = now; }
    else { weights.push({ value: normalized, weight: Math.max(-1, Math.min(1, event.weightedScore)), sampleSize: 1, lastUpdated: now }); }
  }
  weights.sort((a, b) => b.weight - a.weight);
}
