import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, AISearchResponse, SearchResponse, AddToQueueResponse, ActiveFilters } from "../types";

interface SmartSearchResponse {
  leads: Lead[];
  pagination: SearchResponse["pagination"];
  optedOutFiltered: number;
  parseInfo: {
    originalQuery: string;
    extractedFilters: {
      jobTitles: string[];
      expandedJobTitles: string[];
      locations: string[];
      industries: string[];
      companySizes: string[];
      seniorities: string[];
    };
    confidence: number;
    explanation: string;
    searchAttempts: number;
    fallbackUsed: { level: number; description: string; changes: string[] } | null;
  };
  disambiguationNeeded?: boolean;
  disambiguationReason?: string;
  alternativeInterpretations?: Array<{ description: string; filters: any; confidence: number }>;
}

interface MutationCallbacks {
  onSearchSuccess: (data: AISearchResponse) => void;
  onSearchFallback: (query: string) => void;
  onFilterSearchSuccess: (data: { data: SearchResponse; append: boolean }) => void;
  onImportSuccess: (data: { imported: number; duplicates: number }) => void;
  onAddToQueueSuccess: (data: AddToQueueResponse, leads: Lead[]) => void;
  onFeedbackSuccess: (leadId: string, type: string) => void;
  setIsLoadingMore: (loading: boolean) => void;
  activeFilters: ActiveFilters;
  refetchQuota: () => void;
  onSmartSearchSuccess?: (data: SmartSearchResponse) => void;
}

