// Lead Finder Tab - Main Entry Point (Refactored)
// Extracted handlers to useLeadFinderHandlers hook

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Lead, LeadFinderTabProps, ActiveFilters, OpenSections, FilterInputs, FiltersResponse, SearchResponse, AISearchResponse, AddToQueueResponse, AdaptiveGuidance } from "./types";
import { useLeadFinderMutations } from "./hooks/useLeadFinderMutations";
import { useLeadFinderHandlers } from "./hooks/useLeadFinderHandlers";
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ jobTitles: [], locations: [], industries: [], companySizes: [], companies: [], emailStatuses: [] });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // AI search metadata
  const [searchExplanation, setSearchExplanation] = useState<string>("");
  const [searchConfidence, setSearchConfidence] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [adaptiveGuidance, setAdaptiveGuidance] = useState<AdaptiveGuidance | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<{ used: boolean; description: string; searchAttempts: number } | null>(null);

  // UI state
  const [openSections, setOpenSections] = useState<OpenSections>({ jobTitles: true, locations: true, industries: false, companySizes: false, companies: false, emailStatus: false });
  const [filterInputs, setFilterInputs] = useState<FilterInputs>({ jobTitle: "", location: "", company: "" });

  // Queries
  const { data: filters } = useQuery<FiltersResponse>({ queryKey: ['/api/leads/filters'] });
  const { data: status, isLoading: statusLoading } = useQuery<{ configured: boolean; message: string }>({ queryKey: ['/api/leads/status'] });
  const { data: quotaData, refetch: refetchQuota } = useQuery<{ success: boolean; quota: { limit: number; used: number; remaining: number; resetDate: string; canEnrich: boolean } }>({ queryKey: ['/api/leads/quota'], enabled: status?.configured });

  // Mutations
  const mutations = useLeadFinderMutations({
    onSearchSuccess: (data: AISearchResponse) => {
      setSearchResults(data.leads); setPagination(data.pagination); setCurrentSessionId(data.sessionId); setSearchExplanation(data.explanation); setSearchConfidence(data.confidence);
      setActiveFilters({ jobTitles: data.parsedFilters.jobTitles || [], locations: data.parsedFilters.locations || [], industries: data.parsedFilters.industries || [], companySizes: data.parsedFilters.companySizes || [], companies: data.parsedFilters.companies || [] });
      setAdaptiveGuidance(data.adaptiveGuidance || null); setHasSearched(true); setSelectedLeads(new Set()); setFeedbackGiven(new Set());
      // Only show warning toast if we actually got NO results AND clarification is needed
      // If we got results, don't bother the user - show guidance inline via adaptiveGuidance instead
      if (data.needsClarification && data.leads.length === 0) {
        toast({ title: "Need more information", description: data.clarifyingQuestions?.[0] || "Add a job title or location to find contacts" });
      } else if (data.leads.length === 0 && !data.needsClarification) {
        toast({ title: "No matches found", description: "Try broadening your search or adjusting filters" });
      }
    },
    onSmartSearchSuccess: (data) => {
      const fallback = data.parseInfo.fallbackUsed;
      if (fallback && fallback.level >= 2) setFallbackWarning({ used: true, description: fallback.description, searchAttempts: data.parseInfo.searchAttempts }); else setFallbackWarning(null);
    },
    onSearchFallback: (query: string) => mutations.aiParseMutation.mutate(query),
    onFilterSearchSuccess: ({ data, append }) => {
      if (append) setSearchResults(prev => { const existingIds = new Set(prev.map(l => l.id)); return [...prev, ...data.leads.filter(l => !existingIds.has(l.id))]; });
      else { setSearchResults(data.leads); setSelectedLeads(new Set()); }
      setPagination(data.pagination); setHasSearched(true); setIsLoadingMore(false);
    },
    onImportSuccess: (data) => { toast({ title: "Import Complete", description: `${data.imported} contact(s) imported${data.duplicates > 0 ? `, ${data.duplicates} duplicate(s) skipped` : ''}` }); setSelectedLeads(new Set()); },
    onAddToQueueSuccess: (data: AddToQueueResponse, leads: Lead[]) => {
      const totalLinked = data.imported + (data.linkedExisting || 0);
      let message = data.imported > 0 && (data.linkedExisting || 0) > 0 ? `${data.imported} new + ${data.linkedExisting} existing = ${totalLinked} contacts linked` : data.imported > 0 ? `${data.imported} new contact(s) linked` : (data.linkedExisting || 0) > 0 ? `${data.linkedExisting} existing contact(s) linked` : 'No new contacts linked';
      if ((data.alreadyLinked || 0) > 0) message += `. ${data.alreadyLinked} already in campaign`; if (data.failed > 0) message += `. ${data.failed} failed`; if (data.enriched > 0) message += ` (${data.enriched} enriched)`; if (data.quota) message += `. ${data.quota.remaining} credits left`;
      const isVerified = data.verification?.isVerified ?? true;
      toast({ title: isVerified ? "Added to Campaign" : "Warning: Verification Mismatch", description: isVerified ? message : `${message}. Please refresh.`, variant: isVerified ? "default" : "destructive" });
      setSelectedLeads(new Set()); if (onContactsAdded) onContactsAdded();
      const importedIds = new Set(data.importedLeadIds || []); const linkedIds = new Set(data.linkedExistingLeadIds || []); const dupIds = new Set(data.duplicateLeadIds || []);
      setSearchResults(prev => prev.filter(lead => !importedIds.has(lead.id) && !linkedIds.has(lead.id) && !dupIds.has(lead.id)));
      if (data.campaignId) { queryClient.invalidateQueries({ queryKey: ['/api/campaigns', data.campaignId, 'contacts'] }); queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active-draft'] }); }
      refetchQuota();
    },
    onFeedbackSuccess: (leadId: string) => setFeedbackGiven(prev => new Set(prev).add(leadId)),
    setIsLoadingMore, activeFilters, refetchQuota,
  });

  // Handlers
  const handlers = useLeadFinderHandlers({
    aiQuery, activeFilters, searchResults, selectedLeads, currentSessionId, feedbackGiven, pagination, quotaData, mutations,
    setSearchResults, setSelectedLeads, setFeedbackGiven, setActiveFilters, setHasSearched, setIsLoadingMore, refetchQuota, onContactsAdded,
  });

  const isSearching = mutations.aiParseMutation.isPending || mutations.filterSearchMutation.isPending || mutations.enhancedAISearchMutation.isPending || mutations.smartSearchMutation.isPending;

  if (statusLoading) return <div className="flex items-center justify-center h-full p-6"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!status?.configured) return <div className="flex items-center justify-center h-full p-6"><div className="max-w-md text-center"><AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" /><h2 className="text-xl font-semibold mb-2">Apollo API Not Configured</h2><p className="text-muted-foreground mb-6">To use Find Contacts, add your Apollo.io API key.</p></div></div>;

  return (
    <div className="flex h-full">
      <FiltersSidebar activeFilters={activeFilters} openSections={openSections} filterInputs={filterInputs} filters={filters} totalActiveFilters={handlers.totalActiveFilters} isSearching={isSearching} onOpenSectionsChange={setOpenSections} onFilterInputsChange={setFilterInputs} onAddFilter={handlers.addFilter} onRemoveFilter={handlers.removeFilter} onClearAllFilters={handlers.clearAllFilters} onSearch={handlers.handleManualSearch} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasSearched && <HeroSearch aiQuery={aiQuery} isSearching={isSearching} onQueryChange={setAiQuery} onSearch={handlers.handleAiSearch} />}
        {hasSearched && (
          <>
            <CompactSearchBar aiQuery={aiQuery} isSearching={isSearching} searchExplanation={searchExplanation} searchConfidence={searchConfidence} adaptiveGuidance={adaptiveGuidance} activeFilters={activeFilters} filters={filters} totalActiveFilters={handlers.totalActiveFilters} onQueryChange={setAiQuery} onSearch={handlers.handleAiSearch} onRemoveFilter={handlers.removeFilter} onAddSuggestion={(key, vals) => { setActiveFilters(prev => ({ ...prev, [key]: [...prev[key], ...vals] })); setAdaptiveGuidance(null); toast({ title: "Filters added", description: `Added ${vals.join(', ')} to your search` }); }} onDismissGuidance={() => setAdaptiveGuidance(null)} />
            <div className="flex-1 overflow-y-auto"><SearchResults results={searchResults} pagination={pagination} selectedLeads={selectedLeads} feedbackGiven={feedbackGiven} quotaData={quotaData ? { quota: quotaData.quota } : undefined} isLoadingMore={isLoadingMore} isAddingToQueue={mutations.addToQueueMutation.isPending} fallbackWarning={fallbackWarning} onToggleSelection={handlers.toggleLeadSelection} onSelectAll={handlers.selectAllLeads} onAddAllToQueue={handlers.handleAddAllToQueue} onAddSelectedToQueue={handlers.handleAddSelectedToQueue} onLoadMore={handlers.handleLoadMore} onFeedback={handlers.handleFeedback} /></div>
          </>
        )}
      </div>
    </div>
  );
}
