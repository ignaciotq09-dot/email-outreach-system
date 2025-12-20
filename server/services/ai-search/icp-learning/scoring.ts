import type { IcpProfile } from "./types";
import { findPreferenceWeight } from "./helpers";

export async function scoreLeadByIcp(profile: IcpProfile | null, lead: { title?: string | null; industry?: string | null; companySize?: string | null; location?: string | null }): Promise<{ score: number; matchedAttributes: string[]; confidence: number }> {
  if (!profile || profile.totalDataPoints < 5) { return { score: 50, matchedAttributes: [], confidence: 0 }; }
  let totalWeight = 0; let maxPossibleWeight = 0; const matched: string[] = [];
  if (lead.title) {
    const pref = findPreferenceWeight(profile.titlePreferences, lead.title);
    if (pref) { totalWeight += pref.weight * 0.35; matched.push(`Title: ${lead.title}`); }
    maxPossibleWeight += 0.35;
  }
  if (lead.industry) {
    const pref = findPreferenceWeight(profile.industryPreferences, lead.industry);
    if (pref) { totalWeight += pref.weight * 0.25; matched.push(`Industry: ${lead.industry}`); }
    maxPossibleWeight += 0.25;
  }
  if (lead.companySize) {
    const pref = findPreferenceWeight(profile.companySizePreferences, lead.companySize);
    if (pref) { totalWeight += pref.weight * 0.2; matched.push(`Size: ${lead.companySize}`); }
    maxPossibleWeight += 0.2;
  }
  if (lead.location) {
    const pref = findPreferenceWeight(profile.locationPreferences, lead.location);
    if (pref) { totalWeight += pref.weight * 0.2; matched.push(`Location: ${lead.location}`); }
    maxPossibleWeight += 0.2;
  }
  const normalizedScore = maxPossibleWeight > 0 ? (totalWeight / maxPossibleWeight + 1) / 2 : 0.5;
  const finalScore = Math.round(normalizedScore * 100);
  return { score: Math.max(0, Math.min(100, finalScore)), matchedAttributes: matched, confidence: profile.icpConfidence };
}
