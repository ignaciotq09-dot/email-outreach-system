import type { IcpProfile, LeadAttributes, IcpScoreResult, PreferenceWeight } from './types';

function normalizeValue(value: string): string { return value.trim().toLowerCase().replace(/\s+/g, ' '); }
function findPreferenceWeight(weights: PreferenceWeight[], value: string): PreferenceWeight | undefined { const normalized = normalizeValue(value); return weights.find(w => w.value === normalized || w.value.includes(normalized) || normalized.includes(w.value)); }

export function scoreLeadSync(profile: IcpProfile | null, leadAttributes: LeadAttributes): IcpScoreResult {
  if (!profile || profile.icpConfidence < 0.2) return { score: 50, matchReasons: [], unmatchReasons: ['Not enough engagement data to score leads'] }; let score = 50; const matchReasons: string[] = []; const unmatchReasons: string[] = [];
  if (leadAttributes.title) { const titleWeight = findPreferenceWeight(profile.titlePreferences, leadAttributes.title); if (titleWeight) { score += titleWeight.weight * 15; if (titleWeight.weight > 0) matchReasons.push(`"${leadAttributes.title}" matches your ICP`); else unmatchReasons.push(`"${leadAttributes.title}" has lower engagement history`); } }
  if (leadAttributes.industry) { const industryWeight = findPreferenceWeight(profile.industryPreferences, leadAttributes.industry); if (industryWeight) { score += industryWeight.weight * 15; if (industryWeight.weight > 0) matchReasons.push(`${leadAttributes.industry} industry performs well`); } }
  if (leadAttributes.companySize) { const sizeWeight = findPreferenceWeight(profile.companySizePreferences, leadAttributes.companySize); if (sizeWeight) { score += sizeWeight.weight * 10; if (sizeWeight.weight > 0) matchReasons.push(`${leadAttributes.companySize} company size matches`); } }
  if (leadAttributes.location) { const locationWeight = findPreferenceWeight(profile.locationPreferences, leadAttributes.location); if (locationWeight) { score += locationWeight.weight * 8; if (locationWeight.weight > 0) matchReasons.push(`${leadAttributes.location} location aligns`); } }
  if (profile.icpConfidence > 0.5 && matchReasons.length === 0 && unmatchReasons.length === 0) { unmatchReasons.push('No strong ICP attribute matches found'); }
  return { score: Math.min(100, Math.max(0, score)), matchReasons, unmatchReasons };
}

export function scoreBatch<T extends LeadAttributes>(profile: IcpProfile | null, leads: T[]): Array<T & IcpScoreResult & { icpScore: number; overallScore: number }> { const startTime = Date.now(); const scoredLeads = leads.map(lead => { const scoreResult = scoreLeadSync(profile, { title: lead.title, industry: lead.industry, companySize: lead.companySize, location: lead.location }); return { ...lead, icpScore: scoreResult.score, matchReasons: scoreResult.matchReasons, unmatchReasons: scoreResult.unmatchReasons, overallScore: scoreResult.score, score: scoreResult.score }; }); const duration = Date.now() - startTime; console.log(`[BatchIcpScorer] Scored ${leads.length} leads in ${duration}ms (${(duration / leads.length).toFixed(2)}ms/lead)`); return scoredLeads; }
