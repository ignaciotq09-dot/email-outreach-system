import type { ParsedFilters, SearchCategory, MissingSignal, GuidanceTip, SuggestedAddition, AdaptiveGuidance } from "@shared/schema";
import type { IcpProfile } from "../batch-icp-scorer";

export async function generateSearchGuidance(userId: number, filters: ParsedFilters, category: SearchCategory, missingSignals: MissingSignal[], icpProfile: IcpProfile | null): Promise<{ tips: GuidanceTip[]; suggestedAdditions: SuggestedAddition[]; hasRecommendations: boolean }> {
  const tips: GuidanceTip[] = [];
  const suggestedAdditions: SuggestedAddition[] = [];
  if (!missingSignals || missingSignals.length === 0) return { tips, suggestedAdditions, hasRecommendations: false };
  for (const signal of missingSignals.slice(0, 3)) {
    tips.push({ icon: signal.importance === 'high' ? '⚡' : signal.importance === 'medium' ? '💡' : '📝', text: signal.suggestion || `Consider adding ${signal.type}`, importance: signal.importance, suggestionType: signal.type });
  }
  if (icpProfile && icpProfile.icpConfidence > 0.3) {
    if (icpProfile.preferredTitles?.length > 0 && (!filters.jobTitles || filters.jobTitles.length === 0)) { suggestedAdditions.push({ label: 'Add ICP job titles', field: 'jobTitles', values: icpProfile.preferredTitles.slice(0, 3), reasoning: 'Based on your successful outreach' }); }
    if (icpProfile.preferredIndustries?.length > 0 && (!filters.industries || filters.industries.length === 0)) { suggestedAdditions.push({ label: 'Add ICP industries', field: 'industries', values: icpProfile.preferredIndustries.slice(0, 3), reasoning: 'Based on your successful outreach' }); }
  }
  if (!filters.jobTitles || filters.jobTitles.length === 0) { tips.push({ icon: '👔', text: 'Add job titles for more targeted results', importance: 'high', suggestionType: 'job_title', examples: ['VP of Sales', 'Marketing Director', 'CEO'] }); }
  if ((!filters.companies || filters.companies.length === 0) && (!filters.industries || filters.industries.length === 0)) { tips.push({ icon: '🏢', text: 'Add company or industry to narrow results', importance: 'medium', suggestionType: 'company', examples: ['Google', 'Microsoft', 'Salesforce'] }); }
  tips.splice(3);
  const hasRecommendations = suggestedAdditions.length > 0 || tips.length > 0;
  console.log(`[AdaptiveSearch] Tips: ${tips.length}, Suggestions: ${suggestedAdditions.length}`);
  return { tips, suggestedAdditions, hasRecommendations };
}
