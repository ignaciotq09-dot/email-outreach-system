/**
 * Result Re-Ranking
 * Scores and re-ranks results based on relevance, recency, and ICP match
 */

import type { SmartParsedFilters } from "./types";

interface Lead {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  linkedinUrl?: string;
  seniority?: string;
  technologies?: string[];
  employmentHistory?: Array<{ title: string; company: string; startDate?: string }>;
}

interface IcpProfile {
  targetTitles: string[];
  targetIndustries: string[];
  targetCompanySizes: string[];
  targetLocations: string[];
  targetSeniorities: string[];
}

interface RankingFactors {
  titleMatch: number;
  locationMatch: number;
  industryMatch: number;
  seniorityMatch: number;
  recencyBonus: number;
  contactQuality: number;
  icpMatch: number;
}

interface RankedLead extends Lead {
  relevanceScore: number;
  rankingFactors: RankingFactors;
}

const RANKING_WEIGHTS = {
  titleMatch: 0.35,
  locationMatch: 0.15,
  industryMatch: 0.15,
  seniorityMatch: 0.10,
  recencyBonus: 0.05,
  contactQuality: 0.10,
  icpMatch: 0.10
};

function calculateTitleMatchScore(leadTitle: string | undefined, targetTitles: string[]): number {
  if (!leadTitle || targetTitles.length === 0) return 0.5;
  
  const normalizedLeadTitle = leadTitle.toLowerCase();
  
  for (const target of targetTitles) {
    if (normalizedLeadTitle === target.toLowerCase()) {
      return 1.0;
    }
  }
  
  for (const target of targetTitles) {
    if (normalizedLeadTitle.includes(target.toLowerCase()) || 
        target.toLowerCase().includes(normalizedLeadTitle)) {
      return 0.8;
    }
  }
  
  const leadWords = new Set(normalizedLeadTitle.split(/\s+/));
  for (const target of targetTitles) {
    const targetWords = target.toLowerCase().split(/\s+/);
    const matches = targetWords.filter(w => leadWords.has(w)).length;
    if (matches > 0) {
      return 0.3 + (0.4 * matches / targetWords.length);
    }
  }
  
  return 0.3;
}

function calculateLocationMatchScore(leadLocation: string | undefined, targetLocations: string[]): number {
  if (!leadLocation || targetLocations.length === 0) return 0.5;
  
  const normalizedLeadLoc = leadLocation.toLowerCase();
  
  for (const target of targetLocations) {
    const normalizedTarget = target.toLowerCase();
    
    if (normalizedLeadLoc.includes(normalizedTarget) || normalizedTarget.includes(normalizedLeadLoc)) {
      return 1.0;
    }
    
    const targetParts = normalizedTarget.split(',').map(p => p.trim());
    const leadParts = normalizedLeadLoc.split(',').map(p => p.trim());
    
    for (const tp of targetParts) {
      for (const lp of leadParts) {
        if (tp === lp || tp.includes(lp) || lp.includes(tp)) {
          return 0.8;
        }
      }
    }
  }
  
  return 0.3;
}

function calculateIndustryMatchScore(leadIndustry: string | undefined, targetIndustries: string[]): number {
  if (!leadIndustry || targetIndustries.length === 0) return 0.5;
  
  const normalizedLeadIndustry = leadIndustry.toLowerCase();
  
  for (const target of targetIndustries) {
    if (normalizedLeadIndustry === target.toLowerCase()) {
      return 1.0;
    }
    if (normalizedLeadIndustry.includes(target.toLowerCase()) || 
        target.toLowerCase().includes(normalizedLeadIndustry)) {
      return 0.8;
    }
  }
  
  return 0.3;
}

function calculateSeniorityMatchScore(leadSeniority: string | undefined, leadTitle: string | undefined, targetSeniorities: string[]): number {
  if (targetSeniorities.length === 0) return 0.5;
  
  const seniority = leadSeniority?.toLowerCase() || '';
  const title = leadTitle?.toLowerCase() || '';
  
  const seniorityIndicators: Record<string, string[]> = {
    'c-level': ['ceo', 'cto', 'cfo', 'cmo', 'coo', 'cro', 'cpo', 'chief'],
    'vp': ['vp', 'vice president'],
    'director': ['director'],
    'manager': ['manager', 'head of'],
    'senior': ['senior', 'sr.', 'lead', 'principal'],
    'owner': ['owner', 'founder', 'co-founder', 'president'],
    'partner': ['partner']
  };
  
  for (const target of targetSeniorities) {
    const targetLower = target.toLowerCase();
    
    if (seniority.includes(targetLower)) {
      return 1.0;
    }
    
    const indicators = seniorityIndicators[targetLower] || [];
    for (const indicator of indicators) {
      if (title.includes(indicator)) {
        return 0.9;
      }
    }
  }
  
  return 0.3;
}

