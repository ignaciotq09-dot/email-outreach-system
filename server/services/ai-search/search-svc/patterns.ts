import { db } from "../../../db";
import { eq, sql } from "drizzle-orm";
import { searchPatterns, type ParsedFilters } from "@shared/schema";
import crypto from "crypto";

export function hashFilters(filters: ParsedFilters): string {
  const normalized = {
    jobTitles: [...(filters.jobTitles || [])].sort(),
    industries: [...(filters.industries || [])].sort(),
    locations: [...(filters.locations || [])].sort(),
    companies: [...(filters.companies || [])].sort(),
    seniorities: [...(filters.seniorities || [])].sort(),
    keywords: [...(filters.keywords || [])].sort(),
    employeeCounts: [...(filters.employeeCounts || [])].sort(),
    excludeCompanies: [...(filters.excludeCompanies || [])].sort(),
  };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

export async function trackSearchPattern(userId: number, filters: ParsedFilters, resultsCount: number): Promise<void> {
  try {
    const filterHash = hashFilters(filters);
    const existing = await db.select().from(searchPatterns).where(eq(searchPatterns.filterHash, filterHash)).limit(1);
    if (existing.length > 0) {
      const newUsageCount = existing[0].usageCount + 1;
      const newAverageResults = Math.round((existing[0].averageResults * existing[0].usageCount + resultsCount) / newUsageCount);
      await db.update(searchPatterns).set({ usageCount: newUsageCount, lastUsedAt: new Date(), averageResults: newAverageResults }).where(eq(searchPatterns.id, existing[0].id));
    } else {
      const description = [filters.jobTitles?.join(', '), filters.industries?.join(', '), filters.locations?.join(', ')].filter(Boolean).join(' in ') || 'Custom search';
      await db.insert(searchPatterns).values({ userId, filterHash, filters: filters as any, description, usageCount: 1, averageResults: resultsCount, successRate: 0 });
    }
  } catch (error) { console.error('[SearchPatterns] Error tracking:', error); }
}
