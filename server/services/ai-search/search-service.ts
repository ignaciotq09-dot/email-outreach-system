// Re-export from modular structure for backward compatibility
export { aiSearch, refineSearch, undoRefinement, getSearchSuggestions, saveSearch, getSavedSearches, deleteSavedSearch } from "./search-svc";
export type { AISearchResult, RefinementResult, ScoredLead, AdaptiveGuidance, GuidanceTip, SuggestedAddition } from "./search-svc";
export { recordFeedback } from "./icp-learning";
export { parseQueryFast as parseQuery, type ParsedFilters } from "./unified-query-parser";
export { getCacheStats } from "./search-cache";
