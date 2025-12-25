// Lead Finder - State management and handlers
// Extracted from lead-finder/index.tsx to reduce file size

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Lead, ActiveFilters, AddToQueueResponse, AISearchResponse } from "./types";

interface UseLeadFinderHandlersParams {
    aiQuery: string;
    activeFilters: ActiveFilters;
    searchResults: Lead[];
    selectedLeads: Set<string>;
    currentSessionId: number | null;
    feedbackGiven: Set<string>;
    pagination: { page: number; totalPages: number } | null;
    quotaData: { quota: { remaining: number; resetDate: string } } | undefined;
    mutations: {
        smartSearchMutation: { mutate: (args: { query: string }) => void };
        filterSearchMutation: { mutate: (args: { page: number; append: boolean }) => void };
        addToQueueMutation: { mutate: (leads: Lead[]) => void };
        feedbackMutation: { mutate: (args: { leadId: string; type: string; lead: Lead; sessionId: number | null }) => void };
    };
    setSearchResults: (fn: (prev: Lead[]) => Lead[]) => void;
    setSelectedLeads: (val: Set<string>) => void;
    setFeedbackGiven: (fn: (prev: Set<string>) => Set<string>) => void;
    setActiveFilters: (fn: (prev: ActiveFilters) => ActiveFilters) => void;
    setHasSearched: (val: boolean) => void;
    setIsLoadingMore: (val: boolean) => void;
    refetchQuota: () => void;
    onContactsAdded?: () => void;
}

export function useLeadFinderHandlers({
    aiQuery, activeFilters, searchResults, selectedLeads, currentSessionId, feedbackGiven, pagination, quotaData, mutations,
    setSearchResults, setSelectedLeads, setFeedbackGiven, setActiveFilters, setHasSearched, setIsLoadingMore, refetchQuota, onContactsAdded,
}: UseLeadFinderHandlersParams) {
    const { toast } = useToast();

    const totalActiveFilters = activeFilters.jobTitles.length + activeFilters.locations.length + activeFilters.industries.length + activeFilters.companySizes.length + (activeFilters.companies?.length || 0) + (activeFilters.emailStatuses?.length || 0);

    const handleAiSearch = useCallback(() => {
        if (!aiQuery.trim()) { toast({ title: "Empty Query", description: "Please describe who you're looking for", variant: "destructive" }); return; }
        mutations.smartSearchMutation.mutate({ query: aiQuery.trim() });
    }, [aiQuery, mutations.smartSearchMutation, toast]);

    const handleManualSearch = useCallback(() => {
        if (totalActiveFilters === 0) { toast({ title: "No Filters", description: "Please add at least one filter to search", variant: "destructive" }); return; }
        mutations.filterSearchMutation.mutate({ page: 1, append: false });
    }, [totalActiveFilters, mutations.filterSearchMutation, toast]);

    const addFilter = useCallback((type: keyof ActiveFilters, value: string) => {
        if (!value.trim() || activeFilters[type]?.includes(value.trim())) return;
        setActiveFilters(prev => ({ ...prev, [type]: [...(prev[type] || []), value.trim()] }));
    }, [activeFilters, setActiveFilters]);

    const removeFilter = useCallback((type: keyof ActiveFilters, value: string) => {
        setActiveFilters(prev => ({ ...prev, [type]: (prev[type] || []).filter(v => v !== value) }));
    }, [setActiveFilters]);

    const clearAllFilters = useCallback(() => {
        setActiveFilters(() => ({ jobTitles: [], locations: [], industries: [], companySizes: [], companies: [], emailStatuses: [] }));
        setSearchResults(() => []);
        setHasSearched(false);
    }, [setActiveFilters, setSearchResults, setHasSearched]);

    const toggleLeadSelection = useCallback((id: string) => {
        const newSelection = new Set(selectedLeads);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedLeads(newSelection);
    }, [selectedLeads, setSelectedLeads]);

    const selectAllLeads = useCallback(() => {
        setSelectedLeads(selectedLeads.size === searchResults.length ? new Set() : new Set(searchResults.map(l => l.id)));
    }, [selectedLeads.size, searchResults, setSelectedLeads]);

    const handleLoadMore = useCallback(() => {
        if (pagination && pagination.page < pagination.totalPages) { setIsLoadingMore(true); mutations.filterSearchMutation.mutate({ page: pagination.page + 1, append: true }); }
    }, [pagination, setIsLoadingMore, mutations.filterSearchMutation]);

    const handleFeedback = useCallback((lead: Lead, type: "thumbs_up" | "thumbs_down") => {
        if (!feedbackGiven.has(lead.id)) mutations.feedbackMutation.mutate({ leadId: lead.id, type, lead, sessionId: currentSessionId });
    }, [feedbackGiven, mutations.feedbackMutation, currentSessionId]);

    const handleAddAllToQueue = useCallback(() => {
        if (quotaData?.quota?.remaining === 0) { toast({ title: "Monthly limit reached", description: `Quota resets on ${new Date(quotaData.quota.resetDate).toLocaleDateString()}`, variant: "destructive" }); return; }
        if (quotaData?.quota && searchResults.length > quotaData.quota.remaining) toast({ title: "Quota limit", description: `Only ${quotaData.quota.remaining} contacts will be added` });
        mutations.addToQueueMutation.mutate(searchResults);
    }, [quotaData, searchResults, mutations.addToQueueMutation, toast]);

    const handleAddSelectedToQueue = useCallback(() => {
        const toAdd = searchResults.filter(l => selectedLeads.has(l.id));
        if (toAdd.length === 0) { toast({ title: "No contacts selected", variant: "destructive" }); return; }
        if (quotaData?.quota?.remaining === 0) { toast({ title: "Monthly limit reached", variant: "destructive" }); return; }
        if (quotaData?.quota && toAdd.length > quotaData.quota.remaining) toast({ title: "Quota limit", description: `Only ${quotaData.quota.remaining} contacts will be added` });
        mutations.addToQueueMutation.mutate(toAdd);
    }, [searchResults, selectedLeads, quotaData, mutations.addToQueueMutation, toast]);

    return {
        totalActiveFilters, handleAiSearch, handleManualSearch, addFilter, removeFilter, clearAllFilters,
        toggleLeadSelection, selectAllLeads, handleLoadMore, handleFeedback, handleAddAllToQueue, handleAddSelectedToQueue,
    };
}