export function useLeadFinderMutations(callbacks: MutationCallbacks) {
  const { toast } = useToast();

  const smartSearchMutation = useMutation({
    mutationFn: async ({ query, page = 1 }: { query: string; page?: number }) => {
      const response = await apiRequest('POST', '/api/leads/smart-search', {
        query,
        page,
        perPage: 25,
      });
      return response as SmartSearchResponse;
    },
    onSuccess: (data) => {
      if (data.parseInfo.fallbackUsed) {
        toast({
          title: "Search adjusted for better results",
          description: data.parseInfo.fallbackUsed.description
        });
      }

      if (data.disambiguationNeeded && data.leads.length > 0) {
        toast({
          title: "Results may vary",
          description: data.disambiguationReason || "Your search term has multiple meanings"
        });
      }

      const transformedData: AISearchResponse = {
        leads: data.leads,
        pagination: data.pagination,
        sessionId: 0,
        explanation: data.parseInfo.explanation,
        confidence: data.parseInfo.confidence,
        parsedFilters: {
          jobTitles: data.parseInfo.extractedFilters.jobTitles,
          locations: data.parseInfo.extractedFilters.locations,
          industries: data.parseInfo.extractedFilters.industries,
          companySizes: data.parseInfo.extractedFilters.companySizes,
          companies: []
        },
        needsClarification: data.disambiguationNeeded || false,
        clarifyingQuestions: data.disambiguationReason ? [data.disambiguationReason] : [],
        adaptiveGuidance: null
      };

      callbacks.onSearchSuccess(transformedData);

      if (callbacks.onSmartSearchSuccess) {
        callbacks.onSmartSearchSuccess(data);
      }
    },
    onError: (error: any, variables) => {
      console.error('[SmartSearch] Error:', error);
      toast({
        title: "Trying alternative search",
        description: "Using fallback method...",
      });
      enhancedAISearchMutation.mutate({ query: variables.query, page: variables.page });
    },
  });

  const enhancedAISearchMutation = useMutation({
    mutationFn: async ({ query, page = 1 }: { query: string; page?: number }) => {
      const response = await apiRequest('POST', '/api/ai-search/search', {
        query,
        page,
        perPage: 25,
        useIcpScoring: true,
      });
      const envelope = response as { success: boolean; data: AISearchResponse };
      if (!envelope.success || !envelope.data) {
        throw new Error('AI search failed');
      }
      return envelope.data;
    },
    onSuccess: callbacks.onSearchSuccess,
    onError: (error: any, variables) => {
      console.error('[EnhancedAISearch] Error:', error);
      toast({
        title: "Search issue",
        description: "Falling back to standard search",
      });
      callbacks.onSearchFallback(variables.query);
    },
  });

  const aiParseMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/leads/ai-parse', { query });
      return response as { filters: ActiveFilters; usedFallback?: boolean };
    },
    onSuccess: (data) => {
      const safeFilters = {
        ...data.filters,
        companies: data.filters.companies || [],
      };
      if (data.usedFallback) {
        toast({
          title: "Searching by keyword",
          description: "Tip: For best results, include a job title, location, or industry",
        });
      }
      filterSearchMutation.mutate({ page: 1, append: false, filters: safeFilters });
    },
    onError: () => {
      toast({
        title: "Searching...",
        description: "Trying to find matching contacts",
      });
    },
  });

  const filterSearchMutation = useMutation({
    mutationFn: async ({ page, append, filters }: { page: number; append: boolean; filters?: ActiveFilters }) => {
      const searchFilters = filters || callbacks.activeFilters;
      const response = await apiRequest('POST', '/api/leads/search', {
        jobTitles: searchFilters.jobTitles,
        locations: searchFilters.locations,
        industries: searchFilters.industries,
        companySizes: searchFilters.companySizes,
        emailStatuses: searchFilters.emailStatuses || [],
        page,
        perPage: 25,
      });
      return { data: response as SearchResponse, append };
    },
    onSuccess: callbacks.onFilterSearchSuccess,
    onError: (error: any) => {
      callbacks.setIsLoadingMore(false);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for contacts",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      const response = await apiRequest('POST', '/api/leads/import', {
        leads: leads.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          position: lead.title,
          location: lead.location,
          industry: lead.industry,
          companySize: lead.companySize,
          linkedinUrl: lead.linkedinUrl,
        })),
      });
      return response as { imported: number; duplicates: number; errors: number; duplicateEmails: string[] };
    },
    onSuccess: (data) => {
      callbacks.onImportSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      });
    },
  });

  const addToQueueMutation = useMutation({
    mutationFn: async (leads: Lead[]) => {
      // Step 1: Enrich leads to reveal emails (uses Apollo credits)
      const leadsToEnrich = leads.filter(lead => !lead.email);
      let enrichedLeads = [...leads];

      if (leadsToEnrich.length > 0) {
        try {
          const enrichResponse = await apiRequest('POST', '/api/leads/enrich', {
            leads: leadsToEnrich.map(lead => ({
              id: lead.id,
              firstName: lead.firstName,
              lastName: lead.lastName,
              company: lead.company,
              linkedinUrl: lead.linkedinUrl,
            })),
          }) as {
            enriched: Array<{ id: string; email: string; phone?: string;[key: string]: any }>;
            failed: string[];
            quota: { limit: number; used: number; remaining: number; resetDate: string };
          };

          // Merge enriched data back into leads
          const enrichedMap = new Map(enrichResponse.enriched.map(e => [e.id, e]));
          enrichedLeads = leads.map(lead => {
            const enriched = enrichedMap.get(lead.id);
            if (enriched) {
              return { ...lead, email: enriched.email || lead.email, phone: enriched.phone || lead.phone };
            }
            return lead;
          });

          console.log(`[AddToQueue] Enriched ${enrichResponse.enriched.length} leads with emails`);
        } catch (enrichError: any) {
          console.error('[AddToQueue] Enrichment failed, proceeding with original data:', enrichError);
          // Continue with original leads if enrichment fails
        }
      }

      // Step 2: Add enriched leads to queue
      const response = await apiRequest('POST', '/api/leads/add-to-queue', {
        leads: enrichedLeads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          title: lead.title,
          location: lead.location,
          industry: lead.industry,
          companySize: lead.companySize,
          linkedinUrl: lead.linkedinUrl,
        })),
      });
      return response as AddToQueueResponse;
    },
    onSuccess: (data, variables) => {
      callbacks.onAddToQueueSuccess(data, variables);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add",
        description: error.message || "Failed to add contacts to campaign",
        variant: "destructive",
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ leadId, type, lead, sessionId }: {
      leadId: string;
      type: "thumbs_up" | "thumbs_down";
      lead: Lead;
      sessionId: number | null;
    }) => {
      return apiRequest('POST', '/api/ai-search/feedback', {
        feedbackType: type,
        leadAttributes: {
          title: lead.title,
          seniority: lead.seniority,
          industry: lead.industry,
          companySize: lead.companySize,
          location: lead.location,
          technologies: lead.technologies,
        },
        apolloLeadId: leadId,
        searchSessionId: sessionId,
      });
    },
    onSuccess: (_, variables) => {
      callbacks.onFeedbackSuccess(variables.leadId, variables.type);
      toast({
        title: variables.type === "thumbs_up" ? "Great!" : "Got it",
        description: "We'll use this to improve future suggestions",
      });
    },
  });

  return {
    smartSearchMutation,
    enhancedAISearchMutation,
    aiParseMutation,
    filterSearchMutation,
    importMutation,
    addToQueueMutation,
    feedbackMutation,
  };
}

