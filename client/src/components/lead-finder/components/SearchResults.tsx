import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, UserPlus, Mail, AlertCircle, AlertTriangle } from "lucide-react";
import type { Lead, SearchResponse } from "../types";
import { LeadCard } from "./LeadCard";

interface SearchResultsProps {
  results: Lead[];
  pagination: SearchResponse["pagination"] | null;
  selectedLeads: Set<string>;
  feedbackGiven: Set<string>;
  quotaData?: { quota: { limit: number; used: number; remaining: number; resetDate: string } };
  isLoadingMore: boolean;
  isAddingToQueue: boolean;
  fallbackWarning?: { used: boolean; description: string; searchAttempts: number } | null;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onAddAllToQueue: () => void;
  onAddSelectedToQueue: () => void;
  onLoadMore: () => void;
  onFeedback: (lead: Lead, type: "thumbs_up" | "thumbs_down") => void;
}

export function SearchResults({ results, pagination, selectedLeads, feedbackGiven, quotaData, isLoadingMore, isAddingToQueue, fallbackWarning, onToggleSelection, onSelectAll, onAddAllToQueue, onAddSelectedToQueue, onLoadMore, onFeedback }: SearchResultsProps) {
  const leadsWithEmail = results.filter(lead => lead.email);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-6">
        <div><Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" /><h3 className="text-lg font-medium text-muted-foreground mb-2">No contacts found</h3><p className="text-sm text-muted-foreground">Try adjusting your search filters</p></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold">Results</h3>
          {pagination && <Badge variant="secondary">{pagination.totalResults.toLocaleString()} found</Badge>}
          {leadsWithEmail.length > 0 && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"><Mail className="w-3 h-3 mr-1" />{leadsWithEmail.length} with email</Badge>}
          {results.length > 0 && leadsWithEmail.length === 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />No emails available</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddAllToQueue} disabled={isAddingToQueue || (quotaData?.quota?.remaining === 0)} className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600" data-testid="button-add-all-to-queue">
            {isAddingToQueue ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : quotaData?.quota?.remaining === 0 ? <><AlertCircle className="w-4 h-4 mr-2" />Limit Reached</> : <><UserPlus className="w-4 h-4 mr-2" />Add All to Queue ({results.length})</>}
          </Button>
          <Button variant="outline" size="sm" onClick={onSelectAll} data-testid="button-select-all">{selectedLeads.size === results.length ? "Deselect All" : "Select All"}</Button>
          {selectedLeads.size > 0 && (
            <Button size="sm" onClick={onAddSelectedToQueue} disabled={isAddingToQueue || (quotaData?.quota?.remaining === 0)} data-testid="button-add-selected-to-queue">
              {isAddingToQueue ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><UserPlus className="w-4 h-4 mr-2" />Add to Campaign ({selectedLeads.size})</>}
            </Button>
          )}
        </div>
      </div>
      
      {fallbackWarning?.used && (
        <div className="mb-4 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800" data-testid="warning-fallback">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-700 dark:text-orange-400">Results may not match your exact search</p>
              <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                {fallbackWarning.description}. We broadened the search after {fallbackWarning.searchAttempts} attempts to find results. 
                Try being more specific with job titles or locations for better matches.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {results.map((lead) => (
          <LeadCard key={lead.id} lead={lead} isSelected={selectedLeads.has(lead.id)} hasFeedback={feedbackGiven.has(lead.id)} onToggleSelection={onToggleSelection} onFeedback={onFeedback} />
        ))}
      </div>

      {pagination && pagination.page < pagination.totalPages && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore} data-testid="button-load-more">
            {isLoadingMore ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : `Load More (Page ${pagination.page} of ${pagination.totalPages})`}
          </Button>
        </div>
      )}
    </div>
  );
}
