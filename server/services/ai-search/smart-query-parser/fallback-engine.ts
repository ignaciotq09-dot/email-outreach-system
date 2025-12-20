import type { SmartParsedFilters, FallbackLevel } from "./types";
import { broadenLocation, normalizeLocation, getApolloLocationFormats } from "./location-normalizer";
import { expandJobTitle } from "./synonyms";

export function generateFallbackLevels(originalFilters: SmartParsedFilters): FallbackLevel[] {
  const fallbacks: FallbackLevel[] = [];
  let currentFilters = { ...originalFilters };
  let level = 0;
  
  if (originalFilters.jobTitles.length > 0 && originalFilters.expandedJobTitles.length > originalFilters.jobTitles.length) {
    level++;
    const expandedFilters = {
      ...currentFilters,
      jobTitles: [...currentFilters.expandedJobTitles]
    };
    fallbacks.push({
      level,
      description: 'Expand to related job titles',
      filters: expandedFilters,
      changes: [`Expanded job titles from ${currentFilters.jobTitles.length} to ${expandedFilters.jobTitles.length}`]
    });
    currentFilters = expandedFilters;
  }
  
  if (currentFilters.normalizedLocations.length > 0 && currentFilters.normalizedLocations[0].city) {
    level++;
    const broadenedLocs = currentFilters.normalizedLocations.map(loc => {
      if (loc.city && loc.state) {
        const broadened = broadenLocation(loc);
        return broadened || loc;
      }
      return loc;
    });
    
    const broadenedFilters = {
      ...currentFilters,
      normalizedLocations: broadenedLocs,
      locations: broadenedLocs.flatMap(l => getApolloLocationFormats(l))
    };
    
    fallbacks.push({
      level,
      description: 'Broaden location from city to state',
      filters: broadenedFilters,
      changes: [`Changed location from city-level to state-level`]
    });
    currentFilters = broadenedFilters;
  }
  
  if (currentFilters.seniorities.length > 0) {
    level++;
    const noSeniorityFilters = {
      ...currentFilters,
      seniorities: []
    };
    fallbacks.push({
      level,
      description: 'Remove seniority filter',
      filters: noSeniorityFilters,
      changes: [`Removed seniority filter: ${currentFilters.seniorities.join(', ')}`]
    });
    currentFilters = noSeniorityFilters;
  }
  
  if (currentFilters.companySizes.length > 0) {
    level++;
    const noSizeFilters = {
      ...currentFilters,
      companySizes: []
    };
    fallbacks.push({
      level,
      description: 'Remove company size filter',
      filters: noSizeFilters,
      changes: [`Removed company size filter: ${currentFilters.companySizes.join(', ')}`]
    });
    currentFilters = noSizeFilters;
  }
  
  if (currentFilters.industries.length > 0 && currentFilters.jobTitles.length > 0) {
    level++;
    const noIndustryFilters = {
      ...currentFilters,
      industries: []
    };
    fallbacks.push({
      level,
      description: 'Remove industry filter (rely on job titles)',
      filters: noIndustryFilters,
      changes: [`Removed industry filter: ${currentFilters.industries.join(', ')}`]
    });
    currentFilters = noIndustryFilters;
  }
  
  if (currentFilters.normalizedLocations.length > 0 && currentFilters.normalizedLocations[0].state) {
    level++;
    const countryOnlyLocs = currentFilters.normalizedLocations.map(loc => {
      if (loc.state) {
        return {
          original: loc.country || 'United States',
          country: loc.country || 'United States',
          apolloFormat: loc.country || 'United States'
        };
      }
      return loc;
    });
    
    const countryFilters = {
      ...currentFilters,
      normalizedLocations: countryOnlyLocs,
      locations: [...new Set(countryOnlyLocs.map(l => l.apolloFormat))]
    };
    
    fallbacks.push({
      level,
      description: 'Broaden location to country level',
      filters: countryFilters,
      changes: [`Changed location from state to country level`]
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
      description: 'Remove location filter (search nationwide)',
      filters: noLocationFilters,
      changes: ['Removed location filter for nationwide search']
    });
    currentFilters = noLocationFilters;
  }
  
  if (currentFilters.jobTitles.length > 0 && currentFilters.keywords.length === 0) {
    level++;
    const keywordFilters = {
      ...currentFilters,
      keywords: [...currentFilters.jobTitles],
      jobTitles: [],
      expandedJobTitles: []
    };
    fallbacks.push({
      level,
      description: 'Convert job titles to keyword search',
      filters: keywordFilters,
      changes: ['Switched from exact title match to keyword search']
    });
  }
  
  return fallbacks;
}

export function selectBestFallback(fallbacks: FallbackLevel[], minResultsNeeded: number = 10): FallbackLevel | null {
  for (const fallback of fallbacks) {
    const hasJobTitles = fallback.filters.jobTitles.length > 0 || fallback.filters.keywords.length > 0;
    if (hasJobTitles) {
      return fallback;
    }
  }
  return fallbacks.length > 0 ? fallbacks[0] : null;
}

export function describeFilterChanges(original: SmartParsedFilters, current: SmartParsedFilters): string[] {
  const changes: string[] = [];
  
  if (original.jobTitles.length !== current.jobTitles.length) {
    changes.push(`Job titles: ${original.jobTitles.length} → ${current.jobTitles.length}`);
  }
  
  if (original.locations.length !== current.locations.length) {
    changes.push(`Locations: ${original.locations.length} → ${current.locations.length}`);
  }
  
  if (original.industries.length !== current.industries.length) {
    changes.push(`Industries: ${original.industries.length} → ${current.industries.length}`);
  }
  
  if (original.seniorities.length !== current.seniorities.length) {
    changes.push(`Seniorities removed`);
  }
  
  if (original.companySizes.length !== current.companySizes.length) {
    changes.push(`Company sizes removed`);
  }
  
  return changes;
}
