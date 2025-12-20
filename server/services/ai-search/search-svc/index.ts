export { aiSearch } from "./main-search";
export { refineSearch, undoRefinement } from "./refinement";
export { getSearchSuggestions, saveSearch, getSavedSearches, deleteSavedSearch } from "./saved-searches";
export { trackSearchPattern, hashFilters } from "./patterns";
export type { AISearchResult, RefinementResult, ScoredLead, AdaptiveGuidance, GuidanceTip, SuggestedAddition } from "./types";
