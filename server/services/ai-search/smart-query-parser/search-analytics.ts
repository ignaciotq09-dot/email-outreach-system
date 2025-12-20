/**
 * Search Analytics
 * Tracks successful queries to improve future parsing
 */

import { db } from "../../../db";
import { sql } from "drizzle-orm";

interface SearchEvent {
  userId: number;
  query: string;
  parsedFilters: any;
  resultCount: number;
  importedCount: number;
  confidence: number;
  timestamp: Date;
}

interface QueryPattern {
  pattern: string;
  successRate: number;
  avgImported: number;
  totalSearches: number;
  lastUsed: Date;
}

class SearchAnalytics {
  private events: SearchEvent[] = [];
  private patterns: Map<string, QueryPattern> = new Map();
  
  private normalizeForPattern(query: string): string {
    return query
      .toLowerCase()
      .replace(/\b(in|at|for|the|a|an)\b/g, '')
      .replace(/[.,!?'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  async recordSearch(
    userId: number,
    query: string,
    parsedFilters: any,
    resultCount: number,
    confidence: number
  ): Promise<void> {
    const event: SearchEvent = {
      userId,
      query,
      parsedFilters,
      resultCount,
      importedCount: 0,
      confidence,
      timestamp: new Date()
    };
    
    this.events.push(event);
    
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
    
    console.log(`[SearchAnalytics] Recorded search: "${query}" (${resultCount} results)`);
  }
  
  async recordImport(
    userId: number,
    query: string,
    importedCount: number
  ): Promise<void> {
    const recentEvents = this.events.filter(e => 
      e.userId === userId && 
      e.query === query &&
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000
    );
    
    for (const event of recentEvents) {
      event.importedCount = importedCount;
    }
    
    if (importedCount > 0) {
      const pattern = this.normalizeForPattern(query);
      const existing = this.patterns.get(pattern);
      
      if (existing) {
        existing.totalSearches++;
        existing.avgImported = (existing.avgImported * (existing.totalSearches - 1) + importedCount) / existing.totalSearches;
        existing.successRate = (existing.successRate * (existing.totalSearches - 1) + 1) / existing.totalSearches;
        existing.lastUsed = new Date();
      } else {
        this.patterns.set(pattern, {
          pattern,
          successRate: 1,
          avgImported: importedCount,
          totalSearches: 1,
          lastUsed: new Date()
        });
      }
      
      console.log(`[SearchAnalytics] Recorded successful import: "${query}" (${importedCount} contacts)`);
    }
  }
  
  getSuccessfulPatterns(limit: number = 20): QueryPattern[] {
    return [...this.patterns.values()]
      .filter(p => p.successRate > 0.5)
      .sort((a, b) => b.avgImported * b.successRate - a.avgImported * a.successRate)
      .slice(0, limit);
  }
  
  getQuerySuggestions(partialQuery: string): string[] {
    const normalized = this.normalizeForPattern(partialQuery);
    
    return [...this.patterns.entries()]
      .filter(([pattern]) => pattern.includes(normalized))
      .sort((a, b) => b[1].avgImported - a[1].avgImported)
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }
  
  getStats(): {
    totalSearches: number;
    successfulSearches: number;
    avgResultsPerSearch: number;
    avgImportsPerSearch: number;
    topPatterns: QueryPattern[];
  } {
    const successfulEvents = this.events.filter(e => e.importedCount > 0);
    
    return {
      totalSearches: this.events.length,
      successfulSearches: successfulEvents.length,
      avgResultsPerSearch: this.events.length > 0 
        ? this.events.reduce((sum, e) => sum + e.resultCount, 0) / this.events.length 
        : 0,
      avgImportsPerSearch: this.events.length > 0
        ? this.events.reduce((sum, e) => sum + e.importedCount, 0) / this.events.length
        : 0,
      topPatterns: this.getSuccessfulPatterns(10)
    };
  }
  
  findSimilarSuccessfulQuery(query: string): SearchEvent | null {
    const normalized = this.normalizeForPattern(query);
    
    const similar = this.events
      .filter(e => e.importedCount > 0)
      .find(e => {
        const eventNormalized = this.normalizeForPattern(e.query);
        return eventNormalized.includes(normalized) || normalized.includes(eventNormalized);
      });
    
    return similar || null;
  }
}

export const searchAnalytics = new SearchAnalytics();

export async function createSearchAnalyticsTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS search_analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        parsed_filters JSONB,
        result_count INTEGER DEFAULT 0,
        imported_count INTEGER DEFAULT 0,
        confidence DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_analytics_user 
      ON search_analytics(user_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_search_analytics_query 
      ON search_analytics(query)
    `);
    
    console.log('[SearchAnalytics] Table created/verified');
  } catch (error) {
    console.error('[SearchAnalytics] Failed to create table:', error);
  }
}

export async function persistSearchEvent(
  userId: number,
  query: string,
  parsedFilters: any,
  resultCount: number,
  confidence: number
): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO search_analytics (user_id, query, parsed_filters, result_count, confidence)
      VALUES (${userId}, ${query}, ${JSON.stringify(parsedFilters)}::jsonb, ${resultCount}, ${confidence})
    `);
  } catch (error) {
    console.error('[SearchAnalytics] Failed to persist search event:', error);
  }
}

export async function updateImportCount(
  userId: number,
  query: string,
  importedCount: number
): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE search_analytics 
      SET imported_count = ${importedCount}
      WHERE user_id = ${userId} 
      AND query = ${query}
      AND created_at > NOW() - INTERVAL '5 minutes'
      AND imported_count = 0
    `);
  } catch (error) {
    console.error('[SearchAnalytics] Failed to update import count:', error);
  }
}

export async function getTopSuccessfulQueries(
  userId: number,
  limit: number = 10
): Promise<Array<{ query: string; avgImported: number; searchCount: number }>> {
  try {
    const result = await db.execute(sql`
      SELECT 
        query,
        AVG(imported_count) as avg_imported,
        COUNT(*) as search_count
      FROM search_analytics
      WHERE user_id = ${userId}
      AND imported_count > 0
      GROUP BY query
      ORDER BY avg_imported DESC
      LIMIT ${limit}
    `);
    
    return (result.rows as any[]).map(row => ({
      query: row.query,
      avgImported: parseFloat(row.avg_imported) || 0,
      searchCount: parseInt(row.search_count) || 0
    }));
  } catch (error) {
    console.error('[SearchAnalytics] Failed to get top queries:', error);
    return [];
  }
}
