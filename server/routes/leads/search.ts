import type { Express } from "express";
import { z } from "zod";
import { searchPeople } from "../../services/apollo-service";
import { SmsOptOutService } from "../../services/sms-opt-out";
import { searchLeadsSchema, aiParseSchema } from "./schemas";
import { parseQueryWithAI } from "./helpers";
import {
  smartParseQuery,
  convertToApolloFilters,
  generateFallbackLevels,
  generateIntelligentFallbacks,
  selectBestFallbackStrategy,
  searchAnalytics,
  rankLeads,
  preprocessQuery,
  type SmartParsedFilters
} from "../../services/ai-search/smart-query-parser";

export function registerSearchRoutes(app: Express) {
  app.post("/api/leads/ai-parse", async (req, res) => {
    try {
      const { query } = aiParseSchema.parse(req.body);
      console.log('[Leads] AI parsing query:', query);

      let filters = await parseQueryWithAI(query);
      const hasAnyFilter = filters.jobTitles.length > 0 || filters.locations.length > 0 || filters.industries.length > 0 || filters.companySizes.length > 0;

      if (!hasAnyFilter) {
        console.log('[Leads] AI returned empty filters, using query as job title fallback');
        filters = { jobTitles: [query], locations: [], industries: [], companySizes: [] };
      }

      console.log('[Leads] AI parsed filters:', filters);
      res.json({ filters, usedFallback: !hasAnyFilter });
    } catch (error: any) {
      console.error('[Leads] AI parse error:', error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid query', details: error.errors });
      res.status(500).json({ error: 'Failed to parse query' });
    }
  });

  app.post("/api/leads/smart-search", async (req, res) => {
    try {
      if (!process.env.APOLLO_API_KEY) {
        return res.status(400).json({ error: 'Apollo API key not configured. Please add your APOLLO_API_KEY in Settings.' });
      }

      const { query, page = 1, perPage = 25 } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide a search query' });
      }

      console.log('[SmartSearch] Processing query:', query);

      const parseResult = await smartParseQuery(query);
      console.log('[SmartSearch] Parse result:', {
        jobTitles: parseResult.filters.jobTitles,
        expandedJobTitles: parseResult.filters.expandedJobTitles.length,
        locations: parseResult.filters.locations,
        industries: parseResult.filters.industries,
        confidence: parseResult.confidence.overall
      });

      if (parseResult.confidence.disambiguationNeeded) {
        console.log('[SmartSearch] Disambiguation needed:', parseResult.confidence.disambiguationReason);
      }

      const performSearch = async (filters: SmartParsedFilters) => {
        const titles = filters.expandedJobTitles.length > 0 ? filters.expandedJobTitles : filters.jobTitles;
        const result = await searchPeople({
          jobTitles: titles,
          locations: filters.locations,
          industries: filters.industries,
          companySizes: filters.companySizes,
          companies: filters.companies || [],
          // P0: Pass seniorities, keywords, and technologies
          seniorities: filters.seniorities || [],
          keywords: filters.keywords || [],
          technologies: filters.technologies || [],
          page,
          perPage
        });
        return { results: result.leads, total: result.pagination.totalResults, pagination: result.pagination };
      };

      const userId = (req as any).session?.userId;

      let result = await performSearch(parseResult.filters);
      let fallbackUsed = null;
      let searchAttempts = 1;

      if (userId) {
        searchAnalytics.recordSearch(userId, query, parseResult.filters, result.total, parseResult.confidence.overall);
      }

      if (result.total === 0 || result.total < 5) {
        console.log(`[SmartSearch] Initial search returned ${result.total} results, trying intelligent fallbacks...`);

        const fallbackStrategy = selectBestFallbackStrategy(parseResult.filters);
        const fallbacks = generateIntelligentFallbacks(parseResult.filters, fallbackStrategy);

        for (const fallback of fallbacks) {
          if (searchAttempts >= 5) break;

          console.log(`[SmartSearch] Trying fallback level ${fallback.level}: ${fallback.description}`);
          searchAttempts++;

          const fallbackResult = await performSearch(fallback.filters);
          console.log(`[SmartSearch] Fallback returned ${fallbackResult.total} results`);

          if (fallbackResult.total > result.total) {
            result = fallbackResult;
            fallbackUsed = fallback;
          }

          if (fallbackResult.total >= 10) {
            result = fallbackResult;
            fallbackUsed = fallback;
            break;
          }
        }
      }

      let filteredLeads = result.results;
      let optedOutCount = 0;

      if (userId && filteredLeads.length > 0) {
        const phonesInResults = filteredLeads.filter(lead => lead.phone).map(lead => lead.phone as string);
        if (phonesInResults.length > 0) {
          const optOutMap = await SmsOptOutService.checkBulkOptOuts(userId, phonesInResults);
          const beforeCount = filteredLeads.length;
          filteredLeads = filteredLeads.filter(lead => !lead.phone || !optOutMap.get(lead.phone));
          optedOutCount = beforeCount - filteredLeads.length;
        }
      }

      if (filteredLeads.length > 0) {
        const rankedLeads = rankLeads(filteredLeads, parseResult.filters as any, null);
        filteredLeads = rankedLeads.map(({ relevanceScore, rankingFactors, ...lead }) => ({
          ...lead,
          _relevanceScore: relevanceScore
        }));
        console.log(`[SmartSearch] Re-ranked ${filteredLeads.length} leads by relevance`);
      }

      const response: any = {
        leads: filteredLeads,
        pagination: result.pagination,
        optedOutFiltered: optedOutCount,
        parseInfo: {
          originalQuery: query,
          extractedFilters: {
            jobTitles: parseResult.filters.jobTitles,
            expandedJobTitles: parseResult.filters.expandedJobTitles,
            locations: parseResult.filters.locations,
            industries: parseResult.filters.industries,
            companySizes: parseResult.filters.companySizes,
            seniorities: parseResult.filters.seniorities
          },
          confidence: parseResult.confidence.overall,
          explanation: parseResult.explanation,
          searchAttempts,
          fallbackUsed: fallbackUsed ? {
            level: fallbackUsed.level,
            description: fallbackUsed.description,
            changes: fallbackUsed.changes
          } : null
        }
      };

      // Only report disambiguation needed if we TRULY need more info
      // If we have job title + location, or job title + industry, that's enough context
      const hasMinimumViableSearch = (
        (parseResult.filters.jobTitles.length > 0 && parseResult.filters.locations.length > 0) ||
        (parseResult.filters.jobTitles.length > 0 && parseResult.filters.industries.length > 0) ||
        (parseResult.filters.companies?.length > 0)
      );

      // Only set disambiguation if AI says we need it AND we don't already have enough context
      if (parseResult.confidence.disambiguationNeeded && !hasMinimumViableSearch && filteredLeads.length === 0) {
        response.disambiguationNeeded = true;
        response.disambiguationReason = parseResult.confidence.disambiguationReason;
        response.alternativeInterpretations = parseResult.confidence.alternativeInterpretations;
      }

      console.log(`[SmartSearch] Returning ${filteredLeads.length} leads (total: ${result.total}, attempts: ${searchAttempts})`);
      console.log(`[SmartSearch] DIAGNOSTIC - Response data:`, {
        leadsCount: filteredLeads.length,
        paginationTotalResults: result.pagination.totalResults,
        paginationPage: result.pagination.page,
        paginationTotalPages: result.pagination.totalPages,
        disambiguationNeeded: response.disambiguationNeeded || false,
        hasMinimumViableSearch,
        parseResultDisambiguation: parseResult.confidence.disambiguationNeeded
      });
      res.json(response);

    } catch (error: any) {
      console.error('[SmartSearch] Error:', error);
      if (error.message?.includes('Apollo API error')) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to search leads' });
    }
  });

  app.post("/api/leads/search", async (req, res) => {
    try {
      if (!process.env.APOLLO_API_KEY) {
        return res.status(400).json({
          error: 'Apollo API key not configured. Please add your APOLLO_API_KEY in Settings.',
        });
      }

      const filters = searchLeadsSchema.parse(req.body);
      const hasFilters =
        (filters.jobTitles?.length || 0) > 0 ||
        (filters.locations?.length || 0) > 0 ||
        (filters.companySizes?.length || 0) > 0 ||
        (filters.industries?.length || 0) > 0;

      if (!hasFilters) {
        return res.status(400).json({
          error: 'Please specify at least one search filter (job title, location, company size, or industry)',
        });
      }

      console.log('[Leads] Searching with filters:', filters);
      const result = await searchPeople({
        jobTitles: filters.jobTitles,
        locations: filters.locations,
        companySizes: filters.companySizes,
        industries: filters.industries,
        emailStatuses: filters.emailStatuses,
        page: filters.page,
        perPage: filters.perPage,
      });

      let filteredLeads = result.leads;
      let optedOutCount = 0;
      const userId = (req as any).session?.userId;

      if (userId && filteredLeads.length > 0) {
        const phonesInResults = filteredLeads.filter(lead => lead.phone).map(lead => lead.phone as string);
        if (phonesInResults.length > 0) {
          const optOutMap = await SmsOptOutService.checkBulkOptOuts(userId, phonesInResults);
          const beforeCount = filteredLeads.length;
          filteredLeads = filteredLeads.filter(lead => !lead.phone || !optOutMap.get(lead.phone));
          optedOutCount = beforeCount - filteredLeads.length;
          if (optedOutCount > 0) {
            console.log(`[Leads] Filtered out ${optedOutCount} opted-out contacts for user ${userId}`);
          }
        }
      }

      res.json({
        leads: filteredLeads,
        pagination: result.pagination,
        optedOutFiltered: optedOutCount,
      });
    } catch (error: any) {
      console.error('[Leads] Search error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid search filters',
          details: error.errors,
        });
      }
      if (error.message?.includes('Apollo API error')) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to search leads' });
    }
  });
}
