/**
 * Intelligent Fallback Engine
 * Uses AI-guided decisions to determine best fallback strategy
 */

import type { SmartParsedFilters, FallbackLevel } from "./types";
import { callOpenAIFast } from "../../../ai/openai-client";

const FALLBACK_DECISION_PROMPT = `You are an expert at optimizing B2B contact searches.

Given a search query that returned few/no results, determine the BEST filter to relax to get more results while keeping them relevant.

RULES:
1. NEVER remove the core job title/role - it's the most important filter
2. Prefer broadening location (city → state → country) over removing industry
3. Remove seniority filters before removing location
4. Remove company size filters early (they're often too restrictive)
5. Industry can be removed if job titles are specific enough

Rank the filters to remove from FIRST to LAST (least impactful to most impactful):
1. Seniority (usually least impactful)
2. Company Size
3. Industry (if job titles are specific)
4. Location (broaden before removing)
5. Keywords
6. Job Titles (NEVER remove - only broaden)

OUTPUT JSON:
{
  "fallbackOrder": ["seniority", "companySize", "industry", "location"],
  "explanation": "Brief reasoning"
}`;

interface FallbackDecision {
  fallbackOrder: string[];
  explanation: string;
}

export async function getAIFallbackDecision(
  query: string,
  filters: SmartParsedFilters,
  currentResultCount: number
): Promise<FallbackDecision> {
  try {
    const filterSummary = {
      jobTitles: filters.jobTitles.slice(0, 5),
      locations: filters.locations.slice(0, 3),
      industries: filters.industries.slice(0, 3),
      companySizes: filters.companySizes,
      seniorities: filters.seniorities
    };
    
    const response = await callOpenAIFast(
      [
        { role: "system", content: FALLBACK_DECISION_PROMPT },
        { role: "user", content: `Query: "${query}"\nCurrent filters: ${JSON.stringify(filterSummary)}\nResults: ${currentResultCount}` }
      ],
      { responseFormat: { type: "json_object" }, maxTokens: 200 }
    );
    
    return JSON.parse(response) as FallbackDecision;
  } catch (error) {
    console.error('[IntelligentFallback] AI decision failed:', error);
    return {
      fallbackOrder: ['seniority', 'companySize', 'industry', 'location'],
      explanation: 'Using default fallback order'
    };
  }
}

export function generateIntelligentFallbacks(
  originalFilters: SmartParsedFilters,
  fallbackOrder: string[] = ['seniority', 'companySize', 'industry', 'location']
): FallbackLevel[] {
  const fallbacks: FallbackLevel[] = [];
  let currentFilters = { ...originalFilters };
  let level = 0;
  
  for (const filterType of fallbackOrder) {
    switch (filterType) {
      case 'seniority':
        if (currentFilters.seniorities.length > 0) {
          level++;
          const newFilters = {
            ...currentFilters,
            seniorities: []
          };
          fallbacks.push({
            level,
            description: 'Remove seniority filter for broader results',
            filters: newFilters,
            changes: [`Removed seniority: ${currentFilters.seniorities.join(', ')}`]
          });
          currentFilters = newFilters;
        }
        break;
        
      case 'companySize':
        if (currentFilters.companySizes.length > 0) {
          level++;
          const newFilters = {
            ...currentFilters,
            companySizes: []
          };
          fallbacks.push({
            level,
            description: 'Remove company size filter',
            filters: newFilters,
            changes: [`Removed company size: ${currentFilters.companySizes.join(', ')}`]
          });
          currentFilters = newFilters;
        }
        break;
        
      case 'industry':
        if (currentFilters.industries.length > 0 && currentFilters.jobTitles.length > 0) {
          level++;
          const newFilters = {
            ...currentFilters,
            industries: []
          };
          fallbacks.push({
            level,
            description: 'Remove industry filter (rely on job titles)',
            filters: newFilters,
            changes: [`Removed industry: ${currentFilters.industries.join(', ')}`]
          });
          currentFilters = newFilters;
        }
        break;
        
      case 'location':
        if (currentFilters.normalizedLocations.length > 0) {
          const firstLoc = currentFilters.normalizedLocations[0];
          
          if (firstLoc.city && firstLoc.state) {
            level++;
            const broadenedLocs = currentFilters.normalizedLocations.map(loc => ({
              ...loc,
              city: undefined,
              apolloFormat: `${loc.state}, ${loc.country || 'United States'}`
            }));
            
            const newFilters = {
              ...currentFilters,
              normalizedLocations: broadenedLocs,
              locations: broadenedLocs.map(l => l.apolloFormat)
            };
            
            fallbacks.push({
              level,
              description: `Broaden location from city to state (${firstLoc.state})`,
              filters: newFilters,
              changes: [`Broadened from ${firstLoc.city} to ${firstLoc.state}`]
            });
            currentFilters = newFilters;
          }
          
          if (currentFilters.normalizedLocations.some(l => l.state)) {
            level++;
            const countryFilters = {
              ...currentFilters,
              normalizedLocations: [{
                original: 'United States',
                country: 'United States',
                apolloFormat: 'United States'
              }],
              locations: ['United States']
            };
            
            fallbacks.push({
              level,
              description: 'Broaden location to nationwide (United States)',
              filters: countryFilters,
              changes: ['Broadened to nationwide search']
            });
            currentFilters = countryFilters;
          }
          
          if (currentFilters.locations.length > 0 && currentFilters.jobTitles.length > 0) {
            level++;
            const noLocationFilters = {
              ...currentFilters,
              locations: [],
              normalizedLocations: []
            };
            
            fallbacks.push({
              level,
              description: 'Remove all location filters (search globally)',
              filters: noLocationFilters,
              changes: ['Removed all location filters']
            });
            currentFilters = noLocationFilters;
          }
        }
        break;
        
      case 'keywords':
        if (currentFilters.keywords.length > 0) {
          level++;
          const newFilters = {
            ...currentFilters,
            keywords: []
          };
          fallbacks.push({
            level,
            description: 'Remove keyword filters',
            filters: newFilters,
            changes: [`Removed keywords: ${currentFilters.keywords.join(', ')}`]
          });
          currentFilters = newFilters;
        }
        break;
    }
  }
  
  if (currentFilters.jobTitles.length > 0 && 
      currentFilters.expandedJobTitles.length > currentFilters.jobTitles.length &&
      !fallbacks.some(f => f.description.includes('expanded'))) {
    level++;
    const expandedFilters = {
      ...currentFilters,
      jobTitles: [...currentFilters.expandedJobTitles]
    };
    fallbacks.push({
      level,
      description: 'Expand to related job titles',
      filters: expandedFilters,
      changes: [`Expanded job titles from ${originalFilters.jobTitles.length} to ${expandedFilters.jobTitles.length}`]
    });
  }
  
  return fallbacks;
}

export function selectBestFallbackStrategy(
  filters: SmartParsedFilters,
  targetResultCount: number = 10
): string[] {
  const strategy: string[] = [];
  
  if (filters.seniorities.length > 0) {
    strategy.push('seniority');
  }
  
  if (filters.companySizes.length > 0) {
    strategy.push('companySize');
  }
  
  if (filters.industries.length > 0 && filters.jobTitles.length >= 2) {
    strategy.push('industry');
  }
  
  if (filters.keywords.length > 0) {
    strategy.push('keywords');
  }
  
  if (filters.locations.length > 0) {
    strategy.push('location');
  }
  
  return strategy;
}
