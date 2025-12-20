import type { ActiveFilters, MissingSignal, GuidanceTip, SuggestedAddition, AdaptiveGuidance } from "@shared/schema";

export type EmailStatus = "verified" | "unverified";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  industry: string | null;
  companySize: string | null;
  linkedinUrl: string | null;
  photoUrl: string | null;
  emailStatus?: EmailStatus;
  icpScore?: number;
  matchReasons?: string[];
  unmatchReasons?: string[];
  seniority?: string | null;
  technologies?: string[];
  revenue?: string | null;
}

export interface SearchResponse {
  leads: Lead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
}

export interface FiltersResponse {
  industries: string[];
  companySizes: { value: string; label: string }[];
}

export interface AISearchResponse {
  sessionId: number;
  query: string;
  parsedFilters: ActiveFilters & { seniorities?: string[]; technologies?: string[]; keywords?: string[]; revenueRanges?: string[] };
  explanation: string;
  confidence: number;
  needsClarification: boolean;
  clarifyingQuestions: string[];
  leads: Lead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
  suggestions: Array<{ text: string; filters: Partial<ActiveFilters>; reasoning: string }>;
  adaptiveGuidance?: AdaptiveGuidance;
}

export interface AddToQueueResponse {
  enriched: number;
  imported: number;
  linkedExisting: number;
  alreadyLinked: number;
  failed: number;
  failedNames: string[];
  failedLeadIds?: string[];
  importedLeadIds?: string[];
  linkedExistingLeadIds?: string[];
  duplicateEmails: string[];
  duplicateLeadIds?: string[];
  skippedEnrichment?: number;
  addedContactIds?: number[];
  campaignId?: number;
  outcomes?: Array<{ leadId: string; contactId: number | null; status: 'imported' | 'linked_existing' | 'duplicate_already_linked' | 'failed' | 'quota_exceeded'; email: string | null; reason?: string }>;
  verification?: { expectedLinkedCount: number; verifiedLinkedCount: number; actualCampaignContactCount: number; isVerified: boolean; discrepancy: number };
  quota?: { limit: number; used: number; remaining: number; resetDate: string };
  quotaMessage?: string;
}

export interface LeadFinderTabProps {
  onContactsAdded?: () => void;
}

export interface OpenSections {
  jobTitles: boolean;
  locations: boolean;
  industries: boolean;
  companySizes: boolean;
  companies: boolean;
  emailStatus: boolean;
}

export interface FilterInputs {
  jobTitle: string;
  location: string;
  company: string;
}

export type { ActiveFilters, AdaptiveGuidance, MissingSignal, GuidanceTip, SuggestedAddition };
