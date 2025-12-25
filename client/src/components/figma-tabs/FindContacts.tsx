import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Import types and hooks from original lead-finder
import type {
  Lead,
  LeadFinderTabProps,
  ActiveFilters,
  OpenSections,
  FilterInputs,
  FiltersResponse,
  SearchResponse,
  AISearchResponse,
  AddToQueueResponse,
  AdaptiveGuidance
} from "@/components/lead-finder/types";
import { useLeadFinderMutations } from "@/components/lead-finder/hooks/useLeadFinderMutations";

// Keep Figma visual components
import { FiltersSidebar } from './FiltersSidebar';
import { HeroState } from './HeroState';
import { ResultsView } from './ResultsView';

// Re-export the Lead and Filters types for compatibility
export type { Lead };
export interface Filters {
  jobTitles: string[];
  locations: string[];
  industries: string[];
  companies: string[];
  companySizes: string[];
}

export function FindContacts({ isDarkMode = false, onContactsAdded }: { isDarkMode?: boolean; onContactsAdded?: () => void }) {
  const { toast } = useToast();

  // Search state - matches original lead-finder
  const [aiQuery, setAiQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<SearchResponse["pagination"] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter state - matches original lead-finder
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    jobTitles: [],
    locations: [],
    industries: [],
    companySizes: [],
    companies: [],
    emailStatuses: [],
  });

  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // AI search metadata
  const [searchExplanation, setSearchExplanation] = useState<string>("");
  const [searchConfidence, setSearchConfidence] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [adaptiveGuidance, setAdaptiveGuidance] = useState<AdaptiveGuidance | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<{
    used: boolean;
    description: string;
    searchAttempts: number;
  } | null>(null);

  // UI state for filters
  const [openSections, setOpenSections] = useState<OpenSections>({
    jobTitles: true,
    locations: true,
    industries: false,
    companySizes: false,
    companies: false,
    emailStatus: false,
  });
  const [filterInputs, setFilterInputs] = useState<FilterInputs>({
    jobTitle: "",
    location: "",
    company: "",
  });

  // Real API queries
  const { data: filters } = useQuery<FiltersResponse>({
    queryKey: ['/api/leads/filters'],
  });

  const { data: status, isLoading: statusLoading } = useQuery<{
    configured: boolean;
    message: string;
  }>({
    queryKey: ['/api/leads/status'],
  });

  const { data: quotaData, refetch: refetchQuota } = useQuery<{
    success: boolean;
    quota: {
      limit: number;
      used: number;
      remaining: number;
      resetDate: string;
      canEnrich: boolean;
    };
  }>({
    queryKey: ['/api/leads/quota'],
    enabled: status?.configured,
  });

  // Real mutations from original lead-finder
  const mutations = useLeadFinderMutations({
    onSearchSuccess: (data: AISearchResponse) => {
      setSearchResults(data.leads);
      setPagination(data.pagination);
      setCurrentSessionId(data.sessionId);
      setSearchExplanation(data.explanation);
      setSearchConfidence(data.confidence);
      setActiveFilters({
        jobTitles: data.parsedFilters.jobTitles || [],
        locations: data.parsedFilters.locations || [],
        industries: data.parsedFilters.industries || [],
        companySizes: data.parsedFilters.companySizes || [],
        companies: data.parsedFilters.companies || [],
      });
      setAdaptiveGuidance(data.adaptiveGuidance || null);
      setHasSearched(true);
      setSelectedLeads(new Set());
      setFeedbackGiven(new Set());
      // Only show warning toast if we actually got NO results AND clarification is needed
      // If we got results, don't bother the user - show guidance inline via adaptiveGuidance instead
      if (data.needsClarification && data.leads.length === 0) {
        toast({
          title: "Need more information",
          description: data.clarifyingQuestions?.[0] || "Add a job title or location to find contacts",
        });
      } else if (data.leads.length === 0 && !data.needsClarification) {
        toast({
          title: "No matches found",
          description: "Try broadening your search or adjusting filters",
        });
      }
    },
    onSmartSearchSuccess: (data) => {
      const fallback = data.parseInfo.fallbackUsed;
      // Only show warning for severe fallbacks (level 2+) where location/industry was removed
      if (fallback && fallback.level >= 2) {
        setFallbackWarning({
          used: true,
          description: fallback.description,
          searchAttempts: data.parseInfo.searchAttempts,
        });
      } else {
        setFallbackWarning(null);
      }
    },
    onSearchFallback: (query: string) => mutations.aiParseMutation.mutate(query),
    onFilterSearchSuccess: ({ data, append }) => {
      if (append) {
        setSearchResults(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          return [...prev, ...data.leads.filter(l => !existingIds.has(l.id))];
        });
      } else {
        setSearchResults(data.leads);
        setSelectedLeads(new Set());
      }
      setPagination(data.pagination);
      setHasSearched(true);
      setIsLoadingMore(false);
    },
    onImportSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `${data.imported} contact(s) imported${data.duplicates > 0 ? `, ${data.duplicates} duplicate(s) skipped` : ''}`,
      });
      setSelectedLeads(new Set());
    },
    onAddToQueueSuccess: (data: AddToQueueResponse, leads: Lead[]) => {
      const totalLinked = data.imported + (data.linkedExisting || 0);
      let message = data.imported > 0 && (data.linkedExisting || 0) > 0
        ? `${data.imported} new + ${data.linkedExisting} existing = ${totalLinked} contacts linked`
        : data.imported > 0
          ? `${data.imported} new contact(s) linked`
          : (data.linkedExisting || 0) > 0
            ? `${data.linkedExisting} existing contact(s) linked`
            : 'No new contacts linked';
      if ((data.alreadyLinked || 0) > 0) {
        message += `. ${data.alreadyLinked} already in campaign`;
      }
      if (data.failed > 0) {
        message += `. ${data.failed} failed`;
      }
      if (data.enriched > 0) {
        message += ` (${data.enriched} enriched)`;
      }
      if (data.quota) {
        message += `. ${data.quota.remaining} credits left`;
      }
      const isVerified = data.verification?.isVerified ?? true;
      toast({
        title: isVerified ? "Added to Campaign" : "Warning: Verification Mismatch",
        description: isVerified ? message : `${message}. Please refresh.`,
        variant: isVerified ? "default" : "destructive",
      });
      setSelectedLeads(new Set());
      if (onContactsAdded) {
        onContactsAdded();
      }
      const importedIds = new Set(data.importedLeadIds || []);
      const linkedIds = new Set(data.linkedExistingLeadIds || []);
      const dupIds = new Set(data.duplicateLeadIds || []);
      setSearchResults(prev => prev.filter(lead =>
        !importedIds.has(lead.id) && !linkedIds.has(lead.id) && !dupIds.has(lead.id)
      ));
      if (data.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns', data.campaignId, 'contacts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active-draft'] });
      }
      refetchQuota();
    },
    onFeedbackSuccess: (leadId: string) => {
      setFeedbackGiven(prev => new Set(prev).add(leadId));
    },
    setIsLoadingMore,
    activeFilters,
    refetchQuota,
  });

  // Computed values
  const totalActiveFilters =
    activeFilters.jobTitles.length +
    activeFilters.locations.length +
    activeFilters.industries.length +
    activeFilters.companySizes.length +
    (activeFilters.companies?.length || 0) +
    (activeFilters.emailStatuses?.length || 0);

  const isSearching =
    mutations.aiParseMutation.isPending ||
    mutations.filterSearchMutation.isPending ||
    mutations.enhancedAISearchMutation.isPending ||
    mutations.smartSearchMutation.isPending;

  // Handlers
  const handleSearch = async (query?: string) => {
    const searchQuery = query || aiQuery;
    if (!searchQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please describe who you're looking for",
        variant: "destructive",
      });
      return;
    }
    mutations.smartSearchMutation.mutate({ query: searchQuery.trim() });
  };

  const handleClearFilters = () => {
    setActiveFilters({
      jobTitles: [],
      locations: [],
      industries: [],
      companySizes: [],
      companies: [],
      emailStatuses: [],
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedLeads(new Set(searchResults.map(l => l.id)));
  };

  const handleDeselectAll = () => {
    setSelectedLeads(new Set());
  };

  const handleAddSelectedToQueue = () => {
    const toAdd = searchResults.filter(l => selectedLeads.has(l.id));
    if (toAdd.length === 0) {
      toast({ title: "No contacts selected", variant: "destructive" });
      return;
    }
    if (quotaData?.quota?.remaining === 0) {
      toast({ title: "Monthly limit reached", variant: "destructive" });
      return;
    }
    if (quotaData?.quota && toAdd.length > quotaData.quota.remaining) {
      toast({
        title: "Quota limit",
        description: `Only ${quotaData.quota.remaining} contacts will be added`,
      });
    }
    mutations.addToQueueMutation.mutate(toAdd);
  };

  const handleRemoveFilter = (type: keyof Filters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: (prev[type as keyof ActiveFilters] || []).filter((v: string) => v !== value)
    }));
  };

  const handleLoadMore = () => {
    if (!pagination || isLoadingMore) return;
    setIsLoadingMore(true);
    mutations.filterSearchMutation.mutate({
      page: pagination.page + 1,
      append: true,
      filters: activeFilters
    });
  };

  // Loading state
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Not configured state
  if (!status?.configured) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Apollo API Not Configured
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            To use Find Contacts, add your Apollo.io API key.
          </p>
          <ol className={`text-left text-sm space-y-2 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <li>1. Go to Apollo.io and sign in</li>
            <li>2. Navigate to Settings → Integrations → API</li>
            <li>3. Create a new API key</li>
            <li>4. Add as APOLLO_API_KEY in your environment</li>
          </ol>
        </div>
      </div>
    );
  }

  // Convert Figma Filters format to ActiveFilters for compatibility with Figma components
  const figmaFilters: Filters = {
    jobTitles: activeFilters.jobTitles,
    locations: activeFilters.locations,
    industries: activeFilters.industries,
    companies: activeFilters.companies || [],
    companySizes: activeFilters.companySizes,
  };

  return (
    <div className="flex h-full">
      {/* Filters Sidebar - Figma styling */}
      <FiltersSidebar
        filters={figmaFilters}
        onFiltersChange={(newFilters: Filters) => {
          setActiveFilters({
            ...activeFilters,
            ...newFilters,
          });
        }}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        isSearching={isSearching}
        activeFilterCount={totalActiveFilters}
      />

      {/* Main Content - Figma styling */}
      <div className="flex-1 overflow-auto">
        {!hasSearched && !isSearching ? (
          <HeroState
            aiQuery={aiQuery}
            onAiQueryChange={setAiQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        ) : (
          <ResultsView
            leads={searchResults}
            aiQuery={aiQuery}
            onAiQueryChange={setAiQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
            filters={figmaFilters}
            onRemoveFilter={handleRemoveFilter}
            selectedLeads={selectedLeads}
            onToggleSelectLead={handleToggleSelectLead}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            isDarkMode={isDarkMode}
            // Additional props for real functionality
            onAddSelectedToQueue={handleAddSelectedToQueue}
            isAddingToQueue={mutations.addToQueueMutation.isPending}
            quotaRemaining={quotaData?.quota?.remaining}
            // Pagination props
            pagination={pagination}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </div>
    </div>
  );
}