function calculateRecencyBonus(lead: Lead): number {
  if (!lead.employmentHistory || lead.employmentHistory.length === 0) {
    return 0.5;
  }
  
  const mostRecent = lead.employmentHistory[0];
  if (mostRecent.startDate) {
    const startDate = new Date(mostRecent.startDate);
    const monthsAgo = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsAgo < 6) return 1.0;
    if (monthsAgo < 12) return 0.8;
    if (monthsAgo < 24) return 0.6;
  }
  
  return 0.4;
}

function calculateContactQuality(lead: Lead): number {
  let score = 0;
  
  if (lead.email) score += 0.4;
  if (lead.phone) score += 0.2;
  if (lead.linkedinUrl) score += 0.2;
  if (lead.company) score += 0.1;
  if (lead.title) score += 0.1;
  
  return score;
}

function calculateIcpMatchScore(lead: Lead, icpProfile: IcpProfile | null): number {
  if (!icpProfile) return 0.5;
  
  let matchCount = 0;
  let totalCriteria = 0;
  
  if (icpProfile.targetTitles.length > 0) {
    totalCriteria++;
    if (calculateTitleMatchScore(lead.title, icpProfile.targetTitles) > 0.6) {
      matchCount++;
    }
  }
  
  if (icpProfile.targetIndustries.length > 0) {
    totalCriteria++;
    if (calculateIndustryMatchScore(lead.industry, icpProfile.targetIndustries) > 0.6) {
      matchCount++;
    }
  }
  
  if (icpProfile.targetCompanySizes.length > 0) {
    totalCriteria++;
    if (icpProfile.targetCompanySizes.some(size => lead.companySize?.includes(size))) {
      matchCount++;
    }
  }
  
  if (icpProfile.targetLocations.length > 0) {
    totalCriteria++;
    if (calculateLocationMatchScore(lead.location, icpProfile.targetLocations) > 0.6) {
      matchCount++;
    }
  }
  
  if (totalCriteria === 0) return 0.5;
  
  return matchCount / totalCriteria;
}

export function rankLeads(
  leads: Lead[],
  filters: SmartParsedFilters,
  icpProfile: IcpProfile | null = null
): RankedLead[] {
  const rankedLeads = leads.map(lead => {
    const factors: RankingFactors = {
      titleMatch: calculateTitleMatchScore(lead.title, filters.jobTitles),
      locationMatch: calculateLocationMatchScore(lead.location, filters.locations),
      industryMatch: calculateIndustryMatchScore(lead.industry, filters.industries),
      seniorityMatch: calculateSeniorityMatchScore(lead.seniority, lead.title, filters.seniorities),
      recencyBonus: calculateRecencyBonus(lead),
      contactQuality: calculateContactQuality(lead),
      icpMatch: calculateIcpMatchScore(lead, icpProfile)
    };
    
    const relevanceScore = 
      factors.titleMatch * RANKING_WEIGHTS.titleMatch +
      factors.locationMatch * RANKING_WEIGHTS.locationMatch +
      factors.industryMatch * RANKING_WEIGHTS.industryMatch +
      factors.seniorityMatch * RANKING_WEIGHTS.seniorityMatch +
      factors.recencyBonus * RANKING_WEIGHTS.recencyBonus +
      factors.contactQuality * RANKING_WEIGHTS.contactQuality +
      factors.icpMatch * RANKING_WEIGHTS.icpMatch;
    
    return {
      ...lead,
      relevanceScore,
      rankingFactors: factors
    };
  });
  
  rankedLeads.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return rankedLeads;
}

export function reRankWithIcp(
  leads: Lead[],
  icpProfile: IcpProfile
): RankedLead[] {
  const rankedLeads = leads.map(lead => {
    const factors: RankingFactors = {
      titleMatch: calculateTitleMatchScore(lead.title, icpProfile.targetTitles),
      locationMatch: calculateLocationMatchScore(lead.location, icpProfile.targetLocations),
      industryMatch: calculateIndustryMatchScore(lead.industry, icpProfile.targetIndustries),
      seniorityMatch: calculateSeniorityMatchScore(lead.seniority, lead.title, icpProfile.targetSeniorities),
      recencyBonus: calculateRecencyBonus(lead),
      contactQuality: calculateContactQuality(lead),
      icpMatch: 1.0
    };
    
    const relevanceScore = 
      factors.titleMatch * 0.30 +
      factors.locationMatch * 0.15 +
      factors.industryMatch * 0.20 +
      factors.seniorityMatch * 0.15 +
      factors.recencyBonus * 0.05 +
      factors.contactQuality * 0.15;
    
    return {
      ...lead,
      relevanceScore,
      rankingFactors: factors
    };
  });
  
  rankedLeads.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return rankedLeads;
}

export function filterByMinRelevance(
  rankedLeads: RankedLead[],
  minScore: number = 0.4
): RankedLead[] {
  return rankedLeads.filter(lead => lead.relevanceScore >= minScore);
}
