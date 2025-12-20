import { db } from "../../../db";
import { eq, and } from "drizzle-orm";
import { leadSearchSessions, type ParsedFilters } from "@shared/schema";
import { parseRefinement } from "../query-parser";
import { enhancedSearch, deduplicateLeads } from "../enhanced-apollo";
import { fetchIcpProfile, scoreLeadsBatch } from "../batch-icp-scorer";
import type { RefinementResult, ScoredLead } from "./types";
import { PerformanceTimer } from "./timer";

export async function refineSearch(userId: number, sessionId: number, refinementCommand: string, options: { page?: number; perPage?: number } = {}): Promise<RefinementResult> {
  const timer = new PerformanceTimer();
  console.log(`[AISearch] Refining session ${sessionId}: "${refinementCommand}"`);
  const [[session], icpProfile] = await Promise.all([db.select().from(leadSearchSessions).where(and(eq(leadSearchSessions.id, sessionId), eq(leadSearchSessions.userId, userId))).limit(1), fetchIcpProfile(userId)]);
  timer.mark('Session + ICP fetch (parallel)');
  if (!session) { throw new Error('Search session not found'); }
  const currentFilters = session.parsedFilters as ParsedFilters;
  const refinementResult = await parseRefinement(refinementCommand, currentFilters);
  timer.mark('Parse refinement');
  const history = (session.refinementHistory as any[]) || [];
  history.push({ command: refinementCommand, appliedAt: new Date().toISOString(), filtersBefore: currentFilters, filtersAfter: refinementResult.filters });
  db.update(leadSearchSessions).set({ parsedFilters: refinementResult.filters as any, refinementHistory: history as any, currentRefinementStep: history.length, updatedAt: new Date() }).where(eq(leadSearchSessions.id, sessionId)).catch(err => console.error('[AISearch] Session update error:', err));
  const searchResult = await enhancedSearch(refinementResult.filters, { page: options.page || 1, perPage: options.perPage || 25 });
  timer.mark('Apollo search');
  const uniqueLeads = deduplicateLeads(searchResult.leads);
  const scoredLeads = scoreLeadsBatch(icpProfile, uniqueLeads);
  timer.mark('ICP scoring (batch)');
  timer.print('RefineSearch');
  return { sessionId, originalFilters: currentFilters, refinedFilters: refinementResult.filters, explanation: refinementResult.explanation, canUndo: refinementResult.undoable, leads: scoredLeads, pagination: searchResult.pagination };
}

export async function undoRefinement(userId: number, sessionId: number): Promise<{ success: boolean; filters: ParsedFilters }> {
  const [session] = await db.select().from(leadSearchSessions).where(and(eq(leadSearchSessions.id, sessionId), eq(leadSearchSessions.userId, userId))).limit(1);
  if (!session) { throw new Error('Search session not found'); }
  const history = (session.refinementHistory as any[]) || [];
  const currentStep = session.currentRefinementStep || 0;
  if (currentStep === 0 || history.length === 0) { return { success: false, filters: session.parsedFilters as ParsedFilters }; }
  const previousStep = currentStep - 1;
  const previousFilters = previousStep === 0 ? session.parsedFilters : history[previousStep - 1].filtersAfter;
  await db.update(leadSearchSessions).set({ parsedFilters: previousFilters as any, currentRefinementStep: previousStep, updatedAt: new Date() }).where(eq(leadSearchSessions.id, sessionId));
  return { success: true, filters: previousFilters as ParsedFilters };
}
