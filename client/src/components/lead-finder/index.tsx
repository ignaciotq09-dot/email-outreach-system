import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
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
} from "./types";
import { useLeadFinderMutations } from "./hooks/useLeadFinderMutations";
import { FiltersSidebar } from "./components/FiltersSidebar";
import { HeroSearch } from "./components/HeroSearch";
import { CompactSearchBar } from "./components/CompactSearchBar";
import { SearchResults } from "./components/SearchResults";

export default function LeadFinderTab({ onContactsAdded }: LeadFinderTabProps = {}) {
  const { toast } = useToast();

  // Search state
  const [aiQuery, setAiQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<SearchResponse["pagination"] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter state
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

  // UI state
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

  // Queries
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

  // Mutations
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
      if (data.needsClarification) {
        toast({
          title: "Your search could be more specific",
          description: data.clarifyingQuestions?.[0] || "Try adding more details",
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
  const handleAiSearch = () => {
    if (!aiQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please describe who you're looking for",
        variant: "destructive",
      });
      return;
    }
    mutations.smartSearchMutation.mutate({ query: aiQuery.trim() });
  };

  const handleManualSearch = () => {
    if (totalActiveFilters === 0) {
      toast({
        title: "No Filters",
        description: "Please add at least one filter to search",
        variant: "destructive",
      });
      return;
    }
    mutations.filterSearchMutation.mutate({ page: 1, append: false });
  };

  const addFilter = (type: keyof ActiveFilters, value: string) => {
    if (!value.trim() || activeFilters[type]?.includes(value.trim())) {
      return;
    }
    setActiveFilters(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), value.trim()],
    }));
  };

  const removeFilter = (type: keyof ActiveFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(v => v !== value),
    }));
  };

  const clearAllFilters = () => {
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

  const toggleLeadSelection = (id: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLeads(newSelection);
  };

  const selectAllLeads = () => {
    setSelectedLeads(
      selectedLeads.size === searchResults.length
        ? new Set()
        : new Set(searchResults.map(l => l.id))
    );
  };

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      setIsLoadingMore(true);
      mutations.filterSearchMutation.mutate({ page: pagination.page + 1, append: true });
    }
  };

  const handleFeedback = (lead: Lead, type: "thumbs_up" | "thumbs_down") => {
    if (!feedbackGiven.has(lead.id)) {
      mutations.feedbackMutation.mutate({
        leadId: lead.id,
        type,
        lead,
        sessionId: currentSessionId,
      });
    }
  };

  const handleAddAllToQueue = () => {
    if (quotaData?.quota?.remaining === 0) {
      toast({
        title: "Monthly limit reached",
        description: `Quota resets on ${new Date(quotaData.quota.resetDate).toLocaleDateString()}`,
        variant: "destructive",
      });
      return;
    }
    if (quotaData?.quota && searchResults.length > quotaData.quota.remaining) {
      toast({
        title: "Quota limit",
        description: `Only ${quotaData.quota.remaining} contacts will be added`,
      });
    }
    mutations.addToQueueMutation.mutate(searchResults);
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

  // Loading state
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not configured state
  if (!status?.configured) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Apollo API Not Configured</h2>
          <p className="text-muted-foreground mb-6">
            To use Find Contacts, add your Apollo.io API key.
          </p>
          <ol className="text-left text-sm text-muted-foreground space-y-2 bg-muted/50 p-4 rounded-lg">
            <li>1. Go to Apollo.io and sign in</li>
            <li>2. Navigate to Settings → Integrations → API</li>
            <li>3. Create a new API key</li>
            <li>4. Add as APOLLO_API_KEY in Replit Secrets</li>
          </ol>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex h-full">
      <FiltersSidebar
        activeFilters={activeFilters}
        openSections={openSections}
        filterInputs={filterInputs}
        filters={filters}
        totalActiveFilters={totalActiveFilters}
        isSearching={isSearching}
        onOpenSectionsChange={setOpenSections}
        onFilterInputsChange={setFilterInputs}
        onAddFilter={addFilter}
        onRemoveFilter={removeFilter}
        onClearAllFilters={clearAllFilters}
        onSearch={handleManualSearch}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasSearched && (
          <HeroSearch
            aiQuery={aiQuery}
            isSearching={isSearching}
            onQueryChange={setAiQuery}
            onSearch={handleAiSearch}
          />
        )}
        {hasSearched && (
          <>
            <CompactSearchBar
              aiQuery={aiQuery}
              isSearching={isSearching}
              searchExplanation={searchExplanation}
              searchConfidence={searchConfidence}
              adaptiveGuidance={adaptiveGuidance}
              activeFilters={activeFilters}
              filters={filters}
              totalActiveFilters={totalActiveFilters}
              onQueryChange={setAiQuery}
              onSearch={handleAiSearch}
              onRemoveFilter={removeFilter}
              onAddSuggestion={(key, vals) => {
                setActiveFilters(prev => ({
                  ...prev,
                  [key]: [...prev[key], ...vals],
                }));
                setAdaptiveGuidance(null);
                toast({
                  title: "Filters added",
                  description: `Added ${vals.join(', ')} to your search`,
                });
              }}
              onDismissGuidance={() => setAdaptiveGuidance(null)}
            />
            <div className="flex-1 overflow-y-auto">
              <SearchResults
                results={searchResults}
                pagination={pagination}
                selectedLeads={selectedLeads}
                feedbackGiven={feedbackGiven}
                quotaData={quotaData ? { quota: quotaData.quota } : undefined}
                isLoadingMore={isLoadingMore}
                isAddingToQueue={mutations.addToQueueMutation.isPending}
                fallbackWarning={fallbackWarning}
                onToggleSelection={toggleLeadSelection}
                onSelectAll={selectAllLeads}
                onAddAllToQueue={handleAddAllToQueue}
                onAddSelectedToQueue={handleAddSelectedToQueue}
                onLoadMore={handleLoadMore}
                onFeedback={handleFeedback}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

