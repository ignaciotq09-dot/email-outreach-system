import { db } from "../../../db";
import { eq, and, desc } from "drizzle-orm";
import { searchPatterns, type SearchPattern, type ParsedFilters } from "@shared/schema";
import { fetchIcpProfile, generateSuggestionsFromProfile } from "../batch-icp-scorer";
import { hashFilters } from "./patterns";

export async function getSearchSuggestions(userId: number): Promise<Array<{ id: number; type: string; text: string; filters: Partial<ParsedFilters>; predictedScore: number; reasoning: string }>> {
  const [icpProfile, recentPatterns] = await Promise.all([fetchIcpProfile(userId), db.select().from(searchPatterns).where(eq(searchPatterns.userId, userId)).orderBy(desc(searchPatterns.successRate)).limit(3)]);
  const suggestions: Array<{ id: number; type: string; text: string; filters: Partial<ParsedFilters>; predictedScore: number; reasoning: string }> = [];
  let id = 1;
  const icpSuggestions = generateSuggestionsFromProfile(icpProfile);
  for (const s of icpSuggestions) { suggestions.push({ id: id++, type: 'icp_based', text: s.description, filters: s.filters, predictedScore: s.predictedScore, reasoning: s.reasoning }); }
  for (const pattern of recentPatterns) { if (pattern.repliesReceived > 0 || pattern.leadsImported > 5) { suggestions.push({ id: id++, type: 'pattern_based', text: pattern.savedName || pattern.description || 'Previous successful search', filters: pattern.filters as Partial<ParsedFilters>, predictedScore: Math.min(90, 50 + pattern.successRate * 40), reasoning: `${pattern.repliesReceived} replies from ${pattern.emailsSent} emails` }); } }
  return suggestions;
}

export async function saveSearch(userId: number, sessionId: number, name: string): Promise<{ success: boolean; patternId?: number }> {
  try {
    const [session] = await db.select().from(searchPatterns).where(and(eq(searchPatterns.userId, userId))).limit(1);
    const filters = session?.filters as ParsedFilters;
    if (!filters) return { success: false };
    const filterHash = hashFilters(filters);
    const existing = await db.select().from(searchPatterns).where(eq(searchPatterns.filterHash, filterHash)).limit(1);
    if (existing.length > 0) { await db.update(searchPatterns).set({ savedName: name, isSaved: true, updatedAt: new Date() }).where(eq(searchPatterns.id, existing[0].id)); return { success: true, patternId: existing[0].id }; }
    const description = [filters.jobTitles?.join(', '), filters.industries?.join(', '), filters.locations?.join(', ')].filter(Boolean).join(' in ') || 'Custom search';
    const [newPattern] = await db.insert(searchPatterns).values({ userId, filterHash, filters: filters as any, description, savedName: name, isSaved: true, usageCount: 1, averageResults: 0, successRate: 0 }).returning();
    return { success: true, patternId: newPattern.id };
  } catch (error) { console.error('[SaveSearch] Error:', error); return { success: false }; }
}

export async function getSavedSearches(userId: number): Promise<SearchPattern[]> {
  return db.select().from(searchPatterns).where(and(eq(searchPatterns.userId, userId), eq(searchPatterns.isSaved, true))).orderBy(desc(searchPatterns.lastUsedAt));
}

export async function deleteSavedSearch(userId: number, patternId: number): Promise<boolean> {
  try { await db.update(searchPatterns).set({ isSaved: false }).where(and(eq(searchPatterns.id, patternId), eq(searchPatterns.userId, userId))); return true; }
  catch (error) { console.error('[DeleteSearch] Error:', error); return false; }
}
