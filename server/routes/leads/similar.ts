/**
 * Similar Leads Search
 * Find leads similar to a given lead based on their REAL attributes
 * No fabrication - uses actual lead data to construct search filters
 */

import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { searchPeople } from "../../services/apollo-svc/search";
import type { ApolloSearchFilters } from "../../services/apollo-svc/types";

interface SimilarLeadRequest {
    // The lead to find similar leads to (must provide real attributes)
    lead: {
        title?: string;
        company?: string;
        industry?: string;
        location?: string;
        companySize?: string;
        seniority?: string;
    };
    page?: number;
    perPage?: number;
    // Which attributes to match on (user can customize)
    matchOn?: ('title' | 'industry' | 'location' | 'companySize' | 'seniority')[];
}

export function registerSimilarLeadsRoutes(app: Express) {
    /**
     * POST /api/leads/similar
     * Find leads similar to a given lead based on their real attributes
     */
    app.post("/api/leads/similar", requireAuth, async (req: Request, res: Response) => {
        try {
            const body = req.body as SimilarLeadRequest;
            const { lead, page = 1, perPage = 25, matchOn } = body;

            if (!lead) {
                return res.status(400).json({ error: "Lead data is required" });
            }

            // Build filters from the lead's REAL attributes (no fabrication)
            const filters: ApolloSearchFilters = {
                page,
                perPage,
            };

            // Default: match on title, industry, location
            const attributesToMatch = matchOn || ['title', 'industry', 'location'];

            // Only add filters for attributes that exist on the lead
            if (attributesToMatch.includes('title') && lead.title) {
                // Extract job function from title (e.g., "VP of Sales" -> "Sales")
                // We use the full title to find people with the same role
                filters.jobTitles = [lead.title];
            }

            if (attributesToMatch.includes('industry') && lead.industry) {
                filters.industries = [lead.industry];
            }

            if (attributesToMatch.includes('location') && lead.location) {
                filters.locations = [lead.location];
            }

            if (attributesToMatch.includes('companySize') && lead.companySize) {
                filters.companySizes = [lead.companySize];
            }

            // Check if we have any filters to apply
            const hasFilters =
                (filters.jobTitles && filters.jobTitles.length > 0) ||
                (filters.industries && filters.industries.length > 0) ||
                (filters.locations && filters.locations.length > 0) ||
                (filters.companySizes && filters.companySizes.length > 0);

            if (!hasFilters) {
                return res.status(400).json({
                    error: "No searchable attributes found on the lead",
                    details: "Provide at least one of: title, industry, location, or companySize"
                });
            }

            console.log(`[SimilarLeads] Searching for leads similar to: ${lead.title} at ${lead.company}`);
            console.log(`[SimilarLeads] Filters:`, JSON.stringify(filters, null, 2));

            const result = await searchPeople(filters);

            // Filter out the original lead's company to avoid showing same-company results
            // (unless user explicitly wants them)
            const filteredLeads = lead.company
                ? result.leads.filter(l =>
                    l.company?.toLowerCase() !== lead.company?.toLowerCase()
                )
                : result.leads;

            res.json({
                leads: filteredLeads,
                pagination: result.pagination,
                searchCriteria: {
                    matchedOn: attributesToMatch.filter(attr => lead[attr as keyof typeof lead]),
                    originalLead: {
                        title: lead.title,
                        company: lead.company,
                        industry: lead.industry,
                        location: lead.location,
                    }
                }
            });
        } catch (error: any) {
            console.error("[SimilarLeads] Error:", error);
            res.status(500).json({ error: error.message || "Failed to find similar leads" });
        }
    });
}
