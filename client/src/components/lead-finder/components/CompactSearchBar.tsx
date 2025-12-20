import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Sparkles, Brain, Lightbulb, X, Briefcase, MapPin, Building, Users } from "lucide-react";
import type { ActiveFilters, AdaptiveGuidance, MissingSignal, FiltersResponse } from "../types";

interface CompactSearchBarProps {
  aiQuery: string;
  isSearching: boolean;
  searchExplanation: string;
  searchConfidence: number;
  adaptiveGuidance: AdaptiveGuidance | null;
  activeFilters: ActiveFilters;
  filters?: FiltersResponse;
  totalActiveFilters: number;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onRemoveFilter: (type: keyof ActiveFilters, value: string) => void;
  onAddSuggestion: (filterKey: keyof ActiveFilters, values: string[]) => void;
  onDismissGuidance: () => void;
}

export function CompactSearchBar({ aiQuery, isSearching, searchExplanation, searchConfidence, adaptiveGuidance, activeFilters, filters, totalActiveFilters, onQueryChange, onSearch, onRemoveFilter, onAddSuggestion, onDismissGuidance }: CompactSearchBarProps) {
  const getFilterKey = (field: MissingSignal): keyof ActiveFilters | null => {
    switch (field) {
      case 'location': return 'locations';
      case 'company': return 'companies';
      case 'industry': return 'industries';
      default: return null;
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Sparkles className="w-4 h-4 text-purple-400" /></div>
              <Input placeholder="Search for contacts..." value={aiQuery} onChange={(e) => onQueryChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !isSearching) onSearch(); }} className="pl-10 h-10 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-400 focus:ring-purple-400" data-testid="input-ai-search-compact" />
            </div>
            <Button onClick={onSearch} disabled={isSearching || !aiQuery.trim()} size="default" className="bg-purple-600 hover:bg-purple-700" data-testid="button-ai-search-compact">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {searchExplanation && (
        <div className="px-6 py-2 border-b border-border bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm"><Brain className="w-4 h-4 text-purple-500" /><span className="text-muted-foreground">{searchExplanation}</span></div>
            {searchConfidence > 0 && (
              <Badge variant="outline" className={`text-xs ${searchConfidence >= 0.8 ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : searchConfidence >= 0.5 ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' : 'bg-muted text-muted-foreground'}`}>
                {Math.round(searchConfidence * 100)}% confident
              </Badge>
            )}
          </div>
        </div>
      )}

      {adaptiveGuidance && adaptiveGuidance.hasRecommendations && (
        <div className="px-6 py-2 border-b border-border bg-gradient-to-r from-amber-50/30 to-yellow-50/30 dark:from-amber-950/10 dark:to-yellow-950/10">
          <div className="flex items-start gap-2 max-w-4xl mx-auto">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {adaptiveGuidance.tips.slice(0, 2).map((tip, index) => (
                <span key={index} className="text-muted-foreground" data-testid={`text-guidance-tip-${index}`}>
                  {tip.message}{tip.suggestedFilter && tip.suggestedFilter.examples.length > 0 && <span className="text-amber-600 dark:text-amber-400 ml-1">(e.g., {tip.suggestedFilter.examples.slice(0, 2).join(', ')})</span>}
                </span>
              ))}
              {adaptiveGuidance.suggestedAdditions.filter(s => ['location', 'industry', 'company'].includes(s.field)).slice(0, 2).map((suggestion, index) => {
                const filterKey = getFilterKey(suggestion.field);
                if (!filterKey) return null;
                return (
                  <Badge key={`suggestion-${index}`} variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 cursor-pointer hover-elevate" onClick={() => onAddSuggestion(filterKey, suggestion.values)} data-testid={`badge-suggestion-${index}`}>
                    <Sparkles className="w-3 h-3 mr-1" />Add {suggestion.values.slice(0, 2).join(', ')} ({suggestion.label})
                  </Badge>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={onDismissGuidance} data-testid="button-dismiss-guidance"><X className="w-3 h-3" /></Button>
          </div>
        </div>
      )}

      {totalActiveFilters > 0 && (
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {activeFilters.jobTitles.map((title) => (<Badge key={`jt-${title}`} variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"><Briefcase className="w-3 h-3" />{title}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('jobTitles', title)} /></Badge>))}
            {activeFilters.locations.map((loc) => (<Badge key={`loc-${loc}`} variant="outline" className="gap-1 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"><MapPin className="w-3 h-3" />{loc}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('locations', loc)} /></Badge>))}
            {activeFilters.industries.map((ind) => (<Badge key={`ind-${ind}`} variant="outline" className="gap-1 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"><Building className="w-3 h-3" />{ind}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('industries', ind)} /></Badge>))}
            {activeFilters.companySizes.map((size) => (<Badge key={`cs-${size}`} variant="outline" className="gap-1 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"><Users className="w-3 h-3" />{filters?.companySizes.find(s => s.value === size)?.label || size}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('companySizes', size)} /></Badge>))}
            {activeFilters.companies.map((company) => (<Badge key={`co-${company}`} variant="outline" className="gap-1 bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800"><Building className="w-3 h-3" />{company}<X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onRemoveFilter('companies', company)} /></Badge>))}
          </div>
        </div>
      )}
    </>
  );
}
